import { getAuthHeaders } from './auth';
import type { PromptLogEntry, PromptLogSession, PromptLogStats } from '../types/promptlog';

export async function getDB(): Promise<void> {
  // No-op: database lives on the dev server now
}

/** Returns true when a Bearer token is available for authenticated requests. */
function hasAuthToken(): boolean {
  return !!localStorage.getItem('skillr-token');
}

export async function insertSession(session: PromptLogSession): Promise<void> {
  if (!hasAuthToken()) return; // Skip when unauthenticated (intro flow)
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(session),
    });
  } catch {
    // Non-critical logging — swallow silently
  }
}

export async function endSession(sessionId: string): Promise<void> {
  if (!hasAuthToken()) return;
  try {
    await fetch(`/api/sessions/${sessionId}/end`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  } catch {
    // Non-critical logging — swallow silently
  }
}

export async function insertPromptLog(entry: PromptLogEntry): Promise<void> {
  if (!hasAuthToken()) return;
  try {
    await fetch('/api/prompt-logs', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(entry),
    });
  } catch {
    // Non-critical logging — swallow silently
  }
}

export async function getPromptLogs(filters?: {
  method?: string;
  status?: string;
  sessionId?: string;
}): Promise<PromptLogEntry[]> {
  const params = new URLSearchParams();
  if (filters?.method) params.set('method', filters.method);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.sessionId) params.set('sessionId', filters.sessionId);

  const qs = params.toString();
  const res = await fetch(`/api/prompt-logs${qs ? `?${qs}` : ''}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function getSessions(): Promise<PromptLogSession[]> {
  const res = await fetch('/api/sessions', { headers: getAuthHeaders() });
  return res.json();
}

export async function getStats(): Promise<PromptLogStats> {
  const res = await fetch('/api/prompt-logs/stats', { headers: getAuthHeaders() });
  return res.json();
}

export async function clearAll(): Promise<void> {
  await fetch('/api/prompt-logs', { method: 'DELETE', headers: getAuthHeaders() });
}

export async function exportCSV(): Promise<string> {
  const res = await fetch('/api/prompt-logs/export-csv', { headers: getAuthHeaders() });
  return res.text();
}
