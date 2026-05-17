import { useCallback, useEffect, useMemo, useState } from 'react';
import Big from 'big.js';
import {
  QuoteRequest,
  SFA,
  type QuoteResponse,
  type TokenResponse,
} from '@stableflow/core';
import { filterEvmTokens } from './utils/evmTokens';
import { ensureEthereumChain, getChainIdForTokenBlockchain } from './utils/evmChainIds';
import { BrowserProvider, Contract } from 'ethers';

const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount) returns (bool)'] as const;

function App() {
  const [tokens, setTokens] = useState<TokenResponse[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [originAsset, setOriginAsset] = useState('');
  const [destinationAsset, setDestinationAsset] = useState('');
  const [amount, setAmount] = useState('10');
  const [evmAddress, setEvmAddress] = useState('');
  const [slippageBps, setSlippageBps] = useState('50');
  const [dry, setDry] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [statusJson, setStatusJson] = useState<string>('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [sendingDeposit, setSendingDeposit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    setTokensLoading(true);
    setError(null);
    try {
      const all = await SFA.getTokens();
      setTokens(filterEvmTokens(all));
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
    () => tokens.find((t) => t.assetId === originAsset),
    [tokens, originAsset]
  );

  const amountWei = useMemo(() => {
    if (!originToken || !amount) return '';
    try {
      return Big(amount).times(10 ** originToken.decimals).toFixed(0);
    } catch {
      return '';
    }
  }, [originToken, amount]);

  const handleQuote = async () => {
    if (!originToken || !destinationAsset || !amountWei || !evmAddress) {
      setError('Select tokens, amount, and EVM address');
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
        refundTo: evmAddress,
        refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
        recipient: evmAddress,
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
      setStatusJson(JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status check failed');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    setError(null);
    const eth = window.ethereum;
    if (!eth?.request) {
      setError('No EVM wallet (window.ethereum). Install MetaMask or similar.');
      return;
    }
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const a = accounts[0] ?? null;
      setWalletAccount(a);
      if (a && !evmAddress) {
        setEvmAddress(a);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connect failed');
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
      setError('Origin token has no contractAddress — use manual wallet transfer.');
      return;
    }
    const eth = window.ethereum;
    if (!eth) {
      setError('No EVM wallet (window.ethereum).');
      return;
    }
    if (!walletAccount) {
      setError('Connect wallet first');
      return;
    }

    setSendingDeposit(true);
    setError(null);
    try {
      const targetChainId = getChainIdForTokenBlockchain(originToken.blockchain);
      if (targetChainId != null) {
        await ensureEthereumChain(targetChainId);
      }

      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const from = await signer.getAddress();
      if (from.toLowerCase() !== walletAccount.toLowerCase()) {
        setWalletAccount(from);
      }
      if (evmAddress && from.toLowerCase() !== evmAddress.toLowerCase()) {
        setError(
          `Connected wallet ${from.slice(0, 6)}… does not match refund/recipient ${evmAddress.slice(0, 6)}… — align addresses or update the quote.`
        );
        return;
      }

      const token = new Contract(originToken.contractAddress, ERC20_TRANSFER_ABI, signer);
      const tx = await token.transfer(depositAddress, amountIn);
      setDepositTxHash(tx.hash);
      const receipt = await tx.wait();
      if (receipt?.hash) {
        setDepositTxHash(receipt.hash);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setSendingDeposit(false);
    }
  };

  const handleSubmitDeposit = async () => {
    const depositAddress = quote?.quote?.depositAddress;
    if (!depositAddress || !depositTxHash) {
      setError('depositAddress and tx hash are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await SFA.submitDepositTx({ txHash: depositTxHash, depositAddress });
      setStatusJson(JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit deposit failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const depositAddress = quote?.quote?.depositAddress;
    if (!depositAddress || dry) return;
    const id = window.setInterval(() => {
      void SFA.getExecutionStatus(depositAddress, quote?.quote?.depositMemo)
        .then((res) => setStatusJson(JSON.stringify(res, null, 2)))
        .catch(() => { });
    }, 8000);
    return () => window.clearInterval(id);
  }, [quote, dry]);

  return (
    <div className="app">
      <h1>StableFlow Demo-Simple</h1>
      <p className="subtitle">
        <code>@stableflow/core</code> for API + browser wallet (ethers) for ERC20 deposit transfer — EVM only
      </p>

      {error && <div className="error break-all">{error}</div>}

      <section className="card">
        <h2>1. Tokens (SFA.getTokens)</h2>
        <button type="button" className="secondary" onClick={() => void loadTokens()} disabled={tokensLoading}>
          {tokensLoading ? 'Loading...' : 'Reload tokens'}
        </button>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          {tokens.length} EVM tokens loaded
        </p>
      </section>

      <section className="card">
        <h2>2. Quote (SFA.getQuote)</h2>
        <div className="row">
          <div>
            <label>From (EVM)</label>
            <select value={originAsset} onChange={(e) => setOriginAsset(e.target.value)}>
              <option value="">Select origin</option>
              {tokens.map((t) => (
                <option key={t.assetId} value={t.assetId}>
                  {t.blockchain} — {t.symbol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>To (EVM)</label>
            <select value={destinationAsset} onChange={(e) => setDestinationAsset(e.target.value)}>
              <option value="">Select destination</option>
              {tokens.map((t) => (
                <option key={t.assetId} value={t.assetId}>
                  {t.blockchain} — {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label>Amount ({originToken?.symbol ?? 'token'})</label>
        <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label>EVM refund / recipient address</label>
        <input
          type="text"
          value={evmAddress}
          onChange={(e) => setEvmAddress(e.target.value)}
          placeholder="0x..."
        />
        <label>Slippage (basis points, 50 = 0.5%)</label>
        <input type="text" value={slippageBps} onChange={(e) => setSlippageBps(e.target.value)} />
        <label className="flex">
          <input
            type="checkbox"
            checked={dry}
            onChange={(e) => setDry(e.target.checked)}
            className="shrink-0 w-4 mb-0"
          />
          <div className="">
            dry run (no depositAddress)
          </div>
        </label>
        <button type="button" onClick={() => void handleQuote()} disabled={loading}>
          {loading ? 'Working...' : 'Get quote'}
        </button>
        {quote && (
          <pre className="pre">{JSON.stringify(quote, null, 2)}</pre>
        )}
      </section>

      <section className="card">
        <h2>3. Send deposit (ERC20 transfer)</h2>
        <p className="hint">
          After step 2 with <strong>dry run off</strong>, send the quoted <code>amountIn</code> of the origin token to{' '}
          <code>depositAddress</code> from your wallet (same address as refund/recipient).
        </p>
        {quote?.quote?.depositAddress ? (
          <>
            <label>Deposit address</label>
            <input type="text" readOnly value={quote.quote.depositAddress} className="readonly" />
            <label>Amount (wei, from quote)</label>
            <input type="text" readOnly value={quote.quote.amountIn ?? ''} className="readonly" />
            <p className="hint">
              ≈ {quote.quote.amountInFormatted ?? '—'} {originToken?.symbol}
            </p>
          </>
        ) : (
          <p className="hint muted">Complete step 2 without &quot;dry run&quot; to show deposit fields.</p>
        )}
        <div className="row">
          <button type="button" className="secondary" onClick={() => void connectWallet()}>
            {walletAccount ? `Connected: ${walletAccount.slice(0, 6)}…${walletAccount.slice(-4)}` : 'Connect EVM wallet'}
          </button>
          <button
            type="button"
            onClick={() => void handleSendDepositTransfer()}
            disabled={sendingDeposit || !quote?.quote?.depositAddress || !originToken?.contractAddress}
          >
            {sendingDeposit ? 'Sending…' : 'Send token to deposit address'}
          </button>
        </div>
        {depositTxHash && (
          <p className="hint">
            Last deposit tx: <code>{depositTxHash}</code> (also filled in step 5)
          </p>
        )}
      </section>

      <section className="card">
        <h2>4. Status (SFA.getExecutionStatus)</h2>
        <button type="button" className="secondary" onClick={() => void handleStatus()} disabled={loading}>
          Poll status once
        </button>
        {statusJson && <pre className="pre">{statusJson}</pre>}
      </section>

      <section className="card">
        <h2>5. Submit deposit tx (SFA.submitDepositTx)</h2>
        <label>Source chain transaction hash</label>
        <input
          type="text"
          value={depositTxHash}
          onChange={(e) => setDepositTxHash(e.target.value)}
          placeholder="0x..."
        />
        <button type="button" onClick={() => void handleSubmitDeposit()} disabled={loading}>
          Submit deposit hash
        </button>
      </section>
    </div>
  );
}

export default App;
