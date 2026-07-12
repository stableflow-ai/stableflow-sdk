import { useCallback, useMemo, useState } from 'react';
import { useSwitchChain } from 'wagmi';
import { useTransactionStore } from './stores/transactionStore';
import useWalletsStore from './stores/use-wallets';
import { ChainSelector } from './components/ChainSelector';
import { QuoteResult } from './components/QuoteResult';
import { WalletConnector } from './components/WalletConnector';
import { TransactionHistory } from './components/TransactionHistory';
import { getChainByKey, getBridgeTokens } from './utils/chains';
import type { QuoteResult as QuoteResultType, Transaction } from './types';
import { useWallet } from './hooks/useWallet';
import Big from 'big.js';
import { ethers } from 'ethers';
import './App.css';
import type { TokenConfig } from '@stableflow/core';
import {
  BridgeSFA,
  type GetAllQuoteParams,
  type BuildTransactionResult,
  type EvmTxData,
  type PermitSignature,
} from '@stableflow/bridges';

/**
 * Token price map passed to `BridgeSFA.getAllQuote` for gas/fee USD estimates and route comparisons.
 *
 * TODO (production): Replace this hardcoded object with a live price API call. The response must
 * cover every asset involved in the user's selected bridge route — not only the source/destination
 * chains, but any intermediate chains used for gas or hop fees.
 *
 * Required price categories:
 * 1. **Gas / native tokens** — one entry per chain's native asset, keyed by `TokenConfig.nativeToken.symbol`
 *    from `@stableflow/core` (`tokens`, `usdtTokens`, `usdcTokens`, `frxusdTokens`, etc.).
 *    Example: bridging from Ethereum requires `{ ETH: "1699.85" }` because `tokens` entries that
 *    use `chains.eth` expose `nativeToken.symbol === "ETH"`.
 * 2. **Bridge / stablecoin tokens** — one entry per transferable asset symbol (`TokenConfig.symbol`),
 *    e.g. `USDT`, `USDC`, `frxUSD`. The SDK uses these to convert input/output amounts to USD.
 *    Non-USD stablecoins will be added over time; each new stable must have its own price entry
 *    (do not assume all stables are pegged to `$1` — use real market/oracle prices when available).
 *
 * Format: `Record<string, string>` — keys are token symbols, values are USD prices as decimal strings.
 * Lookup is case-insensitive via `getPrice()` in `@stableflow/core`.
 *
 * Example response shape for an Ethereum → Arbitrum USDT route:
 * `{ ETH: "1699.85", USDT: "1.0001" }`
 * (Both chains share `nativeToken.symbol === "ETH"`; gas on either side is priced via the ETH entry.)
 */
const prices: Record<string, string> = {
  TRX: '0.317841',
  ETH: '1699.85',
  POL: '0.073321',
  NEAR: '1.9',
  SOL: '80.56',
  BNB: '562.01',
  AVAX: '6.76',
  XDAI: '0.999904',
  APT: '0.610593',
  BERA: '0.218424',
  OKB: '80.07',
  XPL: '0.092194',
  EURe: '1.14',
  PROS: '0.01',
};

type StepKey = 'approveReset' | 'approve' | 'permit' | 'calldata' | 'report';
type StepStatus = 'idle' | 'active' | 'done' | 'error';

interface StepItem {
  key: StepKey;
  label: string;
  status: StepStatus;
  detail?: string;
}

const STATUS_LABEL: Record<StepStatus, string> = {
  idle: 'Waiting',
  active: 'In progress...',
  done: 'Done',
  error: 'Failed',
};

const STATUS_COLOR: Record<StepStatus, string> = {
  idle: '#94a3b8',
  active: '#667eea',
  done: '#16a34a',
  error: '#dc2626',
};

const STEP_ACTION_LABEL: Record<StepKey, string> = {
  approveReset: 'Sign reset allowance',
  approve: 'Sign approve',
  permit: 'Sign permit',
  calldata: 'Sign & broadcast calldata',
  report: 'Report transaction',
};

const toTxRequest = (tx: EvmTxData): ethers.TransactionRequest => ({
  to: tx.to,
  data: tx.data,
  value: tx.value ? BigInt(tx.value) : 0n,
  ...(tx.gasLimit ? { gasLimit: BigInt(tx.gasLimit) } : {}),
});

