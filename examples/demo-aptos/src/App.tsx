import { useState } from 'react';
import { useTransactionStore } from './stores/transactionStore';
import { ChainSelector } from './components/ChainSelector';
import { QuoteResult } from './components/QuoteResult';
import { WalletConnector } from './components/WalletConnector';
import { TransactionHistory } from './components/TransactionHistory';
import { getBridgeTokens } from './utils/chains';
import type { QuoteResult as QuoteResultType, Transaction } from './types';
import { useWallet } from './hooks/useWallet';
import Big from 'big.js';
import './App.css';
import type { TokenConfig } from '@stableflow/core';
import { BridgeSFA, getQuoteModes, type GetAllQuoteParams } from '@stableflow/bridges';

const bridgeTokens = getBridgeTokens();

function App() {
  const [fromToken, setFromToken] = useState<TokenConfig>();
  const [toToken, setToToken] = useState<TokenConfig>();
  const [amount, setAmount] = useState<string>('');
  const [toAddress, setToAddress] = useState<string>('');
  const [fromWalletAddress, setFromWalletAddress] = useState<string | null>(null);
  const [toWalletAddress, setToWalletAddress] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteResultType[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addTransaction } = useTransactionStore();

  const { wallet: fromWallet, switchNetwork } = useWallet(fromToken ?? null);

  const recipient =
    (toAddress || toWalletAddress || fromWalletAddress || '').trim() || fromWalletAddress || '';

  const handleGetQuote = async () => {
    if (
      !fromToken ||
      !toToken ||
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
        minInputAmount: '0.1',        fromToken: fromToken,
        toToken: toToken,
        wallet: fromWallet.wallet as GetAllQuoteParams['wallet'],
        recipient,
        refundTo: fromWalletAddress,
        amountWei: Big(amount)
          .times(10 ** fromToken.decimals)
          .toFixed(0, 0),
        slippageTolerance: 0.5,
        oneclickParams: {
          appFees: [
            {
              recipient: 'stableflow.near',
              fee: 100,
            },
          ],
        },
        ...(fromToken.chainType === 'evm' && fromWallet?.wallet
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

  const handleSubmitTransaction = async () => {
    if (!selectedQuote || !fromToken || !toToken || !fromWalletAddress || !fromWallet?.wallet) {
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
      _amountWei = quote.quote?.amountIn;
    }

    try {
      if (quote.needApprove && wallet.allowance && wallet.approve) {
        if (fromToken.chainName === 'Ethereum') {
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
      });

      const tx: Transaction = {
        id: txHash,
        fromToken: fromToken,
        toToken: toToken,
        fromChain: fromToken.chainName,
        toChain: toToken.chainName,
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
  const getFromChainBalance = async (_fromToken?: TokenConfig) => {
    setFromChainBalanceLoading(true);
    const cfg = _fromToken || fromToken;
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

  const amountLabel = fromToken?.symbol ? `Amount (${fromToken.symbol})` : 'Amount';

  return (
    <div className="app">
      <header className="app-header">
        <h1>StableFlow Demo-Aptos</h1>
        <p>Aptos + EVM cross-chain bridge (amber theme)</p>
      </header>

      <main className="app-main">
        <div className="bridge-form">
          <div className="form-section">
            <h2>From</h2>
            <ChainSelector
              label="From Chain (Aptos or EVM)"
              value={fromToken}
              tokens={bridgeTokens}
              placeholder="Select source chain"
              onChange={(_fromToken) => {
                if (_fromToken?.chainType === 'evm') {
                  switchNetwork(_fromToken);
                }
                setFromToken(_fromToken);
                void getFromChainBalance(_fromToken);
              }}
              excludeToken={toToken}
            />
            {fromToken && (
              <div className="quote-header">
                <WalletConnector
                  chain={fromToken}
                  onAddressChange={(addr) => setFromWalletAddress(addr ?? null)}
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
              label="To Chain (Aptos or EVM)"
              value={toToken}
              tokens={bridgeTokens}
              placeholder="Select destination chain"
              onChange={setToToken}
              excludeToken={fromToken}
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
            {toToken && (
              <WalletConnector
                chain={toToken}
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

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => void handleGetQuote()}
              disabled={loading || !fromToken || !toToken || !amount || !fromWalletAddress}
              className="btn-primary"
            >
              {loading ? 'Getting Quote...' : 'Get Quote'}
            </button>
            {selectedQuote && (
              <>
                <QuoteResult
                  toToken={toToken}
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
  );
}

export default App;
