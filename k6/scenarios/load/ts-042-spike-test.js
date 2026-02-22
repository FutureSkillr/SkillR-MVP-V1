// k6/scenarios/load/ts-042-spike-test.js
// Tests FR-060: Spike test with rapid VU increase
//
// Validates system behaviour under sudden load spikes. Ramps from 0 to 50
// concurrent VUs in 60 seconds, sustains peak for 2 minutes, then scales
// back down to observe recovery. Each VU iteration hits the health and
// config endpoints to verify the system remains responsive even under
// extreme load.
//
// Go backend API:
//   GET /api/health → {status:"ok"}
//   GET /api/config → {firebase:{apiKey,...}}
//   NOTE: /api/capacity does not exist in the Go backend; /api/config is
//   used as the second public endpoint for spike validation.
//
// Thresholds are intentionally more lenient than the smoke test to account
// for expected degradation during the spike phase.

import { sleep, check } from 'k6';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkNoLeak,
} from '../../helpers/checks.js';
import { ROUTES } from '../../config.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Stage 1: warm up
    { duration: '30s', target: 50 },   // Stage 2: spike
    { duration: '2m',  target: 50 },   // Stage 3: sustained peak
    { duration: '30s', target: 10 },   // Stage 4: scale down
    { duration: '1m',  target: 10 },   // Stage 5: recovery
    { duration: '30s', target: 0 },    // Stage 6: cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.15'],
    checks: ['rate>0.90'],
  },
};

export default function () {
  // -- Step 1: Health check -------------------------------------------------
  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'spike-health');
  checkJSON(healthRes, 'spike-health');
  checkNoLeak(healthRes, 'spike-health');

  // -- Step 2: Config check -------------------------------------------------
  // Verify the system still returns valid config under load
  const configRes = apiGet(ROUTES.config);
  checkStatus(configRes, 200, 'spike-config');
  checkJSON(configRes, 'spike-config');
  checkNoLeak(configRes, 'spike-config');

  check(configRes, {
    'spike-config: response has body': (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
