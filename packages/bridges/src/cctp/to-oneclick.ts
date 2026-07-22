import { getRequest, GetStatusParams, GetStatusStableflowResponse, SendType } from "@stableflow/core";
import oneClickService, { excludeFees as oneClickExcludeFees } from "../oneclick";
import cctpService from "./index";
import Big from "big.js";
import { MIDDLE_CHAIN_REFOUND_ADDRESS, MIDDLE_TOKEN_CHAIN } from "./config";
import { ExecTime, OneClickSwapType, OpenAPI } from "@stableflow/core";
import { Csl } from "@stableflow/core";
import { numberRemoveEndZero } from "@stableflow/core";

export const excludeFees: string[] = ["estimateGasUsd"];

export class CCTPOneClickService {
  public async quote(params: any) {
    const {
      dry,
      evmWallet,
      evmAddress,
    } = params;

    const cs = new Csl(OpenAPI.DEBUG);
    const csl = cs.log;
    const execTime = new ExecTime({ type: "CCTPOneClickService", logStyle: "lime-700", isDebug: OpenAPI.DEBUG });

    if (!evmWallet) {
      throw new Error("evmWallet is required");
    }
    if (!evmAddress) {
      throw new Error("evmAddress is required");
    }

    const cctpParams = {
      ...params,
      toToken: MIDDLE_TOKEN_CHAIN,
      destinationChain: MIDDLE_TOKEN_CHAIN.chainName,
      recipient: MIDDLE_CHAIN_REFOUND_ADDRESS,
    };
    const oneClickParams = {
      ...params,
      fromToken: MIDDLE_TOKEN_CHAIN,
      originAsset: MIDDLE_TOKEN_CHAIN.assetId,
      swapType: OneClickSwapType.Flex,
      isProxy: false,
      refundTo: evmAddress,
      wallet: evmWallet,
    };

    let cctpResult: any;
    let oneClickResult: any;

    if (!dry) {
      execTime.breakpoint();
      oneClickResult = await oneClickService.quote({
        ...oneClickParams,
        amountWei: Big(0.01).times(10 ** MIDDLE_TOKEN_CHAIN.decimals).toFixed(0, 0),
      });
      execTime.log("CCTPOneClickService.quote", "oneClickService.quote: %o", oneClickResult);

      if (oneClickResult.errMsg) {
        return oneClickResult;
      }

      cctpParams.recipient = oneClickResult.quote.depositAddress;
      execTime.breakpoint();
      cctpResult = await cctpService.quote(cctpParams);
      execTime.log("CCTPOneClickService.quote", "cctpService.quote: %o", cctpResult);

      execTime.breakpoint();
      try {
        const oneClickResult2 = await oneClickService.quote({
          ...oneClickParams,
          dry: true,
          amountWei: Big(cctpResult.outputAmount || 0).times(10 ** MIDDLE_TOKEN_CHAIN.decimals).toFixed(0, 0),
        });
        oneClickResult.fees = oneClickResult2.fees;
        oneClickResult.outputAmount = oneClickResult2.outputAmount;
        oneClickResult.estimateTime = oneClickResult2.estimateTime;
        oneClickResult.priceImpact = oneClickResult2.priceImpact;
        oneClickResult.exchangeRate = oneClickResult2.exchangeRate;
        execTime.log("CCTPOneClickService.quote", "confirm get actual output amount result: %o", oneClickResult2);
      } catch (err) {
        execTime.log("CCTPOneClickService.quote", "confirm get actual output amount error: %o", err);
      }
    } else {
      execTime.breakpoint();
      cctpResult = await cctpService.quote(cctpParams);
      execTime.log("CCTPOneClickService.quote", "cctpService.quote dry: %o", cctpResult);

      if (cctpResult.errMsg) {
        return cctpResult;
      }

      oneClickParams.amountWei = Big(cctpResult.outputAmount || 0).times(10 ** MIDDLE_TOKEN_CHAIN.decimals).toFixed(0, 0);
      execTime.breakpoint();
      oneClickResult = await oneClickService.quote(oneClickParams);
      execTime.log("CCTPOneClickService.quote", "oneClickService.quote: %o", oneClickResult);
    }

    if (oneClickResult.errMsg) {
      return oneClickResult;
    }

    if (cctpResult.errMsg) {
      return cctpResult;
    }

    csl("CCTPOneClickService quote", "rose-600", "oneClickResult: %o", oneClickResult);
    csl("CCTPOneClickService quote", "rose-600", "cctpResult: %o", cctpResult);

    let totalFeesUsd = Big(0);
    const fees = {
      ...cctpResult.fees,
    };
    for (const feeKey in oneClickResult.fees) {
      if (oneClickExcludeFees.includes(feeKey)) {
        continue;
      }
      fees[feeKey] = oneClickResult.fees[feeKey];
    }
    for (const feeKey in fees) {
      if (excludeFees.includes(feeKey)) {
        continue;
      }
      totalFeesUsd = Big(totalFeesUsd || 0).plus(fees[feeKey] || 0);
    }

    execTime.logTotal("CCTPOneClickService.quote");

    return {
      ...cctpResult,
      fees,
      totalFeesUsd: numberRemoveEndZero(Big(totalFeesUsd).toFixed(20)),
      estimateTime: cctpResult.estimateTime + oneClickResult.estimateTime,
      outputAmount: oneClickResult.outputAmount,
      priceImpact: oneClickResult.priceImpact,
      exchangeRate: oneClickResult.exchangeRate,
      quoteParam: {
        ...cctpResult.quoteParam,
        toToken: params.toToken,
        middleToken: MIDDLE_TOKEN_CHAIN,
        recipient: params.recipient,
        depositAddress: oneClickResult.quote.depositAddress,
      },
      sourceQuoteParams: params,
    };
  }

  public async estimateTransaction(params: any, quoteData: any) {
    return cctpService.estimateTransaction(params, quoteData);
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

export default new CCTPOneClickService();
