import { getRequest, GetStatusParams, GetStatusStableflowResponse, SendType, OneClickSwapType } from "@stableflow/core";
import oneClickService, { excludeFees as oneClickExcludeFees } from "../oneclick";
import usdt0Service, { excludeFees as usdt0ExcludeFees } from "../usdt0";
import Big from "big.js";
import { MIDDLE_CHAIN_REFOUND_ADDRESS, MIDDLE_TOKEN_CHAIN } from "./config";
import { ExecTime, OneClickSwapType } from "@stableflow/core";
import { OpenAPI } from "@stableflow/core";
import { Csl } from "@stableflow/core";
import { numberRemoveEndZero } from "@stableflow/core";

export class Usdt0OneClickService {
  public async quote(params: any) {
    const {
      dry,
      evmWallet,
      evmAddress,
      fromToken,
      toToken,
    } = params;

    const cs = new Csl(OpenAPI.DEBUG);
    const csl = cs.log;
    const execTime = new ExecTime({ type: "Usdt0OneClickService", logStyle: "lime-700", isDebug: OpenAPI.DEBUG });

    let middleChainWallet = evmWallet;
    if (!middleChainWallet) {
      throw new Error("evmWallet is required");
    }
    let middleChainRecipientAddress = evmAddress;
    if (!middleChainRecipientAddress) {
      throw new Error("evmAddress is required");
    }

    const usdt0Params = {
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
      refundTo: middleChainRecipientAddress,
      wallet: middleChainWallet,
    };

    // First, use the middle chain arb address (our refund address) to request Usdt0 for the output amount
    execTime.breakpoint();
    let usdt0Result = await usdt0Service.quote(usdt0Params);
    execTime.log("usdt0Service.quote: %o", usdt0Result);

    if (usdt0Result.errMsg) {
      return usdt0Result;
    }

    // Use the output amount from Usdt0 to request near-intents for the depositAddress
    oneClickParams.amountWei = Big(usdt0Result.outputAmount || 0).times(10 ** MIDDLE_TOKEN_CHAIN.decimals).toFixed(0, 0);
    execTime.breakpoint();
    const oneClickResult = await oneClickService.quote(oneClickParams);
    execTime.log("oneClickService.quote: %o", oneClickResult);

    if (oneClickResult.errMsg) {
      return oneClickResult;
    }

    if (!dry) {
      usdt0Params.recipient = oneClickResult.quote.depositAddress;

      execTime.breakpoint();
      usdt0Result = await usdt0Service.quote(usdt0Params);
      execTime.log("usdt0Service.quote again: %o", usdt0Result);
    }

    csl("Usdt0OneClickService quote", "rose-600", "oneClickResult: %o", oneClickResult);
    csl("Usdt0OneClickService quote", "rose-600", "usdt0Result: %o", usdt0Result);

    let totalFeesUsd = Big(0);
    const fees = {
      ...usdt0Result.fees,
    };
    for (const feeKey in oneClickResult.fees) {
      if (oneClickExcludeFees.includes(feeKey)) {
        continue;
      }
      fees[feeKey] = oneClickResult.fees[feeKey];
    }
    for (const feeKey in fees) {
      if (usdt0ExcludeFees.includes(feeKey)) {
        continue;
      }
      totalFeesUsd = Big(totalFeesUsd || 0).plus(fees[feeKey] || 0);
    }

    execTime.logTotal("Usdt0OneClickService.quote");

    return {
      ...usdt0Result,
      fees,
      totalFeesUsd: numberRemoveEndZero(Big(totalFeesUsd).toFixed(20)),
      estimateTime: usdt0Result.estimateTime + oneClickResult.estimateTime,
      outputAmount: oneClickResult.outputAmount,
      priceImpact: oneClickResult.priceImpact,
      exchangeRate: oneClickResult.exchangeRate,
      quoteParam: {
        ...usdt0Result.quoteParam,
        toToken: params.toToken,
        middleToken: MIDDLE_TOKEN_CHAIN,
        recipient: params.recipient,
        depositAddress: oneClickResult.quote.depositAddress,
      },
      sourceQuoteParams: params,
    };
  }

  public async estimateTransaction(params: any, quoteData: any) {
    const { } = params;

    return usdt0Service.estimateTransaction(params, quoteData);
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

export default new Usdt0OneClickService();
