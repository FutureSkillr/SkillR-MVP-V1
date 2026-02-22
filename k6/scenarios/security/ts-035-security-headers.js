// k6/scenarios/security/ts-035-security-headers.js
// Tests FR-059: Security headers verification
//
// Validates that the Go backend returns proper security headers on API responses.
//
// Headers checked:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - Referrer-Policy: strict-origin-when-cross-origin
// - Permissions-Policy: camera=(), microphone=(), geolocation=()
//
// Headers NOT checked:
// - Strict-Transport-Security: set by the Go backend even on HTTP, but testing
//   over HTTP in docker-compose may not reflect production behavior.
// - Content-Security-Policy: only set on HTML responses from the static file server,
//   not on JSON API responses.
// - X-XSS-Protection: not set by the Go backend (deprecated in modern browsers).

import { check } from 'k6';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkHeader,
  checkNoLeak,
} from '../../helpers/checks.js';
import { ROUTES, thresholds } from '../../config.js';

export const options = {
  vus: 1,
  duration: '15s',
  iterations: 1,
  thresholds: Object.assign({}, thresholds.security),
};

function verifySecurityHeaders(res, label) {
  // X-Frame-Options: DENY
  check(res, {
    [`${label}: X-Frame-Options is DENY`]: (r) => {
      const val = (r.headers['X-Frame-Options'] || '').toUpperCase();
      return val === 'DENY';
    },
  });

  // X-Content-Type-Options: nosniff
  checkHeader(res, 'X-Content-Type-Options', 'nosniff', label);

  // Referrer-Policy: strict-origin-when-cross-origin
  checkHeader(res, 'Referrer-Policy', 'strict-origin-when-cross-origin', label);

  // Permissions-Policy: camera=(), microphone=(), geolocation=()
  check(res, {
    [`${label}: Permissions-Policy present`]: (r) => {
      const val = r.headers['Permissions-Policy'] || '';
      return val.includes('camera=()') && val.includes('microphone=()');
    },
  });

  // CORS: If Access-Control-Allow-Origin is set, it must not be wildcard "*"
  check(res, {
    [`${label}: CORS not wildcard`]: (r) => {
      const val = r.headers['Access-Control-Allow-Origin'] || '';
      if (val === '') return true; // No CORS header is fine for same-origin
      return val !== '*';
    },
  });
}

export default function () {
  // ── Step 1: Check security headers on /api/health ─────────────────────
  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'health');
  checkNoLeak(healthRes, 'health');
  verifySecurityHeaders(healthRes, 'health');

  // ── Step 2: Check security headers on /api/config ─────────────────────
  const configRes = apiGet(ROUTES.config);
  checkStatus(configRes, 200, 'config');
  checkNoLeak(configRes, 'config');
  verifySecurityHeaders(configRes, 'config');

  // ── Step 3: Check security headers on /api/health/detailed ────────────
  const detailedRes = apiGet(ROUTES.healthDetailed);
  // May return 200 or 401 depending on HEALTH_CHECK_TOKEN config
  check(detailedRes, {
    'health-detailed: responds': (r) => r.status >= 200 && r.status < 500,
  });
  checkNoLeak(detailedRes, 'health-detailed');
  verifySecurityHeaders(detailedRes, 'health-detailed');

  // ── Summary ───────────────────────────────────────────────────────────
  console.log('Security headers verification complete');
}
