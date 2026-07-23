import { tokens, type ChainType, type TokenConfig } from '@stableflow/core';

const TOKEN_KEY_SEP = ',';

export const encodeTokenKey = (token: Pick<TokenConfig, 'chainName' | 'contractAddress'>) =>
  `${token.chainName}${TOKEN_KEY_SEP}${token.contractAddress}`;

export const decodeTokenKey = (key: string) => {
  const sepIndex = key.indexOf(TOKEN_KEY_SEP);
  if (sepIndex === -1) {
    return { chainName: '', contractAddress: key };
  }
  return {
    chainName: key.slice(0, sepIndex),
    contractAddress: key.slice(sepIndex + 1),
  };
};

export const getTokenByKey = (key: string, list: TokenConfig[] = tokens): TokenConfig | undefined => {
  const { chainName, contractAddress } = decodeTokenKey(key);
  return list.find((token) => token.chainName === chainName && token.contractAddress === contractAddress);
};

export const getEvmTokens = (): TokenConfig[] => {
  return tokens.filter((token) => token.chainType === 'evm');
};

const BRIDGE_CHAIN_TYPES: ChainType[] = ['evm', 'aptos', 'near', 'sol', 'sui', 'ton', 'tron'];

export const getBridgeTokens = (): TokenConfig[] => {
  return tokens.filter((token) => BRIDGE_CHAIN_TYPES.includes(token.chainType as ChainType));
};
