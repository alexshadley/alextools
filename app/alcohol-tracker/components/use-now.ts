'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Current time, refreshed on an interval and when the tab becomes visible.
 * Returns a `refresh` so callers can bump it immediately after a write.
 */
export function useNow(intervalMs = 30_000): [number, () => void] {
  const [now, setNow] = useState(() => Date.now());
  const refresh = useCallback(() => setNow(Date.now()), []);
  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, refresh]);
  return [now, refresh];
}
