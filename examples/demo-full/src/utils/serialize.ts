/** Keys that hold runtime objects (wallet, contract tx, etc.) and must not be persisted. */
const STRIP_KEYS = new Set(['sendParam', 'sourceQuoteParams', 'wallet', 'evmWallet']);

/**
 * Deep-clone quote (or transaction) data for zustand/localStorage persistence.
 * Strips non-JSON-safe fields and breaks circular references (e.g. RxJS subscriptions on wallet).
 */
export function serializeForPersist<T>(value: T): T {
  const seen = new WeakSet<object>();

  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (STRIP_KEYS.has(key)) {
        return undefined;
      }
      if (typeof val === 'bigint') {
        return val.toString();
      }
      if (typeof val === 'function') {
        return undefined;
      }
      if (val !== null && typeof val === 'object') {
        if (seen.has(val)) {
          return undefined;
        }
        seen.add(val);
      }
      return val;
    }),
  ) as T;
}
