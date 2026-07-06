import { useCallback, useEffect, useRef } from 'react';

export function useDebounceFn(fn: () => void | Promise<void>, options: { wait: number }) {
  const { wait } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const run = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void fn();
    }, wait);
  }, [fn, wait]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { run, cancel };
}
