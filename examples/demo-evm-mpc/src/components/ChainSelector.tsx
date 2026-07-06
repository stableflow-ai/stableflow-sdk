import React from 'react';
import type { TokenConfig } from '@stableflow/core';
import { getEvmTokens } from '@/utils/chains';

interface ChainSelectorProps {
  label: string;
  value?: string;
  onChange: (chainKey: string) => void;
  excludeContractAddress?: string;
  disabled?: boolean;
  /** Defaults to EVM tokens only. Pass `getBridgeTokens()` or another list for all destinations. */
  tokens?: TokenConfig[];
  placeholder?: string;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  label,
  value,
  onChange,
  excludeContractAddress,
  disabled,
  tokens: tokenSource,
  placeholder,
}) => {
  const tokenList = (tokenSource ?? getEvmTokens()).filter(
    (token) => token.contractAddress !== excludeContractAddress
  );

  return (
    <div className="chain-selector">
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="select-chain"
      >
        <option value="">{placeholder ?? 'Select EVM chain'}</option>
        {tokenList.map((token) => (
          <option key={`${token.chainName}-${token.contractAddress}`} value={token.contractAddress}>
            {token.symbol} - {token.chainName}
          </option>
        ))}
      </select>
    </div>
  );
};
