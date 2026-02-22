import type { PromptLogEntry, PromptLogSession, PromptLogStats } from '../types/promptlog';

export async function getDB(): Promise<void> {
  // No-op: database lives on the dev server now
}

export async function insertSession(session: PromptLogSession): Promise<void> {
  await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
}

export async function endSession(sessionId: string): Promise<void> {
  await fetch(`/api/sessions/${sessionId}/end`, { method: 'PATCH' });
}

export async function insertPromptLog(entry: PromptLogEntry): Promise<void> {
  await fetch('/api/prompt-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
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
  const res = await fetch(`/api/prompt-logs${qs ? `?${qs}` : ''}`);
  return res.json();
}

export async function getSessions(): Promise<PromptLogSession[]> {
  const res = await fetch('/api/sessions');
  return res.json();
}

export async function getStats(): Promise<PromptLogStats> {
  const res = await fetch('/api/prompt-logs/stats');
  return res.json();
}

export async function clearAll(): Promise<void> {
  await fetch('/api/prompt-logs', { method: 'DELETE' });
}

export async function exportCSV(): Promise<string> {
  const res = await fetch('/api/prompt-logs/export-csv');
  return res.text();
}
