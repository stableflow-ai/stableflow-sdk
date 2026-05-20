import React, { useState } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import { BridgeSFA } from '@stableflow/bridges';
import type { Transaction } from '../types';
import { getRequest } from '@stableflow/core';

export const TransactionHistory: React.FC = () => {
  const { transactions, updateTransaction } = useTransactionStore();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const quoteTransferResult = async (transaction: Transaction) => {
    setLoading((prev) => ({ ...prev, [transaction.id]: true }));

    try {
      const response = await BridgeSFA.getStatus(transaction.serviceType!, {
        hash: transaction.id,
        quote: transaction.quote,
      });
      updateTransaction(transaction.id, {
        status: response.status as Transaction['status'],
        toChainTxHash: response.toChainTxHash,
      });
    } catch {
      /* ignore */
    }

    setLoading((prev) => ({ ...prev, [transaction.id]: false }));
  };

  if (transactions.length === 0) {
    return (
      <>
        <div className="transaction-history">
          <h2>Transaction History</h2>
          <p className="empty-state">No transactions yet</p>
        </div>
        <QueryTransactionStatusManual />
      </>
    );
  }

  return (
    <div className="transaction-history">
      <div className="transaction-header">
        <h2>Transaction History</h2>
      </div>
      <div className="transaction-list">
        {transactions.map((tx: any) => (
          <div key={tx.id} className="transaction-item">
            <div className="transaction-info">
              <div className="transaction-row">
                <span className="label">Service:</span>
                <span>{String(tx.serviceType)}</span>
              </div>
              <div className="transaction-row">
                <span className="label">From:</span>
                <span>{tx.fromChain}</span>
              </div>
              <div className="transaction-row">
                <span className="label">To:</span>
                <span>{tx.toChain}</span>
              </div>
              <div className="transaction-row">
                <span className="label">Amount:</span>
                <span>
                  {tx.amount} {tx.fromToken?.symbol}
                </span>
              </div>
              <div className="transaction-row">
                <span className="label">Status:</span>
                <span className={`status status-${tx.status}`}>{tx.status}</span>
              </div>
              {tx.txHash && (
                <div className="transaction-row">
                  <span className="label">Tx Hash:</span>
                  <code className="tx-hash">{tx.txHash}</code>
                </div>
              )}
              {tx.toChainTxHash && (
                <div className="transaction-row">
                  <span className="label">Received Tx Hash:</span>
                  <code className="tx-hash">{tx.toChainTxHash}</code>
                </div>
              )}
              {tx.depositAddress && (
                <div className="transaction-row">
                  <span className="label">depositAddress:</span>
                  <code className="tx-hash">{tx.depositAddress}</code>
                </div>
              )}
              <div className="transaction-row">
                <span className="label">Time:</span>
                <span>{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
            </div>
            {tx.status === 'pending' && (
              <button
                type="button"
                onClick={() => quoteTransferResult(tx)}
                className="btn-remove"
                disabled={loading[tx.id]}
              >
                {loading[tx.id] ? 'Loading...' : 'Fetch Result'}
              </button>
            )}
          </div>
        ))}
      </div>
      <QueryTransactionStatusManual />
    </div>
  );
};

function QueryTransactionStatusManual() {
  const [depositAddress, setDepositAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const queryStatus = async () => {
    setLoading(true);
    if (!depositAddress) {
      setLoading(false);
      return;
    }
    const result = await getRequest("/v0/trade", {
      deposit_address: depositAddress,
    });
    setResult(result);
    setLoading(false);
  };

  return (
    <div className="transaction-list quote-result">
      <h2>
        Query Transaction Status Manually
      </h2>
      <input
        type="text"
        placeholder="Input deposit address or hash"
        className="input-amount"
        value={depositAddress}
        onChange={(e) => setDepositAddress(e.target.value)}
      />
      <button
        type="button"
        className="btn-primary btn-sm"
        disabled={loading}
        onClick={queryStatus}
      >
        Query
      </button>
      <button
        type="button"
        className="btn-primary btn-sm"
        disabled={loading}
        onClick={() => {
          setDepositAddress("");
          setResult(null);
        }}
      >
        Clear
      </button>
      <div className="">
        <pre>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
