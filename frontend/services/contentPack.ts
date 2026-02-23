import type { LernreiseDefinition } from '../types/journey';
import { DEFAULT_LERNREISEN } from '../constants/lernreisen';
import { getAuthHeaders } from './auth';

let cachedLernreisen: LernreiseDefinition[] | null = null;

/** Fetch the Lernreise content pack from the backend API, falling back to hardcoded defaults.
 *  Optional brandSlug returns brand-aware results (defaults + brand-activated packs). */
export async function fetchContentPack(brandSlug?: string): Promise<LernreiseDefinition[]> {
  if (cachedLernreisen) return cachedLernreisen;
  try {
    const url = brandSlug
      ? `/api/v1/content-pack?brand=${encodeURIComponent(brandSlug)}`
      : '/api/v1/content-pack';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const result: LernreiseDefinition[] = data.lernreisen ?? [];
      cachedLernreisen = result;
      return result;
    }
  } catch {
    /* fallback to defaults */
  }
  cachedLernreisen = DEFAULT_LERNREISEN;
  return DEFAULT_LERNREISEN;
}

/** Content pack metadata with brand activation status. */
export interface BrandContentPack {
  id: string;
  name: string;
  description: string;
  sponsor: string;
  defaultEnabled: boolean;
  brandActive: boolean;
  createdAt: string;
}

/** Fetch all content packs with their activation status for a brand. */
export async function fetchBrandContentPacks(brandSlug: string): Promise<BrandContentPack[]> {
  try {
    const res = await fetch(`/api/brand/${encodeURIComponent(brandSlug)}/content-packs`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
  } catch { /* ignore */ }
  return [];
}

/** Toggle a content pack active/inactive for a brand. */
export async function toggleBrandContentPack(
  brandSlug: string,
  packId: string,
  active: boolean,
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/brand/${encodeURIComponent(brandSlug)}/content-packs/${encodeURIComponent(packId)}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// --- Admin CRUD (FR-124) ---

/** Content pack with Lernreise count for admin listing. */
export interface AdminContentPack {
  id: string;
  name: string;
  description: string;
  sponsor: string;
  defaultEnabled: boolean;
  createdAt: string;
  lernreisenCount: number;
}

/** Lernreise within a content pack. */
export interface AdminLernreise {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  journeyType: string;
  location: string;
  lat: number;
  lng: number;
  setting: string;
  characterName: string;
  characterDesc: string;
  dimensions: string[];
  sortOrder: number;
  packId: string;
  createdAt: string;
}

/** List all content packs (admin). */
export async function adminListPacks(): Promise<AdminContentPack[]> {
  try {
    const res = await fetch('/api/admin/content-packs', { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch { /* ignore */ }
  return [];
}

/** Create a new content pack (admin). */
export async function adminCreatePack(pack: Partial<AdminContentPack>): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/content-packs', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(pack),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Update a content pack (admin). */
export async function adminUpdatePack(id: string, pack: Partial<AdminContentPack>): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/content-packs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(pack),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Delete a content pack (admin). */
export async function adminDeletePack(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/content-packs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** List Lernreisen in a pack (admin). */
export async function adminListPackLernreisen(packId: string): Promise<AdminLernreise[]> {
  try {
    const res = await fetch(`/api/admin/content-packs/${encodeURIComponent(packId)}/lernreisen`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
  } catch { /* ignore */ }
  return [];
}

/** Create a Lernreise in a pack (admin). */
export async function adminCreateLernreise(packId: string, lr: Partial<AdminLernreise>): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/content-packs/${encodeURIComponent(packId)}/lernreisen`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(lr),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Update a Lernreise (admin). */
export async function adminUpdateLernreise(packId: string, lrId: string, lr: Partial<AdminLernreise>): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/admin/content-packs/${encodeURIComponent(packId)}/lernreisen/${encodeURIComponent(lrId)}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(lr),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Delete a Lernreise (admin). */
export async function adminDeleteLernreise(packId: string, lrId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/admin/content-packs/${encodeURIComponent(packId)}/lernreisen/${encodeURIComponent(lrId)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Reorder Lernreisen in a pack (admin). */
export async function adminReorderLernreisen(packId: string, orderedIds: string[]): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/admin/content-packs/${encodeURIComponent(packId)}/lernreisen/order`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderedIds }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}
