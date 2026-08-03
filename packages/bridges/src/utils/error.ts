import Big from "big.js";
import { Service, type TokenConfig } from "@stableflow/core";
import { formatNumber } from "./format-number";
import { FRAXZERO_MIDDLE_TOKEN_USDC } from "../fraxzero/config";
import { MIDDLE_TOKEN_CHAIN as USDT0_MIDDLE_TOKEN } from "../usdt0/config";
import { MIDDLE_TOKEN_CHAIN as CCTP_MIDDLE_TOKEN } from "../cctp/config";

const ONECLICK_SECOND_HOP_SERVICES: Service[] = [
  Service.FraxZeroOneClick,
  Service.Usdt0OneClick,
  Service.CCTPOneClick,
];

const resolveAmountToken = (service: Service, fromToken: TokenConfig): TokenConfig => {
  if (service === Service.FraxZeroOneClick) return FRAXZERO_MIDDLE_TOKEN_USDC;
  if (service === Service.Usdt0OneClick) return USDT0_MIDDLE_TOKEN;
  if (service === Service.CCTPOneClick) return CCTP_MIDDLE_TOKEN;
  return fromToken;
};

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
          const amountToken = resolveAmountToken(service, fromToken);
          const isMiddleToken = ONECLICK_SECOND_HOP_SERVICES.includes(service);
          const match = apiMessage.match(/try at least\s+(\d+(?:\.\d+)?)/i);
          const minWei = match ? match[1] : Big(1).times(10 ** amountToken.decimals).toFixed(0);
          const minAmount = Big(minWei).div(10 ** amountToken.decimals);
          const readableAmount = formatNumber(minAmount, amountToken.decimals, true);
          _messageResult.message = isMiddleToken
            ? `Middle token amount is too low, at least ${readableAmount} ${amountToken.symbol}`
            : `Amount is too low, at least ${readableAmount} ${amountToken.symbol}`;
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
