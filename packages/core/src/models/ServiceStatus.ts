/**
 * OneClick Statuses
 * @see https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart#status-response
 */
export enum OneClickStatus {
  /**
   * Deposit transaction detected
   */
  KNOWN_DEPOSIT_TX = 'KNOWN_DEPOSIT_TX',
  /**
   * Awaiting your token deposit
   */
  PENDING_DEPOSIT = 'PENDING_DEPOSIT',
  /**
   * Deposit below required amount
   */
  INCOMPLETE_DEPOSIT = 'INCOMPLETE_DEPOSIT',
  /**
   * Swap being executed
   */
  PROCESSING = 'PROCESSING',
  /**
   * Tokens delivered to destination address
   */
  SUCCESS = 'SUCCESS',
  /**
   * Swap failed, funds returned to refund address
   */
  REFUNDED = 'REFUNDED',
  /**
   * Swap encountered an error
   */
  FAILED = 'FAILED',
}

/**
 * Transaction Statuses
 * @see https://docs.layerzero.network/v2/developers/evm/tooling/layerzeroscan#transaction-statuses
 */
export enum LayerZeroStatus {
  /**
   * The message has been successfully sent and received by the destination chain.
   */
  DELIVERED = "DELIVERED",
  /**
   * The message is waiting for source block confirmations, verification, or execution on the destination chain.
   */
  INFLIGHT = "INFLIGHT",
  /**
   * The message arrived at the destination, but reverted or ran out of gas during execution and needs to be retried.
   */
  PAYLOAD_STORED = "PAYLOAD_STORED",
  /**
   * The transaction encountered an error and did not complete.
   */
  FAILED = "FAILED",
  /**
   * A previous message nonce has a stored payload, halting the current transaction.
   */
  BLOCKED = "BLOCKED",
  /**
   * The destination transaction has been submitted and is waiting to reach finality on the destination chain.
   */
  CONFIRMING = "CONFIRMING",
  APPLICATION_BURNED = "APPLICATION_BURNED",
  APPLICATION_SKIPPED = "APPLICATION_SKIPPED",
  UNRESOLVABLE_COMMAND = "UNRESOLVABLE_COMMAND",
  MALFORMED_COMMAND = "MALFORMED_COMMAND",
}

/**
 * Stableflow Statuses
 */
export enum StableflowStatus {
  /**
   * Pending
   */
  PENDING = 0,
  /**
   * Success
   */
  SUCCESS = 1,
  /**
   * Failed
   */
  FAILED = 2,
  /**
   * CCTP Confirming
   */
  CONFIRMING = 3,
  /**
   * Awaiting token deposit
   */
  CONTINUE = 4,
  /**
   * LayerZero tx submitted
   */
  LAYERZERO_SUBMITTED = 5,
}
