import { describe, it, expect } from 'vitest';
import type {
  PodConnectionState,
  PodSyncResult,
  PodConnectRequest,
  PodSyncRequest,
  PodPermission,
  PodData,
} from '../types/pod';
import { DEFAULT_POD_PERMISSIONS } from '../types/pod';

describe('Pod types', () => {
  it('PodConnectionState has required fields', () => {
    const state: PodConnectionState = {
      connected: false,
      podUrl: '',
      webId: '',
      provider: 'none',
      connectedAt: null,
      lastSyncedAt: null,
      syncStatus: 'none',
    };
    expect(state.connected).toBe(false);
    expect(state.provider).toBe('none');
  });

  it('PodSyncResult tracks errors', () => {
    const result: PodSyncResult = {
      syncedEntities: 3,
      lastSyncedAt: '2026-02-21T10:00:00Z',
      errors: ['engagement: pod offline'],
    };
    expect(result.syncedEntities).toBe(3);
    expect(result.errors).toHaveLength(1);
  });

  it('PodConnectRequest supports managed provider', () => {
    const req: PodConnectRequest = {
      provider: 'managed',
      podUrl: 'http://localhost:3000',
    };
    expect(req.provider).toBe('managed');
  });

  it('PodConnectRequest supports external provider', () => {
    const req: PodConnectRequest = {
      provider: 'external',
      podUrl: 'https://my-pod.example.com',
    };
    expect(req.provider).toBe('external');
  });

  it('PodSyncRequest includes engagement and journey', () => {
    const req: PodSyncRequest = {
      engagement: { totalXP: 500, level: 3, streak: 2, title: 'Entdecker' },
      journeyProgress: {
        vuca: {
          started: true,
          stationsCompleted: 2,
          dimensionScores: { volatility: 0.8, uncertainty: 0.6 },
        },
      },
    };
    expect(req.engagement?.totalXP).toBe(500);
    expect(req.journeyProgress?.vuca.stationsCompleted).toBe(2);
  });

  it('PodData contains profile and journey sections', () => {
    const data: PodData = {
      profile: { state: 'turtle data', 'skill-profile': 'turtle data' },
      journey: { 'vuca-state': 'turtle data' },
      reflections: [],
    };
    expect(data.profile?.state).toBe('turtle data');
    expect(data.journey?.['vuca-state']).toBe('turtle data');
  });
});

describe('DEFAULT_POD_PERMISSIONS', () => {
  it('has 5 categories', () => {
    expect(DEFAULT_POD_PERMISSIONS).toHaveLength(5);
  });

  it('all enabled by default', () => {
    expect(DEFAULT_POD_PERMISSIONS.every((p) => p.enabled)).toBe(true);
  });

  it('includes expected categories', () => {
    const categories = DEFAULT_POD_PERMISSIONS.map((p) => p.category);
    expect(categories).toContain('profile');
    expect(categories).toContain('interests');
    expect(categories).toContain('journey');
    expect(categories).toContain('reflections');
    expect(categories).toContain('engagement');
  });

  it('has German labels', () => {
    const labels = DEFAULT_POD_PERMISSIONS.map((p) => p.label);
    expect(labels).toContain('Profil-Daten');
    expect(labels).toContain('Interessen');
    expect(labels).toContain('Reise-Fortschritt');
  });

  it('PodPermission toggle works', () => {
    const perm: PodPermission = { ...DEFAULT_POD_PERMISSIONS[0] };
    expect(perm.enabled).toBe(true);
    perm.enabled = false;
    expect(perm.enabled).toBe(false);
  });
});
