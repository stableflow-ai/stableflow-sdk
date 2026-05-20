import { useMemo, useState } from 'react';
import { useTransactionStore } from './stores/transactionStore';
import { ChainSelector } from './components/ChainSelector';
import { QuoteResult } from './components/QuoteResult';
import { WalletConnector } from './components/WalletConnector';
import { TransactionHistory } from './components/TransactionHistory';
import { AnimatedGradientBackdrop } from './components/AnimatedGradientBackdrop';
import { getBridgeTokens, getChainByKey } from './utils/chains';
import type { QuoteResult as QuoteResultType, Transaction } from './types';
import { useWallet } from './hooks/useWallet';
import Big from 'big.js';
import './App.css';
import type { TokenConfig } from '@stableflow/core';
import { Csl } from '@stableflow/core';
import { BridgeSFA, getQuoteModes, type GetAllQuoteParams } from '@stableflow/bridges';
import useWalletsStore from './stores/use-wallets';
import { useSwitchChain } from 'wagmi';

const prices: Record<string, string> = {
  TRX: '0.293733',
  ETH: '2954.29',
  POL: '0.11727',
  NEAR: '1.45',
  SOL: '123.51',
  BNB: '901.08',
  AVAX: '11.83',
  XDAI: '0.999483',
  APT: '1.56',
  BERA: '0.595966',
  OKB: '104.55',
  XPL: '0.1403',
};

const bridgeTokens = getBridgeTokens();

