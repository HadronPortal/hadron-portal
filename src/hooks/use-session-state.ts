import { useState, useCallback } from 'react';

/**
 * Like useState but persists to sessionStorage so values survive navigation.
 * Falls back to regular useState if sessionStorage is unavailable.
 */
export function useSessionState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // ignore
    }
    return defaultValue;
  });

  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setStateRaw((prev) => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [key]);

  return [state, setState];
}
