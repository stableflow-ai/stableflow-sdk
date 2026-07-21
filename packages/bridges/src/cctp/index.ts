import { CCTP_TOKEN_PROXY, CCTP_TOKEN_PROXY_ABI } from "./contract";
import { CCTP_DOMAINS } from "./config";
import { getRequest, GetStatusParams, GetStatusStableflowResponse, OpenAPI } from '@stableflow/core';
import { SendType } from "@stableflow/core";
import { Service } from "@stableflow/core";
import Big from "big.js";
import { numberRemoveEndZero } from "@stableflow/core";
import { ExecTime } from "@stableflow/core";
import { Csl } from "@stableflow/core";

export const PayInLzToken = false;

export const excludeFees: string[] = ["estimateGasUsd"];

export class CCTPService {
  constructor() {
  }

  public async quote(params: any) {
    const {
      dry,
      wallet,
      amountWei,
      refundTo,
      recipient,
      fromToken,
      toToken,
      slippageTolerance,
      prices,
    } = params;

    const _quoteType = `CCTPService ${fromToken?.chainName}->${toToken?.chainName}`;
    const execTime = new ExecTime({ type: _quoteType, logStyle: "indigo-500", isDebug: OpenAPI.DEBUG });

    const sourceDomain = CCTP_DOMAINS[fromToken.chainName];
    const destinationDomain = CCTP_DOMAINS[toToken.chainName];
    const proxyAddress = CCTP_TOKEN_PROXY[fromToken.chainName];

    const result = await wallet.quote(Service.CCTP, {
      dry,
      proxyAddress,
      abi: CCTP_TOKEN_PROXY_ABI,
      amountWei,
      refundTo,
      recipient,
      fromToken,
      toToken,
      slippageTolerance,
      prices,
      excludeFees,
      destinationDomain,
      sourceDomain,
    });

    execTime.logTotal("CCTPService.quote");
    result.sourceQuoteParams = params;

    return result;
  }

  public async estimateTransaction(params: any, quoteData: any) {
    const {
      fromToken,
      wallet,
      prices,
      evmGasFees,
    } = params;

    const cs = new Csl(OpenAPI.DEBUG);
    const csl = cs.log;

    const result: any = { fees: {}, ...quoteData };

    const ett = await wallet.estimateTransaction({
      dry: false,
      ...quoteData.sendParam,
      fromToken,
      prices,
      evmGasFees,
    });
    result.fees.estimateGasUsd = ett.estimateSourceGasUsd;
    result.estimateSourceGas = ett.estimateSourceGas;
    result.estimateSourceGasUsd = ett.estimateSourceGasUsd;

    result.totalFeesUsd = "0";
    for (const feeKey in result.fees) {
      if (excludeFees.includes(feeKey) || !/Usd$/.test(feeKey)) {
        continue;
      }
      result.totalFeesUsd = Big(result.totalFeesUsd || 0).plus(result.fees[feeKey] || 0);
    }
    result.totalFeesUsd = numberRemoveEndZero(Big(result.totalFeesUsd).toFixed(20));

    if (fromToken.chainType === "evm") {
      const sendParams = result.sendParam?.param;
      if (
        sendParams
        && Array.isArray(sendParams)
        && sendParams[sendParams.length - 1]
        && typeof sendParams[sendParams.length - 1] === "object"
        && sendParams[sendParams.length - 1].gasLimit !== void 0
      ) {
        csl("CCTPService estimateTransaction", "green-500", "Old gasLimit: %o", sendParams[sendParams.length - 1].gasLimit);
        sendParams[sendParams.length - 1].gasLimit = ett.estimateSourceGasLimit;
        csl("CCTPService estimateTransaction", "green-500", "Updated gasLimit: %o", sendParams[sendParams.length - 1].gasLimit);
      }
    }

    return result;
  }

  public async send(params: any) {
    const {
      wallet,
      ...rest
    } = params;

    return wallet.send(SendType.SEND, rest);
  }

  public getStatus(params: GetStatusParams) {
    return getRequest<GetStatusStableflowResponse>("/v0/trade", {
      deposit_address: params.depositAddress,
    });
  }
}

export default new CCTPService();
