import { ethers } from "ethers";
import { USDT0_CONFIG } from "./config";
import { OFT_ABI } from "./contract";
import { ExecTime } from "@stableflow/core";
import { OpenAPI } from "@stableflow/core";
import { usdt0Chains } from "@stableflow/core";
import { evmRpcFallbackProvider } from "@stableflow/utils-evm";
import { Csl } from "@stableflow/core";

export const getHopMsgFee = async (params: any) => {
  const {
    sendParam,
    toToken,
  } = params;

  const cs = new Csl(OpenAPI.DEBUG);
  const csl = cs.log;

  const execTime = new ExecTime({ type: "getHopMsgFee", logStyle: "lime-800", isDebug: OpenAPI.DEBUG });

  const originLayerzero = USDT0_CONFIG["Arbitrum"];
  const destinationLayerzero = USDT0_CONFIG[toToken.chainName];

  let arbitrumOft = originLayerzero.oft;
  let destinationLayerzeroAddress = destinationLayerzero.oft || destinationLayerzero.oftLegacy;
  const isDestinationLegacy = destinationLayerzeroAddress === destinationLayerzero.oftLegacy;
  if (isDestinationLegacy) {
    arbitrumOft = originLayerzero.oftLegacy || originLayerzero.oft;
  }

  execTime.breakpoint();
  const provider = evmRpcFallbackProvider(usdt0Chains["arb"]);
  const oftContractRead = new ethers.Contract(arbitrumOft!, OFT_ABI, provider);
  execTime.log("provider init");

  try {
    execTime.breakpoint();
    const msgFee = await oftContractRead.quoteSend.staticCall(sendParam, false);
    execTime.log("quoteSend");

    const [nativeFee] = msgFee;

    execTime.logTotal("getHopMsgFee");

    return nativeFee * 100n / 100n;
  } catch (error) {
    csl("getHopMsgFee", "red-500", "getHopMsgFee failed: %o", error);
    throw new Error("Quote multi hop message fee failed");
  }
};