const buildStepsFromResult = (build: BuildTransactionResult): StepItem[] => {
  const steps: StepItem[] = [];
  let n = 1;

  if (build.approveResetTx) {
    steps.push({ key: 'approveReset', label: `${n++}. Reset allowance to 0`, status: 'idle' });
  }
  if (build.approveTx) {
    steps.push({ key: 'approve', label: `${n++}. Sign approve`, status: 'idle' });
  }
  if (build.permitTypedData) {
    steps.push({ key: 'permit', label: `${n++}. Sign permit`, status: 'idle' });
  }
  steps.push({ key: 'calldata', label: `${n++}. Sign calldata`, status: 'idle' });
  steps.push({ key: 'report', label: `${n++}. Report transaction`, status: 'idle' });

  return steps;
};

const DEFAULT_SLIPPAGE = 0.05;
const MIN_SLIPPAGE = 0.01;
const MAX_SLIPPAGE = 1;

const normalizeSlippage = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const rounded = Math.round(parsed * 100) / 100;
  return Math.min(MAX_SLIPPAGE, Math.max(MIN_SLIPPAGE, rounded));
};

const formatSlippageInput = (value: number): string => value.toFixed(2);

const decorateStepsWithChainHints = (build: BuildTransactionResult): StepItem[] => {
  return buildStepsFromResult(build).map((step) => {
    if (step.key === 'permit' && build.permitTypedData) {
      const { domain, token, spender, owner } = build.permitTypedData;
      return {
        ...step,
        detail: `Permit chainId: ${domain.chainId}, token: ${token}, spender: ${spender}, owner: ${owner}`,
      };
    }
    if (['approveReset', 'approve', 'calldata'].includes(step.key)) {
      return {
        ...step,
        detail: `From chainId: ${build.chainId}`,
      };
    }
    return step;
  });
};

