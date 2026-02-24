/** Pod provider type — where the Pod is hosted. */
export type PodProvider = 'none' | 'managed' | 'external';

/** Data categories that can be synced to the Pod. */
export type PodDataCategory =
  | 'profile'
  | 'interests'
  | 'journey'
  | 'reflections'
  | 'engagement';

/** Per-category permission toggle. */
export interface PodPermission {
  category: PodDataCategory;
  label: string;
  enabled: boolean;
}

/** Connection state persisted in backend. */
export interface PodConnectionState {
  connected: boolean;
  podUrl: string;
  webId: string;
  provider: PodProvider;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  syncStatus: string;
}

/** Result from a sync operation. */
export interface PodSyncResult {
  syncedEntities: number;
  lastSyncedAt: string;
  errors: string[];
}

/** Request payload for connecting a Pod. */
export interface PodConnectRequest {
  provider: PodProvider;
  podUrl?: string;
  /** CSS account email (external pods only). */
  email?: string;
  /** CSS account password (external pods only, not stored). */
  password?: string;
}

/** Request payload for syncing data. */
export interface PodSyncRequest {
  engagement?: {
    totalXP: number;
    level: number;
    streak: number;
    title: string;
  };
  journeyProgress?: Record<string, {
    started: boolean;
    stationsCompleted: number;
    dimensionScores: Record<string, number>;
  }>;
}

/** Pod data returned from the data endpoint. */
export interface PodData {
  profile?: Record<string, string>;
  journey?: Record<string, string>;
  reflections?: Record<string, string>[];
}

/** Modal step in the connect flow. */
export type PodModalStep =
  | 'explain'
  | 'provider'
  | 'auth'
  | 'permissions'
  | 'sync';

/** Default permissions — all enabled. */
export const DEFAULT_POD_PERMISSIONS: PodPermission[] = [
  { category: 'profile', label: 'Profil-Daten', enabled: true },
  { category: 'interests', label: 'Interessen', enabled: true },
  { category: 'journey', label: 'Reise-Fortschritt', enabled: true },
  { category: 'reflections', label: 'Stationsergebnisse', enabled: true },
  { category: 'engagement', label: 'Coach-Einstellungen', enabled: true },
];
