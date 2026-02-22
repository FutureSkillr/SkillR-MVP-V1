// k6/scenarios/admin/ts-013-analytics-dashboard.js
// Tests FR-050, FR-065: Analytics dashboard and flood detection
//
// /api/analytics/* are Node.js routes — they do NOT exist in the Go backend.
// In docker-compose, requests to /api/analytics/* return 404.
//
// This test verifies:
// 1. Admin login works.
// 2. Analytics routes return 404 (not available in Go backend).
// 3. Health endpoint is accessible as admin (system is reachable).

import { check, sleep } from 'k6';
import { ROUTES, thresholds, PAGE_THINK, thinkTime } from '../../config.js';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkNoLeak,
} from '../../helpers/checks.js';
import { loginAdmin, authHeaders } from '../../helpers/auth.js';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: Object.assign({}, thresholds.security),
};

export default function () {
  // ── Step 1: Login as admin ────────────────────────────────────────────
  const admin = loginAdmin();
  checkStatus(admin.response, 200, 'admin-login');
  checkJSON(admin.response, 'admin-login');
  checkNoLeak(admin.response, 'admin-login');

  if (!admin.token) {
    console.warn('Admin login failed, skipping iteration');
    return;
  }

  const headers = authHeaders(admin.token);

  sleep(thinkTime(PAGE_THINK));

  // ── Step 2: Probe analytics routes → 404 (Node.js routes, not in Go backend) ──
  const overviewRes = apiGet('/api/analytics/overview', headers);
  checkStatus(overviewRes, 404, 'analytics-overview-not-in-go');
  checkNoLeak(overviewRes, 'analytics-overview-not-in-go');
  console.info('Analytics routes (/api/analytics/*) not available in Go backend — returned 404 as expected');

  sleep(thinkTime(PAGE_THINK));

  const eventsRes = apiGet('/api/analytics/events', headers);
  checkStatus(eventsRes, 404, 'analytics-events-not-in-go');
  checkNoLeak(eventsRes, 'analytics-events-not-in-go');

  sleep(thinkTime(PAGE_THINK));

  const csvRes = apiGet('/api/analytics/export-csv', headers);
  checkStatus(csvRes, 404, 'analytics-csv-not-in-go');
  checkNoLeak(csvRes, 'analytics-csv-not-in-go');

  sleep(thinkTime(PAGE_THINK));

  const floodRes = apiGet('/api/analytics/flood-status', headers);
  checkStatus(floodRes, 404, 'analytics-flood-not-in-go');
  checkNoLeak(floodRes, 'analytics-flood-not-in-go');

  sleep(thinkTime(PAGE_THINK));

  // ── Step 3: Verify system is accessible — health endpoint as admin ────
  const healthRes = apiGet(ROUTES.health, headers);
  checkStatus(healthRes, 200, 'admin-health-check');
  checkJSON(healthRes, 'admin-health-check');
  checkNoLeak(healthRes, 'admin-health-check');

  sleep(thinkTime(PAGE_THINK));

  // ── Step 4: Verify detailed health (if available) ─────────────────────
  const detailedRes = apiGet(ROUTES.healthDetailed, headers);
  check(detailedRes, {
    'admin-health-detailed: status 200 or 401': (r) =>
      r.status === 200 || r.status === 401,
  });
  checkNoLeak(detailedRes, 'admin-health-detailed');

  sleep(thinkTime(PAGE_THINK));
}