function App() {
  const [fromChain, setFromChain] = useState<string>();
  const [toChain, setToChain] = useState<string>();
  const [amount, setAmount] = useState<string>('');
  const [toAddress, setToAddress] = useState<string>('');
  const [fromWalletAddress, setFromWalletAddress] = useState<string | null>(null);
  const [toWalletAddress, setToWalletAddress] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteResultType[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addTransaction } = useTransactionStore();
  const wallets = useWalletsStore();
  const { switchChainAsync } = useSwitchChain();
  const cs = new Csl(true);
  const csl = cs.log;

  const [fromChainConfig, toChainConfig] = useMemo((): [TokenConfig | undefined, TokenConfig | undefined] => {
    return [fromChain ? getChainByKey(fromChain) : undefined, toChain ? getChainByKey(toChain) : undefined];
  }, [fromChain, toChain]);

  const { wallet: fromWallet, switchNetwork } = useWallet(fromChainConfig ?? null);

  const recipient =
    (toAddress || toWalletAddress || fromWalletAddress || '').trim() || fromWalletAddress || '';

  const handleGetQuote = async () => {
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

    setLoading(true);
    setError(null);
    setQuotes([]);
    setSelectedQuote(null);

    try {
      const quoteRequest: GetAllQuoteParams = {
        dry: false,
        minInputAmount: '0.1',
        prices,
        fromToken: fromChainConfig,
        toToken: toChainConfig,
        wallet: fromWallet.wallet as GetAllQuoteParams['wallet'],
        recipient,
        refundTo: fromWalletAddress,
        amountWei: Big(amount)
          .times(10 ** fromChainConfig.decimals)
          .toString(),
        slippageTolerance: 0.5,
        oneclickParams: {
          appFees: [
            {
              recipient: 'stableflow.near',
              fee: 0,
            },
          ],
        },
        ...(fromChainConfig.chainType === 'evm' && fromWallet?.wallet
          ? {
            evmWallet: fromWallet.wallet as GetAllQuoteParams['wallet'],
            evmAddress: fromWalletAddress,
          }
          : {}),
      };

      const response = await BridgeSFA.getAllQuote(quoteRequest);

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

  const getPermitSignature = async (quote: any) => {
    if (!quote || !quote?.needPermit) {
      return void 0;
    }

    const {
      permitToken,
      permitSpender,
      permitAmountWei,
      permitAdditionalData,
      quoteParam,
    } = quote;

    const evmWallet: any = wallets.evm.wallet;

    if (!evmWallet) {
      throw new Error("Permit wallet not connected");
    }

    await switchChainAsync({ chainId: permitToken.chainId! });

    const signature = await evmWallet?.signTypedData({
      fromToken: permitToken,
      amountWei: permitAmountWei,
      spender: permitSpender,
    });

    // After signing, need to switch back to the source chain
    if (quoteParam.fromToken.chainType === "evm") {
      await switchChainAsync({ chainId: quoteParam.fromToken.chainId! });
    }

    csl("transfer", "sky-600", "permit signature: %o", signature);

    const permitResult = {
      amount: signature.value,
      deadline: signature.deadline,
      nonce: signature.nonce,
      owner: signature.owner,
      r: signature.r,
      s: signature.s,
      v: signature.v,
      ...permitAdditionalData,
    };

    csl("transfer", "sky-600", "permit data: %o", permitResult);

    return permitResult;
  };

  const handleSubmitTransaction = async () => {
    if (!selectedQuote || !fromChainConfig || !toChainConfig || !fromWalletAddress || !fromWallet?.wallet) {
      setError('Please select a quote and ensure wallet is connected');
      return;
    }

    setLoading(true);
    setError(null);

    const quote = selectedQuote.quote;
    const wallet = fromWallet.wallet as {
      allowance?: (params: unknown) => Promise<{ allowance: string }>;
      approve?: (params: unknown) => Promise<{ success: boolean; message?: string }>;
    };

    const { isExactOutput } = getQuoteModes({
      quoteData: quote,
      bridgeStore: { quoteDataService: selectedQuote.serviceType },
    });

    let _amountWei = quote.quoteParam.amountWei;
    if (isExactOutput) {
      _amountWei = quote.quote?.minAmountIn;
    }

    console.log("quote: %o", quote);
    try {
      const newQuote = {
        ...quote,
        sendParam: void 0,
        estimateSourceGas: quote.estimateSourceGas?.toString(),
        totalEstimateSourceGas: quote.totalEstimateSourceGas?.toString(),
        transferSourceGasFee: quote.transferSourceGasFee?.toString(),
      };
      console.log("Quote data: %o", JSON.stringify(newQuote));
    } catch { }

    try {
      const permitSignature = await getPermitSignature(quote);

      if (quote.needApprove && wallet.allowance && wallet.approve) {
        if (fromChainConfig.chainName === 'Ethereum') {
          const allowanceResult = await wallet.allowance({
            contractAddress: quote.quoteParam.fromToken.contractAddress,
            spender: quote.approveSpender,
            amountWei: _amountWei,
            address: fromWalletAddress,
          });
          if (Big(allowanceResult.allowance || 0).gt(0)) {
            const approveRes = await wallet.approve({
              contractAddress: quote.quoteParam.fromToken.contractAddress,
              spender: quote.approveSpender,
              amountWei: '0',
              isDetails: true,
            });
            if (!approveRes.success) {
              throw new Error(approveRes.message);
            }
          }
        }

        const approveRes = await wallet.approve({
          contractAddress: quote.quoteParam.fromToken.contractAddress,
          spender: quote.approveSpender,
          amountWei: _amountWei,
          isDetails: true,
        });
        if (!approveRes.success) {
          throw new Error(approveRes.message);
        }
      }

      const txHash = await BridgeSFA.send(selectedQuote.serviceType, {
        wallet: fromWallet.wallet,
        quote,
        permitSignature,
      });

      const tx: Transaction = {
        id: txHash,
        fromToken: fromChainConfig,
        toToken: toChainConfig,
        fromChain: fromChainConfig.chainName,
        toChain: toChainConfig.chainName,
        txHash,
        toChainTxHash: '',
        amount,
        fromAddress: fromWalletAddress,
        toAddress: (toAddress || toWalletAddress || fromWalletAddress) as string,
        status: 'pending',
        timestamp: Date.now(),
        serviceType: selectedQuote.serviceType,
        depositAddress: quote.quote?.depositAddress,
        quote,
      };

      addTransaction(tx);
      setAmount('');
      setQuotes([]);
      setSelectedQuote(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit transaction';
      setError(message);
      console.error('Transaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const [fromChainBalance, setFromChainBalance] = useState<string>('');
  const [fromChainBalanceLoading, setFromChainBalanceLoading] = useState(false);
  const getFromChainBalance = async (_fromChainConfig?: TokenConfig) => {
    setFromChainBalanceLoading(true);
    const cfg = _fromChainConfig || fromChainConfig;
    const sdkWallet = fromWallet?.wallet as { getBalance?: (token: TokenConfig, account: string) => Promise<string> };
    if (!cfg || !fromWallet?.account || !sdkWallet?.getBalance) {
      setFromChainBalanceLoading(false);
      setFromChainBalance('');
      return;
    }
    try {
      const balance = await sdkWallet.getBalance(cfg, fromWallet.account);
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
    <>
      <AnimatedGradientBackdrop />
      <div className="app">
        <header className="app-header">
          <h1>StableFlow Demo-Full</h1>
          <p>All-chain cross-chain bridge (EVM, Aptos, NEAR, Solana, Sui, TON, Tron)</p>
        </header>

        <main className="app-main">
          <div className="bridge-form">
            <div className="form-section">
              <h2>From</h2>
              <ChainSelector
                label="From Chain"
                value={fromChain}
                tokens={bridgeTokens}
                placeholder="Select source chain"
                onChange={(_fromContractAddress) => {
                  const cfg = getChainByKey(_fromContractAddress);
                  if (cfg?.chainType === 'evm') {
                    switchNetwork(cfg);
                  }
                  setFromChain(_fromContractAddress);
                  void getFromChainBalance(cfg);
                }}
                excludeContractAddress={toChain}
              />
              {fromChainConfig && (
                <div className="quote-header">
                  <WalletConnector
                    chain={fromChainConfig}
                    onAddressChange={(addr) => {
                      setFromWalletAddress(addr ?? null);
                      if (!addr) {
                        setFromChainBalance('');
                        setFromChainBalanceLoading(false);
                        setError(null);
                        setQuotes([]);
                        setSelectedQuote(null);
                      }
                    }}
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
                tokens={bridgeTokens}
                placeholder="Select destination chain"
                onChange={setToChain}
                excludeContractAddress={fromChain}
              />
              <div className="to-address-input">
                <label>Recipient Address (optional)</label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="Enter address or connect wallet"
                  className="input-address"
                />
              </div>
              {toChainConfig && (
                <WalletConnector
                  chain={toChainConfig}
                  onAddressChange={(addr) => setToWalletAddress(addr ?? null)}
                />
              )}
            </div>

            <div className="form-section">
              <label>{amountLabel}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input-amount"
              />
            </div>

            {error && <div className="error-message break-all">{error}</div>}

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
                    onSelectQuote={setSelectedQuote}
                    selectedQuote={selectedQuote}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSubmitTransaction()}
                    disabled={loading}
                    className="btn-submit"
                  >
                    {loading ? 'Submitting...' : 'Submit Transaction'}
                  </button>
                </>
              )}
            </div>
          </div>

          <TransactionHistory />
        </main>
      </div>
    </>
  );
}

export default App;
