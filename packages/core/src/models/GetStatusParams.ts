import { ServiceProject } from "../core/Service";
import { StableflowStatus } from "./ServiceStatus";

export interface GetStatusParams {
  /**
   * Required if the source chain transaction was submitted via oneclick; pass the deposit address.
   */
  depositAddress?: string;
  /**
   * Source chain transaction hash.
   */
  hash?: string;
  /**
   * Required if the source chain transaction was submitted via oneclick and depositMemo is available; pass depositMemo.
   */
  depositMemo?: string;
}

export interface GetStatusStableflowResponse {
  code: number;
  data: {
    address: string;
    create_time: string;
    deposit_address: string;
    fee: string;
    from_chain: string;
    id: number;
    ip: string;
    project: ServiceProject;
    quote_ids: string;
    receive_address: string;
    status: StableflowStatus;
    symbol: string;
    to_chain: string;
    to_symbol: string;
    to_tx_hash: string;
    token_in_amount: string;
    token_out_amount: string;
    trade_status: string;
    tx_hash: string;
    volume: string;
  } | null;
}
