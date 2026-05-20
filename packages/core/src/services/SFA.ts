/* StableFlow AI SDK */
/* tslint:disable */
/* eslint-disable */
import type { GetExecutionStatusResponse } from '../models/GetExecutionStatusResponse';
import type { QuoteRequest } from '../models/QuoteRequest';
import type { QuoteResponse } from '../models/QuoteResponse';
import type { SubmitDepositTxRequest } from '../models/SubmitDepositTxRequest';
import type { SubmitDepositTxResponse } from '../models/SubmitDepositTxResponse';
import type { TokenResponse } from '../models/TokenResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { getRequest, postRequest } from '../core/Fetch';

export const submitOneclickDepositTx = (
  requestBody: SubmitDepositTxRequest,
): CancelablePromise<SubmitDepositTxResponse> => {
  return postRequest("/v0/deposit/submit", requestBody);
};

/**
 * StableFlow AI Service — HTTP API helpers.
 *
 * For full cross-chain bridge flows (multi-route quote, send, per-bridge status),
 * install and use `@stableflow/bridges` (`BridgeSFA`).
 */
export class SFA {
  /**
   * Get supported tokens
   * Retrieves a list of tokens currently supported by the StableFlow AI API for asset swaps.
   */
  public static getTokens(): CancelablePromise<Array<TokenResponse>> {
    return getRequest("/v0/tokens");
  }

  /**
   * Request a swap quote
   * Generates a swap quote based on input parameters such as the assets, amount, slippage tolerance, and recipient/refund information.
   */
  public static getQuote(
    requestBody: QuoteRequest,
  ): CancelablePromise<QuoteResponse> {
    return postRequest("/v0/quote", {
      ...requestBody,
      referral: "stableflow",
    });
  }

  /**
   * Check swap execution status
   * Retrieves the current status of a swap using the unique deposit address from the quote.
   */
  public static getExecutionStatus(
    depositAddress: string,
    depositMemo?: string,
  ): CancelablePromise<GetExecutionStatusResponse> {
    return getRequest("/v0/status", {
      'depositAddress': depositAddress,
      'depositMemo': depositMemo,
    });
  }

  /**
   * Submit deposit transaction hash (OneClick)
   * Optionally notifies the service that a deposit has been sent to the specified address.
   */
  public static submitDepositTx = submitOneclickDepositTx;
}
