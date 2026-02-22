// k6/scenarios/student/ts-007-lernreise-flow.js
// Tests FR-074, FR-075: Lernreise catalog and progress
//
// Lernreise routes (/api/v1/lernreise/*) are only available when
// HONEYCOMB_URL + MEMORY_SERVICE_URL are configured. This scenario probes
// for availability and skips gracefully if the routes return 404.

import { sleep, check } from 'k6';
import { ROUTES, thresholds, PAGE_THINK, thinkTime } from '../../config.js';
import { apiGet, apiPost } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import { registerAndLogin, authHeaders, routeExists } from '../../helpers/auth.js';
import { uniqueEmail } from '../../helpers/data.js';

export const options = {
  vus: 2,
  duration: '2m',
  thresholds: Object.assign(
    {},
    thresholds.health,
    thresholds.auth,
    thresholds.security,
  ),
};

export default function () {
  // -- Step 1: Register + login new user ------------------------------------
  const email = uniqueEmail('k6-lernreise');
  const password = 'Test1234!';
  const { token } = registerAndLogin(email, 'K6 Lernreise Test', password);

  check(token, {
    'auth token obtained': (t) => t && t.length > 0,
  });

  const headers = authHeaders(token);

  sleep(thinkTime(PAGE_THINK));

  // -- Step 2: Probe lernreise routes ---------------------------------------
  const lernreiseAvailable = routeExists(ROUTES.lernreiseCatalog);

  if (!lernreiseAvailable) {
    console.warn('lernreise routes not available (HONEYCOMB_URL/MEMORY_SERVICE_URL not configured), skipping');

    // Verify auth + health still work as a basic sanity check
    const healthRes = apiGet(ROUTES.health);
    checkStatus(healthRes, 200, 'fallback-health');
    checkJSON(healthRes, 'fallback-health');
    checkFields(healthRes, ['status'], 'fallback-health');
    checkNoLeak(healthRes, 'fallback-health');

    return;
  }

  // -- Step 3: GET catalog --------------------------------------------------
  const catalogRes = apiGet(ROUTES.lernreiseCatalog, headers);
  checkStatus(catalogRes, 200, 'catalog');
  checkJSON(catalogRes, 'catalog');
  checkNoLeak(catalogRes, 'catalog');

  let catalog;
  try {
    catalog = JSON.parse(catalogRes.body);
  } catch (_) {
    catalog = null;
  }

  check(catalog, {
    'catalog: is array': (c) => Array.isArray(c),
  });

  // Pick the first catalog item's ID, or fall back to a known default
  let catalogId = 'digitale-welten';
  if (Array.isArray(catalog) && catalog.length > 0) {
    catalogId = catalog[0].dataId || catalog[0].id || catalogId;
  }

  sleep(thinkTime(PAGE_THINK));

  // -- Step 4: POST select lernreise ----------------------------------------
  const selectRes = apiPost(
    ROUTES.lernreiseSelect,
    { catalogId: catalogId },
    headers,
  );
  check(selectRes, {
    'select: status 200 or 201': (r) => r.status === 200 || r.status === 201,
  });
  checkJSON(selectRes, 'select');
  checkNoLeak(selectRes, 'select');

  sleep(thinkTime(PAGE_THINK));

  // -- Step 5: GET active lernreise -----------------------------------------
  const activeRes = apiGet(ROUTES.lernreiseActive, headers);
  checkStatus(activeRes, 200, 'active');
  checkJSON(activeRes, 'active');
  checkNoLeak(activeRes, 'active');

  let activeBody;
  try {
    activeBody = JSON.parse(activeRes.body);
  } catch (_) {
    activeBody = null;
  }

  const instanceId = activeBody
    ? activeBody.instanceId || activeBody.id || ''
    : '';

  check(activeBody, {
    'active: has instanceId': (b) => b && (b.instanceId || b.id),
  });

  if (!instanceId) {
    console.warn('lernreise: no instanceId found, skipping submit/progress');
    return;
  }

  sleep(thinkTime(PAGE_THINK));

  // -- Step 6: POST submit task ---------------------------------------------
  const submitRes = apiPost(
    `/api/v1/lernreise/instances/${instanceId}/submit`,
    { taskId: 'task-1', answer: 'Meine Antwort' },
    headers,
  );
  checkStatus(submitRes, 200, 'submit');
  checkJSON(submitRes, 'submit');
  checkNoLeak(submitRes, 'submit');

  sleep(thinkTime(PAGE_THINK));

  // -- Step 7: GET progress -------------------------------------------------
  const progressRes = apiGet(
    `/api/v1/lernreise/instances/${instanceId}/progress`,
    headers,
  );
  checkStatus(progressRes, 200, 'progress');
  checkJSON(progressRes, 'progress');
  checkNoLeak(progressRes, 'progress');
}