function App() {
  const [fromChain, setFromChain] = useState<string>();
  const [toChain, setToChain] = useState<string>();
  const [amount, setAmount] = useState<string>('');
  const [slippageInput, setSlippageInput] = useState<string>(formatSlippageInput(DEFAULT_SLIPPAGE));
  const [toAddress, setToAddress] = useState<string>('');
  const [fromWalletAddress, setFromWalletAddress] = useState<string | null>(null);
  const [toWalletAddress, setToWalletAddress] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteResultType[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [mpcBuild, setMpcBuild] = useState<BuildTransactionResult | null>(null);
  const [mpcPermitSignature, setMpcPermitSignature] = useState<PermitSignature | undefined>();
  const [mpcTxHash, setMpcTxHash] = useState<string | undefined>();
  const [stepLoading, setStepLoading] = useState<StepKey | null>(null);

  const { addTransaction } = useTransactionStore();
  const evmChainId = useWalletsStore((state) => state.evm.chainId);
  const { switchChainAsync } = useSwitchChain();

  const [fromChainConfig, toChainConfig] = useMemo((): [TokenConfig | undefined, TokenConfig | undefined] => {
    return [fromChain ? getChainByKey(fromChain) : undefined, toChain ? getChainByKey(toChain) : undefined];
  }, [fromChain, toChain]);

  const { wallet: fromWallet, switchNetwork } = useWallet(fromChainConfig ?? null);

  const recipient =
    (toAddress || toWalletAddress || fromWalletAddress || '').trim() || fromWalletAddress || '';

  const resetMpcFlow = useCallback(() => {
    setSteps([]);
    setMpcBuild(null);
    setMpcPermitSignature(undefined);
    setMpcTxHash(undefined);
    setStepLoading(null);
  }, []);

  const handleFromWalletAddressChange = useCallback((addr?: string | null) => {
    const next = addr ?? null;
    setFromWalletAddress((prev) => {
      if (prev !== next) {
        resetMpcFlow();
      }
      return next;
    });
  }, [resetMpcFlow]);

  const handleToWalletAddressChange = useCallback((addr?: string | null) => {
    const next = addr ?? null;
    setToWalletAddress((prev) => {
      if (prev !== next) {
        resetMpcFlow();
      }
      return next;
    });
  }, [resetMpcFlow]);

  const setStep = (key: StepKey, status: StepStatus, detail?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, status, detail: detail ?? s.detail } : s))
    );
  };

  const getSigner = (): ethers.Signer | undefined => {
    return fromWallet?.wallet?.signer as ethers.Signer | undefined;
  };

  const getFromTokenChainId = (): number => {
    const chainId = fromChainConfig?.chainId ?? mpcBuild?.chainId;
    if (!chainId) {
      throw new Error('From token chainId is missing');
    }
    return chainId;
  };

  const ensureEvmChain = async (chainId: number, context: string) => {
    if (!chainId) {
      throw new Error(`${context}: chainId is missing`);
    }
    if (evmChainId !== chainId) {
      await switchChainAsync({ chainId });
    }
  };

  const validateMpcPrerequisites = (): string | null => {
    if (!selectedQuote || !fromChainConfig || !toChainConfig || !fromWalletAddress || !fromWallet?.wallet) {
      return 'Please select a quote and ensure wallet is connected';
    }
    if (fromChainConfig.chainType !== 'evm') {
      return 'API-driven custody demo supports EVM source chains only';
    }
    if (!getSigner()) {
      return 'No signer available. Connect an EVM wallet (it acts as the external MPC signer).';
    }
    return null;
  };

  const isStepReady = (key: StepKey): boolean => {
    const step = steps.find((s) => s.key === key);
    if (!step || !mpcBuild) {
      return false;
    }
    if (step.status === 'done' || step.status === 'active') {
      return false;
    }

    const index = steps.findIndex((s) => s.key === key);
    if (index <= 0) {
      return true;
    }

    return steps.slice(0, index).every((s) => s.status === 'done');
  };

  const handleSlippageChange = (value: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }
    setSlippageInput(value);
    resetMpcFlow();
  };

  const handleSlippageBlur = () => {
    const normalizedSlippage = normalizeSlippage(slippageInput);
    if (normalizedSlippage === null) {
      setSlippageInput(formatSlippageInput(DEFAULT_SLIPPAGE));
      setError('Slippage must be between 0.01 and 1.');
      return;
    }
    setSlippageInput(formatSlippageInput(normalizedSlippage));
  };

  const handleGetQuote = async () => {
    const normalizedSlippage = normalizeSlippage(slippageInput);
    if (
      !fromChainConfig ||
      !toChainConfig ||
      !amount ||
      !fromWalletAddress ||
      !recipient ||
      !fromWallet?.wallet
    ) {
      setError('Please fill in all required fields and connect from chain wallet');
      return;
    }
    if (normalizedSlippage === null) {
      setError('Slippage must be between 0.01 and 1.');
      return;
    }

    setLoading(true);
    setError(null);
    setQuotes([]);
    setSelectedQuote(null);
    resetMpcFlow();

    try {
      const quoteRequest: GetAllQuoteParams = {
        dry: false,
        minInputAmount: '0.1',
        prices,
        fromToken: fromChainConfig,
        toToken: toChainConfig,
        wallet: fromWallet.wallet,
        recipient,
        refundTo: fromWalletAddress,
        amountWei: Big(amount)
          .times(10 ** fromChainConfig.decimals)
          .toString(),
        slippageTolerance: normalizedSlippage,
        oneclickParams: {
          appFees: [
            {
              recipient: 'stableflow.near',
              fee: 1,
            },
          ],
        },
        ...(fromChainConfig.chainType === 'evm' && fromWallet?.wallet
          ? {
            evmWallet: fromWallet.wallet,
            evmAddress: fromWalletAddress,
          }
          : {}),
      };

      const response = await BridgeSFA.getAllQuote(quoteRequest);

      console.log("quote response: %o", response);

      if (response && Array.isArray(response)) {
        const validQuotes = response.filter((q) => q.quote && !q.error);

        if (validQuotes.length === 0) {
          const errors = response
            .filter((q) => q.error)
            .map((q) => `${q.serviceType}: ${q.error}`)
            .join(', ');
          setError(`No valid quotes available. ${errors || 'Please try again.'}`);
        } else {
          setQuotes(validQuotes);
          const firstValid = validQuotes.find((q) => q.quote && !q.error);
          if (firstValid) {
            setSelectedQuote(firstValid);
          }
        }
      } else {
        setError('Invalid response format from quote service');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get quote';
      setError(message);
      console.error('Quote error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareMpcFlow = async () => {
    const validationError = validateMpcPrerequisites();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    resetMpcFlow();

    const quote = selectedQuote!.quote;
    const serviceType = selectedQuote!.serviceType;

    console.log("selectedQuote: %o", quote);

    if (quote.errMsg) {
      setError(`invalid quote: ${quote.errMsg}`);
      setLoading(false);
      return;
    }

    try {
      const build = await BridgeSFA.buildTransaction(serviceType, { quote });
      console.log('buildTransaction: %o', build);

      setMpcBuild(build);
      setSteps(decorateStepsWithChainHints(build));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to build transaction';
      setError(message);
      console.error('Build transaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunStep = async (stepKey: StepKey) => {
    const validationError = validateMpcPrerequisites();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!mpcBuild || !selectedQuote || !fromChainConfig || !toChainConfig || !fromWalletAddress) {
      setError('Build transaction first');
      return;
    }
    if (!isStepReady(stepKey)) {
      return;
    }

    const signer = getSigner()!;
    const quote = selectedQuote.quote;
    const serviceType = selectedQuote.serviceType;

    setStepLoading(stepKey);
    setStep(stepKey, 'active');
    setError(null);

    try {
      if (stepKey === 'approveReset') {
        if (!mpcBuild.approveResetTx) {
          throw new Error('Reset allowance transaction is not available');
        }
        await ensureEvmChain(getFromTokenChainId(), 'Sign reset allowance');
        const resetRes = await signer.sendTransaction(toTxRequest(mpcBuild.approveResetTx));
        await resetRes.wait();
        setStep('approveReset', 'done', resetRes.hash);
      }

      if (stepKey === 'approve') {
        if (!mpcBuild.approveTx) {
          throw new Error('Approve transaction is not available');
        }
        await ensureEvmChain(getFromTokenChainId(), 'Sign approve');
        const approveRes = await signer.sendTransaction(toTxRequest(mpcBuild.approveTx));
        await approveRes.wait();
        setStep('approve', 'done', approveRes.hash);
      }

      if (stepKey === 'permit') {
        if (!mpcBuild.permitTypedData) {
          throw new Error('Permit typed data is not available');
        }
        const permitTypedData = mpcBuild.permitTypedData;
        console.log('permitTypedData: %o', permitTypedData);

        const permitChainId = Number(permitTypedData.domain.chainId);
        await ensureEvmChain(permitChainId, 'Sign permit');

        const { domain, types, values, deadline, nonce, owner } = permitTypedData;
        const raw = await signer.signTypedData(domain, types, values);
        const sig = ethers.Signature.from(raw);
        setMpcPermitSignature({
          amount: values.value,
          deadline,
          nonce,
          owner,
          r: sig.r,
          s: sig.s,
          v: sig.v as 27 | 28,
        });
        setStep('permit', 'done');

        const fromChainId = getFromTokenChainId();
        if (fromChainId !== permitChainId) {
          await ensureEvmChain(fromChainId, 'Return to from token chain after permit');
        }
      }

      if (stepKey === 'calldata') {
        await ensureEvmChain(getFromTokenChainId(), 'Sign calldata');
        const txResponse = await signer.sendTransaction(toTxRequest(mpcBuild.tx));
        await txResponse.wait();
        setMpcTxHash(txResponse.hash);
        setStep('calldata', 'done', txResponse.hash);
      }

      if (stepKey === 'report') {
        const hash = mpcTxHash || steps.find((s) => s.key === 'calldata')?.detail;
        if (!hash) {
          throw new Error('Source-chain transaction hash is required. Complete sign calldata first.');
        }
        await BridgeSFA.report(serviceType, {
          quote,
          hash,
          permitSignature: mpcPermitSignature,
        });
        setStep('report', 'done');

        const tx: Transaction = {
          id: hash,
          fromToken: fromChainConfig,
          toToken: toChainConfig,
          fromChain: fromChainConfig.chainName,
          toChain: toChainConfig.chainName,
          txHash: hash,
          toChainTxHash: '',
          amount,
          fromAddress: fromWalletAddress,
          toAddress: (toAddress || toWalletAddress || fromWalletAddress) as string,
          status: 'pending',
          timestamp: Date.now(),
          serviceType,
          depositAddress: quote.quote?.depositAddress,
          quote,
        };

        addTransaction(tx);
        setAmount('');
        setQuotes([]);
        setSelectedQuote(null);
        resetMpcFlow();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Step failed';
      setError(message);
      setStep(stepKey, 'error');
      console.error(`Step ${stepKey} error:`, err);
    } finally {
      setStepLoading(null);
    }
  };

  const [fromChainBalance, setFromChainBalance] = useState<string>('');
  const [fromChainBalanceLoading, setFromChainBalanceLoading] = useState(false);
  const getFromChainBalance = async (_fromChainConfig?: TokenConfig) => {
    setFromChainBalanceLoading(true);
    const cfg = _fromChainConfig || fromChainConfig;
    if (!cfg || !fromWallet?.account) {
      setFromChainBalanceLoading(false);
      setFromChainBalance('');
      return;
    }
    try {
      const balance = await fromWallet.wallet.getBalance(cfg, fromWallet.account);
      setFromChainBalance(
        Big(balance || 0)
          .div(10 ** cfg.decimals)
          .toFixed(cfg.decimals, 0)
      );
    } catch {
      setFromChainBalance('');
    }
    setFromChainBalanceLoading(false);
  };

  const amountLabel = fromChainConfig?.symbol ? `Amount (${fromChainConfig.symbol})` : 'Amount';

  return (
    <div className="app">
      <header className="app-header">
        <h1>StableFlow Demo EVM (MPC / API-driven custody)</h1>
        <p>
          Stableflow returns unsigned tx data / EIP-712 typed data. Signing and
          broadcasting are done by an external MPC signer (Fireblocks, etc.).
          In this demo the connected browser wallet stands in for that MPC signer.
        </p>
        <p style={{ color: '#f00', fontWeight: 600 }}>
          Source chain is restricted to EVM.
        </p>
      </header>

      <main className="app-main">
        <div className="bridge-form">
          <div className="form-section">
            <h2>From</h2>
            <ChainSelector
              label="From Chain (EVM)"
              value={fromChain}
              onChange={(_fromContractAddress) => {
                const cfg = getChainByKey(_fromContractAddress);
                if (cfg) switchNetwork(cfg);
                setFromChain(_fromContractAddress);
                resetMpcFlow();
                void getFromChainBalance(cfg);
              }}
              excludeContractAddress={toChain}
            />
            {fromChainConfig && (
              <div className="quote-header">
                <WalletConnector
                  chain={fromChainConfig}
                  onAddressChange={handleFromWalletAddressChange}
                />
                <div className="wallet-connected">
                  <div>{fromChainBalanceLoading ? 'Loading...' : fromChainBalance}</div>
                  <button
                    type="button"
                    className="btn-remove"
                    style={{ background: '#667eea', opacity: fromChainBalanceLoading ? 0.5 : 1 }}
                    onClick={() => void getFromChainBalance()}
                    disabled={fromChainBalanceLoading}
                  >
                    Fetch Balance
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>To</h2>
            <ChainSelector
              label="To Chain"
              value={toChain}
              onChange={(value) => {
                setToChain(value);
                resetMpcFlow();
              }}
              excludeContractAddress={fromChain}
              tokens={getBridgeTokens()}
              placeholder="Select destination chain"
            />
            <div className="to-address-input">
              <label>Recipient Address</label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => {
                  setToAddress(e.target.value);
                  resetMpcFlow();
                }}
                placeholder="Enter address"
                className="input-address"
              />
            </div>
            {toChainConfig?.chainType === 'evm' && (
              <WalletConnector
                chain={toChainConfig}
                onAddressChange={handleToWalletAddressChange}
              />
            )}
          </div>

          <div className="form-section">
            <label>{amountLabel}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                resetMpcFlow();
              }}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="input-amount"
            />
            <label htmlFor="slippage-input" style={{ marginTop: '1rem' }}>
              Slippage tolerance (%)
            </label>
            <input
              id="slippage-input"
              type="number"
              value={slippageInput}
              onChange={(e) => handleSlippageChange(e.target.value)}
              onBlur={handleSlippageBlur}
              placeholder="0.05"
              step="0.01"
              min="0.01"
              max="1"
              className="input-amount"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => void handleGetQuote()}
              disabled={loading || !fromChain || !toChain || !amount || !fromWalletAddress}
              className="btn-primary"
            >
              {loading ? 'Getting Quote...' : 'Get Quote'}
            </button>
            {selectedQuote && (
              <>
                <QuoteResult
                  quotes={quotes}
                  onSelectQuote={(quote) => {
                    setSelectedQuote(quote);
                    resetMpcFlow();
                  }}
                  selectedQuote={selectedQuote}
                />
                <button
                  type="button"
                  onClick={() => void handlePrepareMpcFlow()}
                  disabled={loading || stepLoading !== null}
                  className="btn-submit"
                >
                  {loading ? 'Building...' : 'Build, sign & report (MPC)'}
                </button>

                {steps.length > 0 && (
                  <div className="form-section" style={{ marginTop: 16, width: '100%' }}>
                    <h2>MPC signing steps</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {steps.map((s) => {
                        const ready = isStepReady(s.key);
                        const running = stepLoading === s.key;
                        return (
                          <li
                            key={s.key}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              padding: '12px 0',
                              borderBottom: '1px solid #f1f5f9',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 12,
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>{s.label}</span>
                              <span style={{ color: STATUS_COLOR[s.status], fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {STATUS_LABEL[s.status]}
                              </span>
                            </div>
                            {s.detail && (
                              <span
                                style={{ fontSize: 12, color: '#94a3b8', wordBreak: 'break-all' }}
                                title={s.detail}
                              >
                                {s.detail}
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ alignSelf: 'flex-start' }}
                              disabled={!ready || stepLoading !== null || loading}
                              onClick={() => void handleRunStep(s.key)}
                            >
                              {running ? 'Processing...' : STEP_ACTION_LABEL[s.key]}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <TransactionHistory />
      </main>
    </div>
  );
}

export default App;
