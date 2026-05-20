import React from 'react';
import type { TokenConfig } from '@stableflow/core';

interface ChainSelectorProps {
  label: string;
  value?: TokenConfig;
  onChange: (token: TokenConfig) => void;
  excludeToken?: TokenConfig;
  disabled?: boolean;
  tokens: TokenConfig[];
  placeholder?: string;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  label,
  value,
  onChange,
  excludeToken,
  disabled,
  tokens,
  placeholder = 'Select chain',
}) => {
  const tokenList = tokens.filter((token) => token.contractAddress !== excludeToken?.contractAddress && token.chainName !== excludeToken?.chainName);

  return (
    <div className="chain-selector">
      <label>{label}</label>
      <select
        value={value ? `${value.chainName}-${value.contractAddress}` : void 0}
        onChange={(e) => {
          const [chainName, contractAddress] = e.target.value.split('-');
          const currentToken = tokenList.find((token) => token.chainName === chainName && token.contractAddress === contractAddress);
          if (!currentToken) {
            return;
          }
          onChange(currentToken);
        }}
        disabled={disabled}
        className="select-chain"
      >
        <option value="">{placeholder}</option>
        {tokenList.map((token) => (
          <option
            key={`${token.chainName}-${token.contractAddress}`}
            value={`${token.chainName}-${token.contractAddress}`}>
            {token.symbol} - {token.chainName}
          </option>
        ))}
      </select>
    </div>
  );
};
