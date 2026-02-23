import type { Campaign, CampaignStats } from '../types/campaign';
import { getAuthHeaders } from './auth';

export async function listCampaigns(): Promise<Campaign[]> {
  const res = await fetch('/api/campaigns', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load campaigns');
  return res.json();
}

export async function createCampaign(data: Partial<Campaign>): Promise<{ id: string }> {
  const res = await fetch('/api/campaigns', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Failed to create campaign');
  }
  return res.json();
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<void> {
  const res = await fetch(`/api/campaigns/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Failed to update campaign');
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  const res = await fetch(`/api/campaigns/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Failed to archive campaign');
  }
}

export async function getCampaignStats(id: string): Promise<CampaignStats> {
  const res = await fetch(`/api/campaigns/${id}/stats`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load campaign stats');
  return res.json();
}
