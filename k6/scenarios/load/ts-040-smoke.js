// k6/scenarios/load/ts-040-smoke.js
// Tests FR-068, FR-054: Baseline smoke test
//
// Minimal 1-VU smoke test that validates the entire stack is alive.
// Sequentially hits the public endpoints (health, config, health) and verifies
// each returns 200 with valid JSON. This is the fastest possible validation
// that the deployment is operational.
//
// Go backend API:
//   GET /api/health → {status:"ok"}
//   GET /api/config → {firebase:{apiKey,...}}
//   NOTE: /api/capacity does not exist in the Go backend.

import { sleep, check } from 'k6';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import { ROUTES, thresholds } from '../../config.js';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: Object.assign(
    {},
    thresholds.health,
    { 'http_req_failed': ['rate<0.01'] },
  ),
};

export default function () {
  // -- Step 1: Health check -------------------------------------------------
  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'health');
  checkJSON(healthRes, 'health');
  checkFields(healthRes, ['status'], 'health');
  checkNoLeak(healthRes, 'health');

  sleep(1);

  // -- Step 2: Config endpoint (returns firebase config) --------------------
  const configRes = apiGet(ROUTES.config);
  checkStatus(configRes, 200, 'config');
  checkJSON(configRes, 'config');
  checkNoLeak(configRes, 'config');

  check(configRes, {
    'config: has firebase field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.firebase !== undefined && body.firebase !== null;
      } catch (_) {
        return false;
      }
    },
  });

  sleep(1);

  // -- Step 3: Health check again (connectivity round-trip) -----------------
  const healthRes2 = apiGet(ROUTES.health);
  checkStatus(healthRes2, 200, 'health-2');
  checkJSON(healthRes2, 'health-2');
  checkNoLeak(healthRes2, 'health-2');

  sleep(1);
}
