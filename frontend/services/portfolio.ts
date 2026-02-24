import type { PortfolioEntry, PublicPortfolio } from '../types/portfolio';
import { getAuthHeaders } from './auth';

const API_BASE = '/api/v1/portfolio';

/** List all portfolio entries for the authenticated user. */
export async function listPortfolioEntries(): Promise<PortfolioEntry[]> {
  console.debug('[Portfolio] listPortfolioEntries');
  try {
    const res = await fetch(`${API_BASE}/entries`, { headers: getAuthHeaders() });
    if (!res.ok) {
      console.warn('[Portfolio] listPortfolioEntries: HTTP %d', res.status);
      return [];
    }
    const data = await res.json();
    return data.entries ?? [];
  } catch (e) {
    console.warn('[Portfolio] listPortfolioEntries: error', e);
    return [];
  }
}

/** Create a new portfolio entry. */
export async function createPortfolioEntry(
  entry: Omit<PortfolioEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): Promise<PortfolioEntry> {
  console.debug('[Portfolio] createPortfolioEntry:', entry.title);
  const res = await fetch(`${API_BASE}/entries`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Eintrag konnte nicht erstellt werden.');
  }
  return res.json();
}

/** Update an existing portfolio entry. */
export async function updatePortfolioEntry(
  id: string,
  entry: Partial<PortfolioEntry>,
): Promise<PortfolioEntry> {
  console.debug('[Portfolio] updatePortfolioEntry:', id);
  const res = await fetch(`${API_BASE}/entries/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Eintrag konnte nicht aktualisiert werden.');
  }
  return res.json();
}

/** Delete a portfolio entry. */
export async function deletePortfolioEntry(id: string): Promise<void> {
  console.debug('[Portfolio] deletePortfolioEntry:', id);
  const res = await fetch(`${API_BASE}/entries/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Eintrag konnte nicht geloescht werden.');
  }
}

/** Create 3 demo portfolio entries. */
export async function createDemoEntries(): Promise<{ created: number }> {
  console.debug('[Portfolio] createDemoEntries');
  const res = await fetch(`${API_BASE}/entries/demo`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Demo-Eintraege konnten nicht erstellt werden.');
  }
  return res.json();
}

/** Export portfolio as HTML or ZIP blob. */
export async function exportPortfolio(format: 'html' | 'zip'): Promise<Blob> {
  console.debug('[Portfolio] exportPortfolio:', format);
  const res = await fetch(`${API_BASE}/export?format=${format}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Export fehlgeschlagen.');
  }
  return res.blob();
}

/** Fetch the public portfolio for a given user ID. */
export async function fetchPublicPortfolio(userId: string): Promise<PublicPortfolio | null> {
  console.debug('[Portfolio] fetchPublicPortfolio:', userId);
  try {
    const res = await fetch(`${API_BASE}/page/${userId}`);
    if (!res.ok) {
      console.warn('[Portfolio] fetchPublicPortfolio: HTTP %d', res.status);
      return null;
    }
    return res.json();
  } catch (e) {
    console.warn('[Portfolio] fetchPublicPortfolio: error', e);
    return null;
  }
}
