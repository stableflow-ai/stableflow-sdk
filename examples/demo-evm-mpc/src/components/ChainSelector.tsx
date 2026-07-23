import React from 'react';
import type { TokenConfig } from '@stableflow/core';
import { decodeTokenKey, encodeTokenKey } from '@/utils/chains';

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
  const tokenList = tokens.filter(
    (token) =>
      !(
        token.contractAddress === excludeToken?.contractAddress &&
        token.chainName === excludeToken?.chainName
      )
  );

  return (
    <div className="chain-selector">
      <label>{label}</label>
      <select
        value={value ? encodeTokenKey(value) : void 0}
        onChange={(e) => {
          const { chainName, contractAddress } = decodeTokenKey(e.target.value);
          const currentToken = tokenList.find(
            (token) => token.chainName === chainName && token.contractAddress === contractAddress
          );
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
          <option key={encodeTokenKey(token)} value={encodeTokenKey(token)}>
            {token.symbol} - {token.chainName}
          </option>
        ))}
      </select>
    </div>
  );
};
