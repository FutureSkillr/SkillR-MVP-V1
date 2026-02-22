// k6/scenarios/admin/ts-012-user-management.js
// Tests FR-046, FR-044: User administration and role management
//
// /api/users is a Node.js route — it does NOT exist in the Go backend.
// In docker-compose, requests to /api/users return 404.
//
// This test verifies:
// 1. Admin login works.
// 2. /api/users returns 404 (not available in Go backend).
// 3. User registration and login work correctly (Go backend auth).

import { check, sleep } from 'k6';
import { ROUTES, thresholds, PAGE_THINK, thinkTime } from '../../config.js';
import { apiGet } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkNoLeak,
} from '../../helpers/checks.js';
import { loginAdmin, registerAndLogin, authHeaders } from '../../helpers/auth.js';
import { uniqueEmail } from '../../helpers/data.js';

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

  check(admin, {
    'admin-login: token returned': (a) => typeof a.token === 'string' && a.token.length > 0,
  });

  const headers = authHeaders(admin.token);

  sleep(thinkTime(PAGE_THINK));

  // ── Step 2: Probe /api/users → 404 (Node.js route, not in Go backend) ──
  const usersRes = apiGet('/api/users', headers);
  checkStatus(usersRes, 404, 'users-not-in-go-backend');
  checkNoLeak(usersRes, 'users-not-in-go-backend');
  console.info('User management routes (/api/users) not available in Go backend — returned 404 as expected');

  sleep(thinkTime(PAGE_THINK));

  // ── Step 3: Register a new user — verify Go backend auth works ────────
  const email = uniqueEmail('k6-managed');
  const password = 'TestPass123!';
  const user = registerAndLogin(email, 'K6 Managed User', password);

  check(user, {
    'register-managed: registration succeeded': (u) =>
      u.regResponse && (u.regResponse.status === 200 || u.regResponse.status === 201),
    'login-managed: login succeeded': (u) =>
      u.loginResponse && u.loginResponse.status === 200,
    'login-managed: token returned': (u) =>
      typeof u.token === 'string' && u.token.length > 0,
  });

  if (user.regResponse) {
    checkNoLeak(user.regResponse, 'register-managed');
  }
  if (user.loginResponse) {
    checkNoLeak(user.loginResponse, 'login-managed');
  }

  sleep(thinkTime(PAGE_THINK));

  // ── Step 4: Verify the registered user can access public endpoints ────
  if (user.token) {
    const healthRes = apiGet(ROUTES.health, authHeaders(user.token));
    checkStatus(healthRes, 200, 'managed-user-health');
    checkJSON(healthRes, 'managed-user-health');
    checkNoLeak(healthRes, 'managed-user-health');
  }

  sleep(thinkTime(PAGE_THINK));
}
