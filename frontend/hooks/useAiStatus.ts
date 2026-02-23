import { useState, useEffect, useRef, useCallback } from 'react';

export type AiConnectionStatus = 'connected' | 'error' | 'network_error' | 'unknown';

export interface AiStatusInfo {
  status: AiConnectionStatus;
  latencyMs: number;
  errorCode?: string;
  message?: string;
}

interface AiStatusResponse {
  status: string;
  latency_ms: number;
  error_code?: string;
  message?: string;
}

const POLL_INTERVAL_OK = 30_000;      // 30s when connected
const POLL_INTERVAL_ERROR = 10_000;   // 10s when error
const POLL_INTERVAL_NETWORK = 15_000; // 15s when network offline

/**
 * Polls /api/v1/ai/status to determine Vertex AI connectivity.
 * Returns status for the diamond indicator: connected | error | network_error | unknown.
 */
export function useAiStatus(): AiStatusInfo {
  const [info, setInfo] = useState<AiStatusInfo>({
    status: 'unknown',
    latencyMs: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const check = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch('/api/v1/ai/status', { signal: controller.signal });
      clearTimeout(timeout);

      if (!resp.ok) {
        // Server returned non-200 (AI routes not registered = AI unavailable)
        console.warn(`[AI Status] HTTP ${resp.status}`);
        if (mountedRef.current) {
          setInfo({
            status: 'error',
            latencyMs: 0,
            errorCode: `http_${resp.status}`,
            message: `Server returned ${resp.status}`,
          });
        }
        return;
      }

      const data: AiStatusResponse = await resp.json();
      console.log(`[AI Status] ${data.status} (latency=${data.latency_ms}ms${data.error_code ? `, error=${data.error_code}` : ''})`);

      if (mountedRef.current) {
        setInfo({
          status: data.status as AiConnectionStatus,
          latencyMs: data.latency_ms,
          errorCode: data.error_code,
          message: data.message,
        });
      }
    } catch (err) {
      // Network-level failure (fetch itself failed)
      const msg = err instanceof Error ? err.message : String(err);
      const isAbort = msg.includes('abort');
      console.warn(`[AI Status] Network error: ${msg}`);

      if (mountedRef.current) {
        setInfo({
          status: 'network_error',
          latencyMs: 0,
          errorCode: isAbort ? 'timeout' : 'network_error',
          message: msg,
        });
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const schedule = () => {
      const interval =
        info.status === 'connected' ? POLL_INTERVAL_OK
        : info.status === 'network_error' ? POLL_INTERVAL_NETWORK
        : info.status === 'unknown' ? 2000 // fast first check
        : POLL_INTERVAL_ERROR;

      timerRef.current = setTimeout(async () => {
        await check();
        if (mountedRef.current) schedule();
      }, interval);
    };

    // Initial check immediately
    check().then(() => {
      if (mountedRef.current) schedule();
    });

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [check, info.status]);

  return info;
}
