import { tokens, type TokenConfig } from '@stableflow/core';

export const getChainByKey = (key: string): TokenConfig | undefined => {
  return tokens.find((token) => token.contractAddress === key);
};

export const getEvmTokens = (): TokenConfig[] => {
  return tokens.filter((token) => token.chainType === 'evm');
};
