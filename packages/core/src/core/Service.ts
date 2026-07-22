/**
 * @deprecated Please use Service instead
 */
export type ServiceType = "oneclick" | "usdt0" | "cctp" | "fraxzero" | "fraxzero-oneclick" | "oneclick-fraxzero" | "usdt0-oneclick" | "oneclick-usdt0" | "cctp-oneclick" | "oneclick-cctp" | "native";

/**
 * OneClick swap type. Controls how `amount` is interpreted for OneClick-based
 * routes and the underlying `/v0/quote` request.
 *
 * - `Input`  (`EXACT_INPUT`)  - `amount` is the fixed input amount.
 * - `Output` (`EXACT_OUTPUT`) - `amount` is the fixed output amount; required
 *   input is computed and any excess is refunded to `refundTo`.
 * - `Flex`   (`FLEX_INPUT`)   - flexible input allowing partial deposits.
 */
export const OneClickSwapType = {
  Input: "EXACT_INPUT",
  Output: "EXACT_OUTPUT",
  Flex: "FLEX_INPUT",
} as const;
export type OneClickSwapType = (typeof OneClickSwapType)[keyof typeof OneClickSwapType];

export const Service = {
  OneClick: "oneclick",
  Usdt0: "usdt0",
  CCTP: "cctp",
  FraxZero: "fraxzero",
  FraxZeroOneClick: "fraxzero-oneclick",
  OneClickFraxZero: "oneclick-fraxzero",
  Usdt0OneClick: "usdt0-oneclick",
  OneClickUsdt0: "oneclick-usdt0",
  CCTPOneClick: "cctp-oneclick",
  OneClickCCTP: "oneclick-cctp",
  Native: "native",
} as const;
export type Service = (typeof Service)[keyof typeof Service];

export const ServiceBackend: Record<Service, string> = {
  [Service.OneClick]: "nearintents",
  [Service.Usdt0]: "layerzero",
  [Service.CCTP]: "cctp",
  [Service.FraxZero]: "fraxzero",
  [Service.FraxZeroOneClick]: "fraxzerointent",
  [Service.OneClickFraxZero]: "intentfraxzero",
  [Service.Usdt0OneClick]: "zerointent",
  [Service.OneClickUsdt0]: "intentzero",
  [Service.CCTPOneClick]: "cctpintent",
  [Service.OneClickCCTP]: "intentcctp",
  [Service.Native]: "native",
} as const;

export const enum ServiceProject {
  OneClick = 0,
  Usdt0 = 1,
  CCTP = 2,
  FraxZero = 6,
  FraxZeroOneClick = 7,
  OneClickFraxZero = 8,
  Usdt0OneClick = 3,
  OneClickUsdt0 = 4,
  Native = 5,
  CCTPOneClick = 9,
  OneClickCCTP = 10,
}

export const ServiceProjectMap: Record<ServiceProject, { name: string; service: Service; }> = {
  [ServiceProject.OneClick]: { name: "OneClick", service: Service.OneClick },
  [ServiceProject.Usdt0]: { name: "Usdt0", service: Service.Usdt0 },
  [ServiceProject.CCTP]: { name: "CCTP", service: Service.CCTP },
  [ServiceProject.FraxZero]: { name: "FraxZero", service: Service.FraxZero },
  [ServiceProject.FraxZeroOneClick]: { name: "FraxZeroOneClick", service: Service.FraxZeroOneClick },
  [ServiceProject.OneClickFraxZero]: { name: "OneClickFraxZero", service: Service.OneClickFraxZero },
  [ServiceProject.Usdt0OneClick]: { name: "Usdt0OneClick", service: Service.Usdt0OneClick },
  [ServiceProject.OneClickUsdt0]: { name: "OneClickUsdt0", service: Service.OneClickUsdt0 },
  [ServiceProject.Native]: { name: "Native", service: Service.Native },
  [ServiceProject.CCTPOneClick]: { name: "CCTPOneClick", service: Service.CCTPOneClick },
  [ServiceProject.OneClickCCTP]: { name: "OneClickCCTP", service: Service.OneClickCCTP },
};

export const OneClickSwapType = {
  Input: "EXACT_INPUT",
  Output: "EXACT_OUTPUT",
  Flex: "FLEX_INPUT",
} as const;
export type OneClickSwapType = (typeof OneClickSwapType)[keyof typeof OneClickSwapType];
