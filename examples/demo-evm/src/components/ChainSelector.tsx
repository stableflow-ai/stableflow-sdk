import React from 'react';
import { getEvmTokens } from '@/utils/chains';

interface ChainSelectorProps {
  label: string;
  value?: string;
  onChange: (chainKey: string) => void;
  excludeContractAddress?: string;
  disabled?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  label,
  value,
  onChange,
  excludeContractAddress,
  disabled,
}) => {
  const tokenList = getEvmTokens().filter(
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
        <option value="">Select EVM chain</option>
        {tokenList.map((token) => (
          <option key={`${token.chainName}-${token.contractAddress}`} value={token.contractAddress}>
            {token.symbol} - {token.chainName}
          </option>
        ))}
      </select>
    </div>
  );
};
