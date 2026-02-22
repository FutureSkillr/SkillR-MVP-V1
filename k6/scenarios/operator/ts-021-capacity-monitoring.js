// k6/scenarios/operator/ts-021-capacity-monitoring.js
// Tests FR-062 (adapted): Public endpoint availability monitoring
//
// ADAPTED FOR GO BACKEND: The /api/capacity endpoint does not exist in the
// Go backend (it was Node.js-only). This scenario instead validates the
// nearest public endpoints — /api/config and /api/health — to confirm the
// system is reachable and returning correct data under concurrent load.
//
// Go backend API:
//   GET /api/config → {firebase:{apiKey,...}}
//   GET /api/health → {status:"ok"}

import { check, sleep } from 'k6';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import { ROUTES, thresholds, PAGE_THINK, thinkTime } from '../../config.js';

export const options = {
  vus: 5,
  duration: '2m',
  thresholds: Object.assign({}, thresholds.config, thresholds.health, thresholds.security),
};

export default function () {
  // ── Step 1: GET /api/config ───────────────────────────────────────
  const configRes = apiGet(ROUTES.config);
  checkStatus(configRes, 200, 'config');
  checkJSON(configRes, 'config');
  checkFields(configRes, ['firebase'], 'config');
  checkNoLeak(configRes, 'config');

  // Verify firebase config has expected sub-fields
  const body = safeParseJSON(configRes.body);
  if (body && body.firebase) {
    check(body.firebase, {
      'config: firebase has apiKey': (fb) => fb.apiKey !== undefined,
      'config: firebase has projectId': (fb) => fb.projectId !== undefined,
    });
  }

  sleep(thinkTime(PAGE_THINK));

  // ── Step 2: GET /api/health ───────────────────────────────────────
  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'health');
  checkJSON(healthRes, 'health');
  checkFields(healthRes, ['status'], 'health');
  checkNoLeak(healthRes, 'health');

  sleep(thinkTime(PAGE_THINK));
}

function safeParseJSON(body) {
  try {
    return JSON.parse(body);
  } catch (_) {
    return null;
  }
}
