import Big from "big.js";
import { Service, type TokenConfig } from "@stableflow/core";
import { formatNumber } from "./format-number";

export const formatQuoteError = (error: any, options: { service: Service; fromToken: TokenConfig; }) => {
  const { service, fromToken } = options;

  const defaultErrorMessage = "Failed to get quote, please try again later";

  if (([Service.OneClick, Service.OneClickUsdt0, Service.Usdt0OneClick, Service.CCTPOneClick, Service.OneClickCCTP, Service.FraxZeroOneClick, Service.OneClickFraxZero] as Service[]).includes(service)) {
    const getQuoteErrorMessage = (): { message: string; sourceMessage: string; } => {
      const apiMessage =
        error?.body?.message ||
        error?.response?.data?.message;
      const _messageResult = {
        message: error?.message || defaultErrorMessage,
        sourceMessage: apiMessage || defaultErrorMessage,
      };
      if (apiMessage && apiMessage !== "Internal server error") {
        // quote failed, maybe out of liquidity
        if (apiMessage === "Failed to get quote") {
          _messageResult.message = "Amount exceeds max";
          return _messageResult;
        }
        // Amount is too low for bridge — convert wei minimum to readable amount
        if (apiMessage.includes("Amount is too low for bridge, try at least")) {
          const match = apiMessage.match(/try at least\s+(\d+(?:\.\d+)?)/i);
          const minWei = match ? match[1] : Big(1).times(10 ** fromToken.decimals).toFixed(0);
          const minAmount = Big(minWei).div(10 ** fromToken.decimals);
          const readableAmount = formatNumber(minAmount, fromToken.decimals, true);
          _messageResult.message = `Amount is too low, at least ${readableAmount} ${fromToken.symbol}`;
          return _messageResult;
        }
        // app fees exceeds 5% of amount
        if (apiMessage.includes("Cannot convert undefined or null to object")) {
          _messageResult.message = "app fees exceeds 5% of amount";
          return _messageResult;
        }
        return _messageResult;
      }
      // Unknown error
      return _messageResult;
    };
    const onclickErrMsg = getQuoteErrorMessage();
    return {
      serviceType: service,
      error: onclickErrMsg.message,
    };
  }

  return {
    serviceType: service,
    error: error?.message || defaultErrorMessage,
  };
};
