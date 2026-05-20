/**
 * @deprecated Please use Service instead
 */
export type ServiceType = "oneclick" | "usdt0" | "cctp" | "fraxzero" | "fraxzero-oneclick" | "oneclick-fraxzero" | "usdt0-oneclick" | "oneclick-usdt0" | "native";

export const Service = {
  OneClick: "oneclick",
  Usdt0: "usdt0",
  CCTP: "cctp",
  FraxZero: "fraxzero",
  FraxZeroOneClick: "fraxzero-oneclick",
  OneClickFraxZero: "oneclick-fraxzero",
  Usdt0OneClick: "usdt0-oneclick",
  OneClickUsdt0: "oneclick-usdt0",
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
}
