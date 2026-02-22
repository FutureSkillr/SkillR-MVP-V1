/**
 * useCapacityPolling — FR-062
 * Polls /api/capacity every 5s with exponential backoff on error.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { checkCapacity, type CapacityStatus } from '../services/capacity';

const BASE_INTERVAL_MS = 5000;
const MAX_BACKOFF_MS = 30000;

interface UseCapacityPollingResult {
  capacity: CapacityStatus | null;
  isPolling: boolean;
  error: boolean;
}

export function useCapacityPolling(enabled: boolean): UseCapacityPollingResult {
  const [capacity, setCapacity] = useState<CapacityStatus | null>(null);
  const [error, setError] = useState(false);
  const backoffRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    const result = await checkCapacity();
    if (result) {
      setCapacity(result);
      setError(false);
      backoffRef.current = 0;
    } else {
      setError(true);
      backoffRef.current = Math.min(backoffRef.current + 1, 5);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let cancelled = false;

    const loop = async () => {
      if (cancelled) return;
      await poll();
      if (cancelled) return;
      const delay = BASE_INTERVAL_MS * Math.pow(2, backoffRef.current);
      timerRef.current = setTimeout(loop, Math.min(delay, MAX_BACKOFF_MS));
    };

    loop();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, poll]);

  return { capacity, isPolling: enabled, error };
}
