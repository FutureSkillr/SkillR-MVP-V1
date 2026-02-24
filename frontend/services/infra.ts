import { getAuthHeaders } from './auth';
import type { InfraResponse } from '../types/infra';

export async function fetchInfraStatus(): Promise<InfraResponse> {
  const res = await fetch('/api/admin/infra', { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`Infra status request failed: ${res.status}`);
  }
  return res.json();
}
