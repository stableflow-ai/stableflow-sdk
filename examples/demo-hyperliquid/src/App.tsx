import { useEffect, useMemo, useState } from 'react';
import Big from 'big.js';
import {
  Hyperliquid,
  HyperliquidFromTokens,
  HyperliuquidMinAmount,
  HyperliuquidToToken,
  type HyperliquidQuoteParams,
} from '@stableflow/hyperliquid';
import { Service, type TokenConfig } from '@stableflow/core';
import { TransactionHistory } from './components/TransactionHistory';
import { useEvmWalletContext } from './providers/EvmWalletContext';
import { useTransactionStore } from './stores/transactionStore';
import { mapHyperliquidDepositStatus } from './utils/hyperliquidStatus';
import './App.css';

const fromTokens = HyperliquidFromTokens.filter((t) => t.chainType === 'evm');
const toToken = HyperliuquidToToken;

function App() {
  const { wallet, currentChainId, onSwitchChain } = useEvmWalletContext();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const [fromToken, setFromToken] = useState<TokenConfig | null>(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const minHuman = useMemo(
    () => Big(HyperliuquidMinAmount).div(10 ** toToken.decimals).toString(),
    []
  );

  const getQuoteParams = (dry?: boolean): HyperliquidQuoteParams | null => {
    if (!wallet.account || !fromToken || !amount || !wallet.wallet) return null;
    return {
      dry,
      slippageTolerance: 0.5,
      refundTo: wallet.account,
      recipient: wallet.account,
      wallet: wallet.wallet,
      fromToken,
      // EXACT_OUTPUT swapMode, amountWei is the amount of destination token
      amountWei: Big(amount).times(10 ** toToken.decimals).toFixed(0, 0),
    };
  };

  const runQuote = async (dry?: boolean) => {
    const params = getQuoteParams(dry);
    if (!params) {
      setQuote(null);
      return null;
    }
    setQuoting(true);
    setError(null);
    try {
      const res = await Hyperliquid.quote(params);
      console.log("quote res: %o", res);
      if (!res.quote) {
        setQuote(null);
        let errMsg = res.error || 'No quote';
        if (errMsg.includes("Amount is too low")) {
          errMsg = `Amount is too low, at least ${minHuman} ${fromToken?.symbol}`;
        }
        setError(errMsg);
        return null;
      }
      setQuote(res.quote);
      return res.quote;
    } catch (err) {
      console.log("quote error: %o", err);
      setError(err instanceof Error ? err.message : 'Quote failed');
      setQuote(null);
      return null;
    } finally {
      setQuoting(false);
    }
  };

  useEffect(() => {
    if (!fromToken || !wallet.account || !amount) return;
    const t = window.setTimeout(() => void runQuote(true), 800);
    return () => window.clearTimeout(t);
  }, [amount, fromToken, wallet.account]);

  const handleContinue = async () => {
    if (!wallet.account) {
      wallet.connect?.();
      return;
    }
    if (fromToken?.chainId && currentChainId !== fromToken.chainId) {
      await onSwitchChain?.({ chainId: fromToken.chainId });
      return;
    }
    if (!fromToken || !amount) return;

    const q = quote as {
      needApprove?: boolean;
      approveSpender?: string;
      quote?: { amountIn?: string };
    } | null;

    if (q?.needApprove && wallet.wallet?.approve) {
      await wallet.wallet.approve({
        contractAddress: fromToken.contractAddress,
        spender: q.approveSpender,
        amountWei: q.quote?.amountIn,
      });
      await runQuote(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const finalQuote = await runQuote(false);
      if (!finalQuote || !wallet.wallet) throw new Error('Missing quote or wallet');

      const transferParams = {
        wallet: wallet.wallet,
        evmWallet: wallet.wallet,
        evmWalletAddress: wallet.account,
        quote: finalQuote,
      };

      const txhash = await Hyperliquid.transfer(transferParams);
      if (toToken.chainId) {
        await onSwitchChain?.({ chainId: toToken.chainId });
      }

      const depositRes = await Hyperliquid.deposit({ txhash, ...transferParams });
      if (depositRes.code !== 200) {
        throw new Error(JSON.stringify(depositRes.data) || 'Deposit failed');
      }

      const depositId = depositRes.data?.depositId;
      const recordId =
        depositId != null ? String(depositId) : txhash;

      let depositStatus = mapHyperliquidDepositStatus(undefined);
      let toChainTxHash: string | undefined;

      if (depositId != null) {
        const statusRes = await Hyperliquid.getStatus({ depositId: String(depositId) });
        depositStatus = mapHyperliquidDepositStatus(statusRes.data?.status);
        toChainTxHash = statusRes.data?.txHash;
        setStatusMsg(`Deposit ${depositId}: ${JSON.stringify(statusRes.data)}`);
      }

      const quotePayload = finalQuote as {
        quote?: { depositAddress?: string };
      };

      addTransaction({
        id: recordId,
        fromToken,
        toToken,
        fromChain: fromToken.chainName,
        toChain: toToken.chainName,
        amount,
        fromAddress: wallet.account,
        toAddress: wallet.account,
        depositAddress: quotePayload.quote?.depositAddress,
        txHash: txhash,
        toChainTxHash,
        status: depositStatus,
        timestamp: Date.now(),
        serviceType: Service.OneClick,
      });

      alert('Deposit submitted. Check status below.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const [buttonText, buttonDisabled] = useMemo(() => {
    if (loading || quoting) return ['Loading...', true] as const;
    if (!wallet.account) return ['Connect wallet', false] as const;
    if (fromToken && currentChainId !== fromToken.chainId) return ['Switch network', false] as const;
    if (!fromToken) return ['Select token', true] as const;
    if (!amount || Big(amount).lte(0)) return ['Enter amount', true] as const;
    if (Big(amount).lt(minHuman)) return [`Min ${minHuman} ${toToken.symbol}`, true] as const;
    if (!quote) return ['Continue', true] as const;
    if ((quote as { needApprove?: boolean }).needApprove) return ['Approve', false] as const;
    return ['Continue', false] as const;
  }, [loading, quoting, wallet, fromToken, amount, quote, currentChainId, minHuman]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <h1>StableFlow Demo-Hyperliquid</h1>
          <button
            type="button"
            className="btn-history"
            onClick={() => setHistoryOpen(true)}
          >
            History
          </button>
        </div>
        <p>Deposit EVM assets to Hyperliquid via @stableflow/hyperliquid</p>
      </header>
      {historyOpen && (
        <div
          className="history-modal-overlay"
          onClick={() => setHistoryOpen(false)}
          role="presentation"
        >
          <div
            className="history-modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-title"
          >
            <button
              type="button"
              className="history-modal-close"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <TransactionHistory />
          </div>
        </div>
      )}
      <main className="app-main bridge-form">
        {error && <div className="error-message break-all">{error}</div>}
        <div className="form-section">
          <h2>From (EVM)</h2>
          <select
            className="select-chain"
            value={fromToken?.contractAddress ?? ''}
            onChange={(e) => {
              const token = fromTokens.find((t) => t.contractAddress === e.target.value);
              setFromToken(token ?? null);
              if (token?.chainId) void onSwitchChain?.({ chainId: token.chainId });
            }}
          >
            <option value="">Select token</option>
            {fromTokens.map((t) => (
              <option key={t.contractAddress} value={t.contractAddress}>
                {t.chainName} — {t.symbol}
              </option>
            ))}
          </select>
          {wallet.account ? (
            <p className="wallet-connected">
              {wallet.account.slice(0, 6)}...{wallet.account.slice(-4)}
              <button type="button" className="btn-disconnect" onClick={() => wallet.disconnect?.()}>
                Disconnect
              </button>
            </p>
          ) : (
            <button type="button" className="btn-connect" onClick={() => wallet.connect?.()}>
              Connect EVM Wallet
            </button>
          )}
        </div>
        <div className="form-section">
          <label>Amount ({fromToken?.symbol ?? 'token'})</label>
          <input
            className="input-amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (v.startsWith('-')) return;
              if (v !== '' && Big(v).lt(0)) return;
              setAmount(v);
            }}
            placeholder={`Min ~${minHuman}`}
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={buttonDisabled}
          onClick={() => void handleContinue()}
        >
          {buttonText}
        </button>
        {statusMsg && <pre className="quote-preview">{statusMsg}</pre>}
        {quote && (
          <pre className="quote-preview">{JSON.stringify(quote, null, 2)}</pre>
        )}
      </main>
    </div>
  );
}

export default App;
