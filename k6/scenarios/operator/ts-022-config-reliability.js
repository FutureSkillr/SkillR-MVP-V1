// k6/scenarios/operator/ts-022-config-reliability.js
// Tests FR-059 (Security Headers / CORS) and FR-054 (Intro Sequence / Config)
//
// Validates that the config endpoint returns Firebase configuration with the
// expected sub-fields, and that security headers are set correctly.
//
// Go backend API:
//   GET /api/config → {firebase:{apiKey, projectId, authDomain, ...}}
//   NOTE: No sessionToken field — the Go backend does not issue session tokens
//   via the config endpoint.

import { check, sleep } from 'k6';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkFields,
  checkHeader,
  checkNoLeak,
} from '../../helpers/checks.js';
import { ROUTES, thresholds, PAGE_THINK, thinkTime } from '../../config.js';

export const options = {
  vus: 3,
  duration: '1m',
  thresholds: Object.assign({}, thresholds.config, thresholds.security),
};

export default function () {
  // ── Step 1: GET /api/config ─────────────────────────────────────────
  const configRes = apiGet(ROUTES.config);
  checkStatus(configRes, 200, 'config');
  checkJSON(configRes, 'config');
  checkNoLeak(configRes, 'config');

  // ── Step 2: Verify Firebase config fields ───────────────────────────
  const body = safeParseJSON(configRes.body);
  if (body) {
    checkFields(configRes, ['firebase'], 'config');

    const fb = body.firebase || {};
    check(fb, {
      'config: firebase has apiKey': () => fb.apiKey !== undefined,
      'config: firebase has projectId': () => fb.projectId !== undefined,
      'config: firebase has authDomain': () => fb.authDomain !== undefined,
    });
  }

  sleep(thinkTime(PAGE_THINK));

  // ── Step 3: Check security headers ──────────────────────────────────
  checkHeader(
    configRes,
    'X-Content-Type-Options',
    'nosniff',
    'security'
  );
  checkHeader(
    configRes,
    'X-Frame-Options',
    'DENY',
    'security'
  );

  sleep(thinkTime(PAGE_THINK));
}

function safeParseJSON(body) {
  try {
    return JSON.parse(body);
  } catch (_) {
    return null;
  }
}
