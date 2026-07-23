import React from 'react';
import type { QuoteResult as QuoteResultType } from '../types';
import { TokenConfig } from '@stableflow/core';

interface QuoteResultProps {
  quotes: QuoteResultType[];
  toToken?: TokenConfig;
  onSelectQuote: (quote: QuoteResultType) => void;
  selectedQuote?: QuoteResultType | null;
}

export const QuoteResult: React.FC<QuoteResultProps> = ({
  quotes,
  toToken,
  onSelectQuote,
  selectedQuote,
}) => {
  const validQuotes = quotes.filter((q) => q.quote && !q.error);

  return (
    <div className="quote-result">
      <h3>Quotes({quotes?.length ?? 0})</h3>
      <div className="quote-list">
        {validQuotes.map((quote) => {
          const isSelected = selectedQuote?.serviceType === quote.serviceType;
          const quoteData = quote.quote?.quote || quote.quote?.data;
          const outputAmount =
            quoteData?.amountOutFormatted || quote.quote?.outputAmount || 'N/A';
          const totalFees = quote.quote?.totalFeesUsd || '0';
          const estimateGas = quote.quote?.estimateSourceGasUsd || 'N/A';
          const estimateTime = quote.quote?.estimateTime || quoteData?.timeEstimate || 'N/A';

          return (
            <div
              key={quote.serviceType}
              className={`quote-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectQuote(quote)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectQuote(quote);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="quote-header">
                <h4>{String(quote.serviceType).toUpperCase()}</h4>
                {isSelected && <span className="selected-badge">Selected</span>}
              </div>
              {
                quote.quote?.errMsg && (
                  <div className="quote-error">
                    {quote.quote?.errMsg}
                  </div>
                )
              }
              <div className="quote-details">
                <div className="quote-row">
                  <span>Output Amount:</span>
                  <strong>{outputAmount} {toToken?.symbol}</strong>
                </div>
                <div className="quote-row">
                  <span>Total Fees:</span>
                  <strong>${totalFees}</strong>
                </div>
                <div className="quote-row">
                  <span>Estimate Gas:</span>
                  <strong>${estimateGas}</strong>
                </div>
                <div className="quote-row">
                  <span>Est. Time:</span>
                  <strong>{estimateTime}s</strong>
                </div>
                {quote.quote?.depositAddress && (
                  <div className="quote-row">
                    <span>Deposit Address:</span>
                    <code className="deposit-address">
                      {quote.quote.depositAddress.slice(0, 10)}...
                      {quote.quote.depositAddress.slice(-10)}
                    </code>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
