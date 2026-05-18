import React, { useState } from 'react';
import { Hyperliquid } from '@stableflow/hyperliquid';
import { useTransactionStore } from '../stores/transactionStore';
import type { Transaction } from '../types';
import { mapHyperliquidDepositStatus } from '../utils/hyperliquidStatus';

export const TransactionHistory: React.FC = () => {
  const { transactions, updateTransaction } = useTransactionStore();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchDepositStatus = async (transaction: Transaction) => {
    setLoading((prev) => ({ ...prev, [transaction.id]: true }));

    try {
      const response = await Hyperliquid.getStatus({ depositId: transaction.id });
      if (response.code !== 200) return;

      updateTransaction(transaction.id, {
        status: mapHyperliquidDepositStatus(response.data?.status),
        toChainTxHash: response.data?.txHash,
      });
    } catch {
      /* ignore */
    }

    setLoading((prev) => ({ ...prev, [transaction.id]: false }));
  };

  const isInProgress = (status: Transaction['status']) =>
    status === 'pending' || status === 'processing';

  if (transactions.length === 0) {
    return (
      <div className="transaction-history">
        <h2 id="history-modal-title">Transaction History</h2>
        <p className="empty-state">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="transaction-header">
        <h2 id="history-modal-title">Transaction History</h2>
      </div>
      <div className="transaction-list">
        {transactions.map((tx) => (
          <div key={tx.id} className="transaction-item">
            <div className="transaction-info">
              <div className="transaction-row">
                <span className="label">Deposit ID:</span>
                <span>{tx.id}</span>
              </div>
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
              <div className="transaction-row">
                <span className="label">Time:</span>
                <span>{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
            </div>
            {isInProgress(tx.status) && (
              <button
                type="button"
                onClick={() => void fetchDepositStatus(tx)}
                className="btn-remove"
                disabled={loading[tx.id]}
              >
                {loading[tx.id] ? 'Loading...' : 'Fetch Result'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
