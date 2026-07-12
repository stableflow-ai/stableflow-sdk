import { Service } from "../../core/Service";
import { TokenConfig } from "../../models/Token";
import chains from "./chains";

export const eure = {
  symbol: "EURe",
  decimals: 18,
  icon: "/eure.png",
  name: "Monerium EURe",
};

export const eureChains: Record<string, TokenConfig> = {
  gnosis: {
    ...eure,
    assetId: "nep141:gnosis-0x420ca0f9b9b604ce0fd9c18ef134c705e5fa3430.omft.near",
    contractAddress: "0x420ca0f9b9b604ce0fd9c18ef134c705e5fa3430",
    ...chains.gnosis,
    services: [Service.OneClick],
  },
};

export const eureEvm = {
  ...eure,
  chains: Object.values(eureChains).filter((chain) => chain.chainType === "evm"),
};
