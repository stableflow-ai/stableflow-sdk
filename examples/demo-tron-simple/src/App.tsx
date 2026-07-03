import { useCallback, useEffect, useMemo, useState } from 'react';
import Big from 'big.js';
import {
  OneClickStatus,
  QuoteRequest,
  SFA,
  type QuoteResponse,
  type TokenResponse,
} from '@stableflow/core';
import {
  filterAvailableTokens,
  findDefaultPair,
  isEvmBlockchain,
  isTronBlockchain,
} from './utils/bridgeTokens';
import { getChainIdForTokenBlockchain, ensureEthereumChain } from './utils/chainIds';
import { useTronWallet } from './hooks/useTronWallet';
import { useEvmWallet } from './hooks/useEvmWallet';

function App() {
  const tron = useTronWallet();
  const evm = useEvmWallet();

  const [tokens, setTokens] = useState<TokenResponse[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [originAsset, setOriginAsset] = useState('');
  const [destinationAsset, setDestinationAsset] = useState('');
  const [amount, setAmount] = useState('1000');
  const [slippageBps, setSlippageBps] = useState('50');
  const [dry, setDry] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [statusJson, setStatusJson] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [sendingDeposit, setSendingDeposit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTokens = useMemo(() => filterAvailableTokens(tokens), [tokens]);

  const loadTokens = useCallback(async () => {
    setTokensLoading(true);
    setError(null);
    try {
      const all = await SFA.getTokens();
      const filtered = filterAvailableTokens(all);
      setTokens(filtered);
      const defaults = findDefaultPair(all);
      setOriginAsset(defaults.originAsset);
      setDestinationAsset(defaults.destinationAsset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setTokensLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  const originToken = useMemo(
    () => availableTokens.find((t) => t.assetId === originAsset),
    [availableTokens, originAsset]
  );

  const destinationToken = useMemo(
    () => availableTokens.find((t) => t.assetId === destinationAsset),
    [availableTokens, destinationAsset]
  );

  const originIsTron = originToken ? isTronBlockchain(String(originToken.blockchain)) : false;
  const originIsEvm = originToken ? isEvmBlockchain(String(originToken.blockchain)) : false;
  const destinationIsTron = destinationToken
    ? isTronBlockchain(String(destinationToken.blockchain))
    : false;
  const destinationIsEvm = destinationToken
    ? isEvmBlockchain(String(destinationToken.blockchain))
    : false;

  const amountWei = useMemo(() => {
    if (!originToken || !amount) return '';
    try {
      return Big(amount).times(10 ** originToken.decimals).toFixed(0, 0);
    } catch {
      return '';
    }
  }, [originToken, amount]);

  const handleQuote = async () => {
    if (!originToken || !destinationToken || !amountWei) {
      setError('Select tokens and amount');
      return;
    }

    const refundTo = originIsTron ? tron.account : originIsEvm ? evm.account : null;
    const recipient = destinationIsTron
      ? tron.account
      : destinationIsEvm
        ? evm.account
        : null;

    if (!refundTo) {
      setError(
        originIsTron
          ? 'Connect Tron wallet for origin refund address'
          : 'Connect EVM wallet for origin refund address'
      );
      return;
    }
    if (!recipient) {
      setError(
        destinationIsTron
          ? 'Connect Tron wallet for destination recipient'
          : 'Connect EVM wallet for destination recipient'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const res = await SFA.getQuote({
        dry,
        swapType: QuoteRequest.swapType.EXACT_INPUT,
        slippageTolerance: Number(slippageBps),
        originAsset,
        destinationAsset,
        amount: amountWei,
        refundTo,
        refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
        recipient,
        recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
        depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
        deadline: new Date(Date.now() + 3600_000).toISOString(),
      });
      setQuote(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quote failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async () => {
    const depositAddress = quote?.quote?.depositAddress;
    if (!depositAddress) {
      setError('Get a quote with dry=false first to obtain depositAddress');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await SFA.getExecutionStatus(depositAddress, quote?.quote?.depositMemo);
      if (
        [
          OneClickStatus.PENDING_DEPOSIT,
          OneClickStatus.KNOWN_DEPOSIT_TX,
          OneClickStatus.INCOMPLETE_DEPOSIT,
        ].includes(res.status)
      ) {
        alert('Pending deposit, please wait for the transaction to be mined');
      }
      if (res.status === OneClickStatus.PROCESSING) {
        alert('Transaction is being processed');
      }
      if (res.status === OneClickStatus.SUCCESS) {
        alert('Transaction successful');
      }
      if ([OneClickStatus.FAILED, OneClickStatus.REFUNDED].includes(res.status)) {
        alert('Transaction failed');
      }
      setStatusJson(JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeposit = async (params: { depositAddress: string; txHash: string }) => {
    if (!params.depositAddress || !params.txHash) {
      setError('depositAddress and tx hash are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await SFA.submitDepositTx(params);
      setStatusJson(JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendDepositTransfer = async () => {
    const depositAddress = quote?.quote?.depositAddress;
    const amountIn = quote?.quote?.amountIn;
    if (!depositAddress || !amountIn) {
      setError('Need a full quote (uncheck dry run) so depositAddress and amountIn are present.');
      return;
    }
    if (!originToken?.contractAddress) {
      setError('Origin token has no contractAddress.');
      return;
    }

    setSendingDeposit(true);
    setError(null);
    try {
      let txHash: string;

      if (originIsTron) {
        if (!tron.wallet || !tron.account) {
          setError('Connect Tron wallet first');
          return;
        }
        const result = await tron.wallet.transfer({
          originAsset: originToken.contractAddress,
          depositAddress,
          amount: amountIn,
        });
        txHash = typeof result === 'string' ? result : String(result);
      } else if (originIsEvm) {
        if (!evm.wallet || !evm.account) {
          setError('Connect EVM wallet first');
          return;
        }
        const chainId = getChainIdForTokenBlockchain(originToken.blockchain);
        if (chainId != null) {
          await ensureEthereumChain(chainId);
        }
        const result = await evm.wallet.transfer({
          originAsset: originToken.contractAddress,
          depositAddress,
          amount: amountIn,
        });
        txHash = typeof result === 'string' ? result : String(result);
      } else {
        setError('Unsupported origin chain for deposit in this demo.');
        return;
      }

      setDepositTxHash(txHash);
      await handleSubmitDeposit({ depositAddress, txHash });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setSendingDeposit(false);
    }
  };

  useEffect(() => {
    const depositAddress = quote?.quote?.depositAddress;
    if (!depositAddress || dry) return;
    const id = window.setInterval(() => {
      void SFA.getExecutionStatus(depositAddress, quote?.quote?.depositMemo)
        .then((res) => setStatusJson(JSON.stringify(res, null, 2)))
        .catch(() => {});
    }, 8000);
    return () => window.clearInterval(id);
  }, [quote, dry]);

  const connectTron = async () => {
    setError(null);
    try {
      await tron.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tron wallet connect failed');
    }
  };

  const connectEvm = async () => {
    setError(null);
    try {
      await evm.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'EVM wallet connect failed');
    }
  };

  return (
    <div className="app">
      <h1>StableFlow Demo-Tron-Simple</h1>
      <p className="subtitle">
        <code>@stableflow/core</code> + <code>@stableflow/wallet-tron</code> /{' '}
        <code>@stableflow/wallet-evm</code> — Tron ↔ Plasma cross-chain
      </p>

      {error && <div className="error break-all">{error}</div>}

      <section className="card">
        <h2>1. Tokens (SFA.getTokens)</h2>
        <button type="button" className="secondary" onClick={() => void loadTokens()} disabled={tokensLoading}>
          {tokensLoading ? 'Loading...' : 'Reload tokens'}
        </button>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          {availableTokens.length} Tron / EVM stablecoins loaded (DEPRECATED hidden)
        </p>
      </section>

      <section className="card">
        <h2>2. Wallets</h2>
        <div className="row">
          <button type="button" className="secondary" onClick={() => void connectTron()} disabled={tron.connecting}>
            {tron.account
              ? `Tron: ${tron.account.slice(0, 6)}…${tron.account.slice(-4)}`
              : tron.connecting
                ? 'Connecting Tron…'
                : 'Connect Tron wallet'}
          </button>
          <button type="button" className="secondary" onClick={() => void connectEvm()} disabled={evm.connecting}>
            {evm.account
              ? `EVM: ${evm.account.slice(0, 6)}…${evm.account.slice(-4)}`
              : evm.connecting
                ? 'Connecting EVM…'
                : 'Connect EVM wallet'}
          </button>
        </div>
        <p className="hint">
          Connect Tron and/or EVM wallets depending on your selected origin and destination chains.
        </p>
      </section>

      <section className="card">
        <h2>3. Quote (SFA.getQuote)</h2>
        <div className="row">
          <div>
            <label>From</label>
            <select value={originAsset} onChange={(e) => setOriginAsset(e.target.value)}>
              <option value="">Select origin</option>
              {availableTokens.map((t) => (
                <option key={t.assetId} value={t.assetId}>
                  {t.blockchain} — {t.symbol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>To</label>
            <select value={destinationAsset} onChange={(e) => setDestinationAsset(e.target.value)}>
              <option value="">Select destination</option>
              {availableTokens.map((t) => (
                <option key={t.assetId} value={t.assetId}>
                  {t.blockchain} — {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label>Amount ({originToken?.symbol ?? 'token'})</label>
        <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label>Slippage (basis points, 50 = 0.5%)</label>
        <input type="text" value={slippageBps} onChange={(e) => setSlippageBps(e.target.value)} />
        <label className="flex">
          <input
            type="checkbox"
            checked={dry}
            onChange={(e) => setDry(e.target.checked)}
            className="shrink-0 w-4 mb-0"
          />
          <div className="">dry run (no depositAddress)</div>
        </label>
        <button type="button" onClick={() => void handleQuote()} disabled={loading}>
          {loading ? 'Working...' : 'Get quote'}
        </button>
        {quote && <pre className="pre">{JSON.stringify(quote, null, 2)}</pre>}
      </section>

      <section className="card">
        <h2>4. Send deposit ({originIsTron ? 'TRC20' : originIsEvm ? 'ERC20' : 'token'} transfer)</h2>
        <p className="hint">
          After step 3 with <strong>dry run off</strong>, send the quoted <code>amountIn</code> of the
          origin token to <code>depositAddress</code> from your{' '}
          {originIsTron ? 'Tron' : originIsEvm ? 'EVM' : 'origin-chain'} wallet.
        </p>
        {quote?.quote?.depositAddress ? (
          <>
            <label>Deposit address</label>
            <input type="text" readOnly value={quote.quote.depositAddress} className="readonly" />
            <label>Amount (smallest unit, from quote)</label>
            <input type="text" readOnly value={quote.quote.amountIn ?? ''} className="readonly" />
            <p className="hint">
              ≈ {quote.quote.amountInFormatted ?? '—'} {originToken?.symbol} →{' '}
              {destinationToken?.symbol ?? 'destination'}
            </p>
          </>
        ) : (
          <p className="hint muted">Complete step 3 without &quot;dry run&quot; to show deposit fields.</p>
        )}
        <button
          type="button"
          onClick={() => void handleSendDepositTransfer()}
          disabled={
            sendingDeposit ||
            !quote?.quote?.depositAddress ||
            !originToken?.contractAddress ||
            (!originIsTron && !originIsEvm)
          }
        >
          {sendingDeposit ? 'Sending…' : 'Send token to deposit address'}
        </button>
        {depositTxHash && (
          <p className="hint">
            Last deposit tx: <code>{depositTxHash}</code>
          </p>
        )}
      </section>

      <section className="card">
        <h2>5. Status (SFA.getExecutionStatus)</h2>
        <button type="button" className="secondary" onClick={() => void handleStatus()} disabled={loading}>
          Poll status once
        </button>
        {statusJson && <pre className="pre">{statusJson}</pre>}
      </section>

      {tron.pickerOpen && (
        <div className="wallet-modal-overlay" role="presentation" onClick={() => tron.setPickerOpen(false)}>
          <div className="wallet-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h3>Select Tron Wallet</h3>
              <button type="button" className="secondary modal-close" onClick={() => tron.setPickerOpen(false)}>
                Close
              </button>
            </div>
            <div className="wallet-list">
              {tron.installedWallets.length === 0 ? (
                <p className="hint muted">Install TronLink or OKX Wallet extension.</p>
              ) : (
                tron.installedWallets.map((w) => (
                  <button
                    key={w.name}
                    type="button"
                    className="wallet-item"
                    onClick={() => void tron.connectWithAdapter(w).catch((err) => {
                      setError(err instanceof Error ? err.message : 'Tron wallet connect failed');
                    })}
                  >
                    {w.icon && <img src={w.icon} alt="" width={28} height={28} />}
                    <span>{w.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
