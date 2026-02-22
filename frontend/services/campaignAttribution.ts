/**
 * Campaign Attribution — FR-064
 * Captures UTM parameters and click IDs from URL on first visit,
 * stores them in sessionStorage for attachment to all analytics events.
 */

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
}

const UTM_KEYS: (keyof UTMParams)[] = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'gclid',
];

const STORAGE_KEY = 'utm_params';

/**
 * Capture UTM parameters from the current URL and store in sessionStorage.
 * Only captures on first call per session (no overwrite).
 */
export function captureUTM(): UTMParams {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) return JSON.parse(existing);
  } catch { /* ignore */ }

  const params: UTMParams = {};
  try {
    const url = new URL(window.location.href);
    for (const key of UTM_KEYS) {
      const val = url.searchParams.get(key);
      if (val) {
        params[key] = val;
      }
    }

    if (Object.keys(params).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    }
  } catch { /* SSR or invalid URL */ }

  return params;
}

/**
 * Retrieve stored UTM parameters (if any).
 */
export function getStoredUTM(): UTMParams {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

/**
 * Check if this visitor arrived via a campaign.
 */
export function hasCampaignAttribution(): boolean {
  const utm = getStoredUTM();
  return Object.keys(utm).length > 0;
}
