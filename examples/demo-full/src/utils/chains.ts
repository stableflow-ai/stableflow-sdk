import { tokens, type ChainType, type TokenConfig } from '@stableflow/core';

const BRIDGE_CHAIN_TYPES: ChainType[] = ['evm', 'aptos', 'near', 'sol', 'sui', 'ton', 'tron'];

export const getEvmTokens = (): TokenConfig[] => {
  return tokens.filter((token) => token.chainType === 'evm');
};

export const getBridgeTokens = (): TokenConfig[] => {
  return tokens.filter((token) => BRIDGE_CHAIN_TYPES.includes(token.chainType as ChainType));
};

export const getTokensByChainTypes = (chainTypes: ChainType[]): TokenConfig[] => {
  return tokens.filter((token) => chainTypes.includes(token.chainType as ChainType));
};
