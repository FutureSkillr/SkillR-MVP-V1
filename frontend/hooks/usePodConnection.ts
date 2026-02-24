import { useState, useCallback, useEffect } from 'react';
import type {
  PodConnectionState,
  PodModalStep,
  PodPermission,
  PodProvider,
  PodSyncResult,
} from '../types/pod';
import { DEFAULT_POD_PERMISSIONS } from '../types/pod';
import {
  checkPodReadiness,
  getPodStatus,
  connectPod,
  disconnectPod,
  syncPod,
} from '../services/pod';
import type { PodSyncRequest } from '../types/pod';

export interface UsePodConnectionOptions {
  enabled: boolean;
}

export interface UsePodConnectionResult {
  /** Whether Pod infrastructure is available. */
  available: boolean;
  /** Whether the managed (local CSS) provider is available (TC-036). */
  managedAvailable: boolean;
  /** Base URL of the managed CSS instance (e.g. "http://localhost:3003"). */
  managedPodUrl: string | null;
  /** Current Pod connection state (null = loading). */
  podState: PodConnectionState | null;
  /** Whether the connect modal is open. */
  modalOpen: boolean;
  /** Current step in the connect modal. */
  modalStep: PodModalStep;
  /** Data permissions. */
  permissions: PodPermission[];
  /** Loading/syncing indicator. */
  loading: boolean;
  /** Last sync result. */
  syncResult: PodSyncResult | null;
  /** Error message. */
  error: string | null;
  /** Open the connect modal. */
  openModal: () => void;
  /** Close the connect modal. */
  closeModal: () => void;
  /** Advance to a specific modal step. */
  setStep: (step: PodModalStep) => void;
  /** Toggle a permission. */
  togglePermission: (category: string) => void;
  /** Initiate Pod connection. */
  connect: (provider: PodProvider, podUrl?: string, email?: string, password?: string) => Promise<void>;
  /** Disconnect the Pod. */
  disconnect: () => Promise<void>;
  /** Trigger manual sync. */
  sync: (data: PodSyncRequest) => Promise<void>;
  /** Refresh status from backend. */
  refresh: () => Promise<void>;
}

const POD_READY_KEY = 'skillr:pod_ready';
const POD_MANAGED_KEY = 'skillr:pod_managed_ready';
const POD_MANAGED_URL_KEY = 'skillr:pod_managed_url';

export function usePodConnection({ enabled }: UsePodConnectionOptions): UsePodConnectionResult {
  const [available, setAvailable] = useState(() => {
    try { return sessionStorage.getItem(POD_READY_KEY) === '1'; } catch { return false; }
  });
  const [managedAvailable, setManagedAvailable] = useState(() => {
    try { return sessionStorage.getItem(POD_MANAGED_KEY) === '1'; } catch { return false; }
  });
  const [managedPodUrl, setManagedPodUrl] = useState<string | null>(() => {
    try { return sessionStorage.getItem(POD_MANAGED_URL_KEY); } catch { return null; }
  });
  const [podState, setPodState] = useState<PodConnectionState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<PodModalStep>('explain');
  const [permissions, setPermissions] = useState<PodPermission[]>(DEFAULT_POD_PERMISSIONS);
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<PodSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const status = await getPodStatus();
    if (status) {
      console.debug('[Pod] refresh: connected=%s', status.connected);
      setPodState(status);
    }
  }, [enabled]);

  // Check readiness on mount, then load status if available (FR-127, TC-036)
  // Result is cached in sessionStorage — one check per browser session.
  useEffect(() => {
    if (!enabled) return;
    // If already resolved from sessionStorage, just refresh pod status
    const cachedReady = sessionStorage.getItem(POD_READY_KEY);
    if (cachedReady !== null) {
      const ready = cachedReady === '1';
      const managed = sessionStorage.getItem(POD_MANAGED_KEY) === '1';
      const cachedUrl = sessionStorage.getItem(POD_MANAGED_URL_KEY);
      console.debug('[Pod] readiness (cached): available=%s managedAvailable=%s url=%s', ready, managed, cachedUrl);
      setAvailable(ready);
      setManagedAvailable(managed);
      setManagedPodUrl(cachedUrl);
      if (ready) refresh();
      return;
    }
    let cancelled = false;
    checkPodReadiness().then((result) => {
      if (cancelled) return;
      console.debug('[Pod] readiness: available=%s managedAvailable=%s url=%s', result.available, result.managedAvailable, result.managedPodUrl);
      try {
        sessionStorage.setItem(POD_READY_KEY, result.available ? '1' : '0');
        sessionStorage.setItem(POD_MANAGED_KEY, result.managedAvailable ? '1' : '0');
        if (result.managedPodUrl) {
          sessionStorage.setItem(POD_MANAGED_URL_KEY, result.managedPodUrl);
        }
      } catch {}
      setAvailable(result.available);
      setManagedAvailable(result.managedAvailable);
      setManagedPodUrl(result.managedPodUrl || null);
      if (result.available) refresh();
    });
    return () => { cancelled = true; };
  }, [enabled, refresh]);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setModalStep('explain');
    setError(null);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalStep('explain');
    setError(null);
  }, []);

  const togglePermission = useCallback((category: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.category === category ? { ...p, enabled: !p.enabled } : p
      )
    );
  }, []);

  const connect = useCallback(async (provider: PodProvider, podUrl?: string, email?: string, password?: string) => {
    console.debug('[Pod] connect: provider=%s url=%s', provider, podUrl);
    setLoading(true);
    setError(null);
    try {
      const conn = await connectPod({ provider, podUrl, email, password });
      console.debug('[Pod] connect: ok');
      setPodState({
        connected: true,
        podUrl: conn.podUrl || podUrl || '',
        webId: conn.webId || '',
        provider: conn.provider || provider,
        connectedAt: conn.connectedAt || new Date().toISOString(),
        lastSyncedAt: null,
        syncStatus: 'connected',
      });
      setModalStep('permissions');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verbindung fehlgeschlagen';
      console.error('[Pod] connect: FAILED %s', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    console.debug('[Pod] disconnect');
    setLoading(true);
    setError(null);
    try {
      await disconnectPod();
      console.debug('[Pod] disconnect: ok');
      setPodState({
        connected: false,
        podUrl: '',
        webId: '',
        provider: 'none',
        connectedAt: null,
        lastSyncedAt: null,
        syncStatus: 'none',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Trennung fehlgeschlagen';
      console.error('[Pod] disconnect: FAILED %s', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const sync = useCallback(async (data: PodSyncRequest) => {
    console.debug('[Pod] sync');
    setLoading(true);
    setError(null);
    setSyncResult(null);
    try {
      const result = await syncPod(data);
      console.debug('[Pod] sync: ok synced=%d', result.syncedEntities);
      setSyncResult(result);
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Synchronisierung fehlgeschlagen';
      console.error('[Pod] sync: FAILED %s', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return {
    available,
    managedAvailable,
    managedPodUrl,
    podState,
    modalOpen,
    modalStep,
    permissions,
    loading,
    syncResult,
    error,
    openModal,
    closeModal,
    setStep: setModalStep,
    togglePermission,
    connect,
    disconnect,
    sync,
    refresh,
  };
}
