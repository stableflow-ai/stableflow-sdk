import { tokens, type ChainType, type TokenConfig } from '@stableflow/core';

export const getChainByKey = (key: string): TokenConfig | undefined => {
  return tokens.find((token) => token.contractAddress === key);
};

export const getEvmTokens = (): TokenConfig[] => {
  return tokens.filter((token) => token.chainType === 'evm');
};

const BRIDGE_CHAIN_TYPES: ChainType[] = ['evm', 'aptos', 'near', 'sol', 'sui', 'ton', 'tron'];

export const getBridgeTokens = (): TokenConfig[] => {
  return tokens.filter((token) => BRIDGE_CHAIN_TYPES.includes(token.chainType as ChainType));
};
