import type { HyperliquidDepositStatus } from '@stableflow/hyperliquid';
import type { Transaction } from '../types';

export function mapHyperliquidDepositStatus(
  status: HyperliquidDepositStatus | undefined
): Transaction['status'] {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
    case 'REFUNDED':
      return 'failed';
    case 'PROCESSING':
      return 'processing';
    default:
      return 'pending';
  }
}
