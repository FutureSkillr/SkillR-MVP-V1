import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPodStatus, connectPod, disconnectPod, syncPod, getPodData } from './pod';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('getPodStatus', () => {
  it('returns status when connected', async () => {
    const status = {
      connected: true,
      podUrl: 'http://localhost:3000/user-1',
      webId: 'http://localhost:3000/user-1/profile/card#me',
      provider: 'managed',
      connectedAt: '2026-02-21T10:00:00Z',
      lastSyncedAt: null,
      syncStatus: 'connected',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(status),
    });

    const result = await getPodStatus();
    expect(result).toEqual(status);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/pod/status');
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));

    const result = await getPodStatus();
    expect(result).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getPodStatus();
    expect(result).toBeNull();
  });
});

describe('connectPod', () => {
  it('sends POST with provider and podUrl', async () => {
    const conn = {
      podUrl: 'http://localhost:3000/user-1',
      webId: 'http://localhost:3000/user-1/profile/card#me',
      provider: 'managed',
      connectedAt: '2026-02-21T10:00:00Z',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(conn),
    });

    const result = await connectPod({ provider: 'managed', podUrl: 'http://localhost:3000' });
    expect(result).toEqual(conn);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/pod/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'managed', podUrl: 'http://localhost:3000' }),
    });
  });

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'pod unavailable' }),
    });

    await expect(connectPod({ provider: 'managed', podUrl: 'http://localhost:3000' }))
      .rejects.toThrow();
  });
});

describe('disconnectPod', () => {
  it('sends DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'disconnected' }),
    });

    await disconnectPod();
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/pod/connect', { method: 'DELETE' });
  });

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    await expect(disconnectPod()).rejects.toThrow();
  });
});

describe('syncPod', () => {
  it('sends POST with sync data', async () => {
    const syncResult = {
      syncedEntities: 5,
      lastSyncedAt: '2026-02-21T10:05:00Z',
      errors: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(syncResult),
    });

    const data = {
      engagement: { totalXP: 100, level: 2, streak: 1, title: 'Entdecker' },
      journeyProgress: {},
    };
    const result = await syncPod(data);
    expect(result).toEqual(syncResult);
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/pod/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });
});

describe('getPodData', () => {
  it('returns data when available', async () => {
    const data = {
      profile: { state: '@prefix fs: ...' },
      journey: { 'vuca-state': '@prefix fs: ...' },
      reflections: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await getPodData();
    expect(result).toEqual(data);
  });

  it('returns null on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));

    const result = await getPodData();
    expect(result).toBeNull();
  });
});
