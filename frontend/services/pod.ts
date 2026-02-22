import type {
  PodConnectionState,
  PodSyncResult,
  PodConnectRequest,
  PodSyncRequest,
  PodData,
} from '../types/pod';

const API_BASE = '/api/v1/pod';

/** Get current Pod connection status. */
export async function getPodStatus(): Promise<PodConnectionState | null> {
  try {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Connect a Pod. */
export async function connectPod(req: PodConnectRequest): Promise<PodConnectionState> {
  const res = await fetch(`${API_BASE}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Pod connect failed (${res.status})`);
  }
  return await res.json();
}

/** Disconnect the Pod. */
export async function disconnectPod(): Promise<void> {
  const res = await fetch(`${API_BASE}/connect`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Pod disconnect failed (${res.status})`);
  }
}

/** Trigger a manual sync (App -> Pod). */
export async function syncPod(req: PodSyncRequest): Promise<PodSyncResult> {
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Pod sync failed (${res.status})`);
  }
  return await res.json();
}

/** Read Pod contents in human-readable format. */
export async function getPodData(): Promise<PodData | null> {
  try {
    const res = await fetch(`${API_BASE}/data`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
