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
  connect: (provider: PodProvider, podUrl?: string) => Promise<void>;
  /** Disconnect the Pod. */
  disconnect: () => Promise<void>;
  /** Trigger manual sync. */
  sync: (data: PodSyncRequest) => Promise<void>;
  /** Refresh status from backend. */
  refresh: () => Promise<void>;
}

export function usePodConnection({ enabled }: UsePodConnectionOptions): UsePodConnectionResult {
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
    if (status) setPodState(status);
  }, [enabled]);

  // Load status on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const connect = useCallback(async (provider: PodProvider, podUrl?: string) => {
    setLoading(true);
    setError(null);
    try {
      const conn = await connectPod({ provider, podUrl });
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
      setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await disconnectPod();
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
      setError(err instanceof Error ? err.message : 'Trennung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, []);

  const sync = useCallback(async (data: PodSyncRequest) => {
    setLoading(true);
    setError(null);
    setSyncResult(null);
    try {
      const result = await syncPod(data);
      setSyncResult(result);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synchronisierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return {
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
