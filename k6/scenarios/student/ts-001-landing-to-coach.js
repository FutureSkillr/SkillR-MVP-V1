// k6/scenarios/student/ts-001-landing-to-coach.js
// Tests FR-054, FR-062, FR-068: Landing page -> coach selection flow
//
// Simulates a new visitor arriving at the landing page, verifying the backend
// is alive via /api/health, fetching client config from /api/config, and then
// re-checking health before selecting a coach.
//
// NOTE: The Go backend has no /api/capacity endpoint and no session tokens.

import { sleep } from 'k6';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import { ROUTES, thresholds, PAGE_THINK, thinkTime } from '../../config.js';

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: Object.assign(
    {},
    thresholds.health,
    thresholds.config,
    thresholds.security,
  ),
};

export default function () {
  // -- Step 1: Health check (page loads, backend alive) -------------------
  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'health');
  checkJSON(healthRes, 'health');
  checkFields(healthRes, ['status'], 'health');
  checkNoLeak(healthRes, 'health');

  // User reads the landing page
  sleep(thinkTime(PAGE_THINK));

  // -- Step 2: Fetch client config from /api/config -----------------------
  const configRes = apiGet(ROUTES.config);
  checkStatus(configRes, 200, 'config');
  checkJSON(configRes, 'config');
  checkNoLeak(configRes, 'config');

  // -- Step 3: Health re-check (simulates background keep-alive) ----------
  const healthRes2 = apiGet(ROUTES.health);
  checkStatus(healthRes2, 200, 'health');
  checkJSON(healthRes2, 'health');
  checkNoLeak(healthRes2, 'health');

  // User browses coaches and selects one
  sleep(thinkTime(PAGE_THINK));
}
