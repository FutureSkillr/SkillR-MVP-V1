/**
 * Cookie Consent Service — FR-066
 * Manages DSGVO consent state in localStorage.
 */

export type ConsentLevel = 'all' | 'necessary' | 'undecided';

const STORAGE_KEY = 'cookie_consent';

/**
 * Get the current consent level.
 */
export function getConsentLevel(): ConsentLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'all' || stored === 'necessary') return stored;
  } catch { /* ignore */ }
  return 'undecided';
}

/**
 * Set the consent level.
 * DSGVO Art. 7: Also logs consent server-side for audit trail.
 */
export function setConsentLevel(level: 'all' | 'necessary'): void {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch { /* ignore */ }

  // DSGVO Art. 7: Send consent to server for audit log
  try {
    const browserSessionId = sessionStorage.getItem('browser_session_id') || 'unknown';
    navigator.sendBeacon(
      '/api/analytics/consent',
      new Blob(
        [JSON.stringify({ level, browserSessionId, timestamp: Date.now() })],
        { type: 'application/json' },
      ),
    );
  } catch { /* ignore — consent still saved locally */ }
}

/**
 * Revoke consent (reset to undecided).
 */
export function revokeConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

/**
 * Check if marketing/analytics consent is granted.
 */
export function hasMarketingConsent(): boolean {
  return getConsentLevel() === 'all';
}

/**
 * Check if the user has made a consent decision.
 */
export function hasConsentDecision(): boolean {
  return getConsentLevel() !== 'undecided';
}
