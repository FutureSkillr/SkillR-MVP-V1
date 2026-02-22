// k6/scenarios/operator/ts-020-health-check.js
// Tests FR-068: Health Check & Availability Monitoring
//
// Validates that public and authenticated health endpoints respond correctly.
//
// Go backend API:
//   GET /api/health          → {status:"ok"}
//   GET /api/health/detailed?token=SECRET → {status, components:{...}, runtime:{...}}
//
// NOTE: When HEALTH_CHECK_TOKEN is not set (docker-compose default), the
// detailed endpoint always returns 401 because the handler checks:
//   if h.healthToken == "" || token != h.healthToken → 401

import { sleep } from 'k6';
import { check } from 'k6';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import { HEALTH_TOKEN, ROUTES, thresholds, PAGE_THINK, thinkTime } from '../../config.js';

export const options = {
  vus: 2,
  duration: '1m',
  thresholds: Object.assign({}, thresholds.health, thresholds.security),
};

export default function () {
  // ── Step 1: Basic health check ──────────────────────────────────────
  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'health');
  checkJSON(healthRes, 'health');
  checkFields(healthRes, ['status'], 'health');
  checkNoLeak(healthRes, 'health');

  sleep(thinkTime(PAGE_THINK));

  // ── Step 2: Detailed health without token ───────────────────────────
  // When HEALTH_CHECK_TOKEN is not set, the handler returns 401.
  // When HEALTH_CHECK_TOKEN is set but no token provided, also returns 401.
  // So without a valid token, expect 401.
  const detailedNoTokenRes = apiGet(ROUTES.healthDetailed);
  check(detailedNoTokenRes, {
    'detailed-no-token: returns 401 (token required)': (r) => r.status === 401,
  });
  checkNoLeak(detailedNoTokenRes, 'detailed-no-token');

  sleep(thinkTime(PAGE_THINK));

  // ── Step 3: Detailed health with valid HEALTH_TOKEN via query param ──
  if (HEALTH_TOKEN) {
    const detailedAuthRes = apiGet(ROUTES.healthDetailed + '?token=' + HEALTH_TOKEN);
    checkStatus(detailedAuthRes, 200, 'detailed-auth');
    checkJSON(detailedAuthRes, 'detailed-auth');
    checkFields(detailedAuthRes, ['status', 'components'], 'detailed-auth');
    checkNoLeak(detailedAuthRes, 'detailed-auth');
  } else {
    console.info('HEALTH_CHECK_TOKEN not set — skipping authenticated detailed health test');
  }

  sleep(thinkTime(PAGE_THINK));

  // ── Step 4: Verify no information leaks on invalid paths ────────────
  const notFoundRes = apiGet('/api/health/nonexistent');
  checkNoLeak(notFoundRes, 'not-found');
}
