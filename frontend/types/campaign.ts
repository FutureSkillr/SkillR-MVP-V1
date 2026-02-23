export interface Campaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok' | 'other';
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
  meta_pixel_id?: string;
  budget_cents?: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  notes?: string;
  created_at: number;
  updated_at: number;
  created_by?: string;
}

export interface CampaignStats {
  visitors: number;
  registrations: number;
  funnel: { label: string; count: number }[];
  costPerVisitor: string | null;
  costPerRegistration: string | null;
}
