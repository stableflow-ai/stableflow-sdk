/* StableFlow AI SDK */
/* tslint:disable */
/* eslint-disable */
import type { QuoteResponse } from './QuoteResponse';
import { OneClickStatus } from './ServiceStatus';
import type { SwapDetails } from './SwapDetails';

export type GetExecutionStatusResponse = {
  /**
   * Quote response from the original request
   */
  quoteResponse: QuoteResponse;
  status: OneClickStatus;
  /**
   * Last time the state was updated
   */
  updatedAt: string;
  /**
   * Details of actual swaps and withdrawals
   */
  swapDetails: SwapDetails;
};
