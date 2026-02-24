import type {
  PodConnectionState,
  PodSyncResult,
  PodConnectRequest,
  PodSyncRequest,
  PodData,
} from '../types/pod';
import { getAuthHeaders } from './auth';

const API_BASE = '/api/v1/pod';

/** Readiness result from backend (TC-036). */
export interface PodReadiness {
  available: boolean;
  managedAvailable: boolean;
  /** Base URL of the managed CSS instance (only present when managedAvailable). */
  managedPodUrl?: string;
}

/** Check if Pod infrastructure is available (public, no auth). */
export async function checkPodReadiness(): Promise<PodReadiness> {
  const url = `${API_BASE}/readiness`;
  console.debug('[Pod] checkPodReadiness:', url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[Pod] checkPodReadiness: HTTP %d', res.status);
      return { available: false, managedAvailable: false };
    }
    const data = await res.json();
    console.debug('[Pod] checkPodReadiness: available=%s managedAvailable=%s', data.available, data.managedAvailable);
    return {
      available: data.available === true,
      managedAvailable: data.managedAvailable === true,
      managedPodUrl: data.managedPodUrl || undefined,
    };
  } catch (e) {
    console.warn('[Pod] checkPodReadiness: fetch error', e);
    return { available: false, managedAvailable: false };
  }
}

/** Get current Pod connection status. */
export async function getPodStatus(): Promise<PodConnectionState | null> {
  console.debug('[Pod] getPodStatus');
  try {
    const res = await fetch(`${API_BASE}/status`, { headers: getAuthHeaders() });
    if (!res.ok) {
      console.warn('[Pod] getPodStatus: HTTP %d', res.status);
      return null;
    }
    const data = await res.json();
    console.debug('[Pod] getPodStatus: connected=%s', data.connected);
    return data;
  } catch (e) {
    console.warn('[Pod] getPodStatus: fetch error', e);
    return null;
  }
}

/** Connect a Pod. */
export async function connectPod(req: PodConnectRequest): Promise<PodConnectionState> {
  console.debug('[Pod] connectPod: provider=%s', req.provider);
  const res = await fetch(`${API_BASE}/connect`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[Pod] connectPod: HTTP %d — %s', res.status, body.message);
    throw new Error(body.message || `Pod connect failed (${res.status})`);
  }
  console.debug('[Pod] connectPod: success');
  return await res.json();
}

/** Disconnect the Pod. */
export async function disconnectPod(): Promise<void> {
  console.debug('[Pod] disconnectPod');
  const res = await fetch(`${API_BASE}/connect`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[Pod] disconnectPod: HTTP %d — %s', res.status, body.message);
    throw new Error(body.message || `Pod disconnect failed (${res.status})`);
  }
  console.debug('[Pod] disconnectPod: success');
}

/** Trigger a manual sync (App -> Pod). */
export async function syncPod(req: PodSyncRequest): Promise<PodSyncResult> {
  console.debug('[Pod] syncPod');
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[Pod] syncPod: HTTP %d — %s', res.status, body.message);
    throw new Error(body.message || `Pod sync failed (${res.status})`);
  }
  const result = await res.json();
  console.debug('[Pod] syncPod: synced=%d', result.syncedEntities);
  return result;
}

/** Read Pod contents in human-readable format. */
export async function getPodData(): Promise<PodData | null> {
  console.debug('[Pod] getPodData');
  try {
    const res = await fetch(`${API_BASE}/data`, { headers: getAuthHeaders() });
    if (!res.ok) {
      console.warn('[Pod] getPodData: HTTP %d', res.status);
      return null;
    }
    const data = await res.json();
    const profileKeys = data.profile ? Object.keys(data.profile).length : 0;
    const journeyKeys = data.journey ? Object.keys(data.journey).length : 0;
    console.debug('[Pod] getPodData: profileKeys=%d journeyKeys=%d', profileKeys, journeyKeys);
    return data;
  } catch (e) {
    console.warn('[Pod] getPodData: fetch error', e);
    return null;
  }
}
