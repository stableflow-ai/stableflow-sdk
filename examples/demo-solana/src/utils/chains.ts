import { tokens, type ChainType, type TokenConfig } from '@stableflow/core';

export const getChainByKey = (key: string): TokenConfig | undefined => {
  return tokens.find((token) => token.contractAddress === key);
};

export const getBridgeTokens = (): TokenConfig[] => {
  return tokens.filter((token) => token.chainType === 'evm' || token.chainType === 'sol');
};

export const getTokensByChainTypes = (chainTypes: ChainType[]): TokenConfig[] => {
  return tokens.filter((token) => chainTypes.includes(token.chainType as ChainType));
};
