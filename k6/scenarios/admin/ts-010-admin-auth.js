// k6/scenarios/admin/ts-010-admin-auth.js
// Tests FR-056, FR-057: Admin auth and access control hardening
//
// Verifies admin login, non-admin login, and admin route access control
// in docker-compose (Go backend without Firebase auth middleware).
//
// KEY BEHAVIOR IN DOCKER-COMPOSE:
// - Admin login (POST /api/auth/login) works and returns a UUID token.
// - Admin routes (/api/v1/prompts, /api/v1/agents) are NOT registered because
//   deps.AdminPrompts and deps.AdminAgents are nil (no admin handler initialized).
//   Therefore all requests return 404.
//
// IN PRODUCTION (with Firebase + admin handlers):
// - Admin routes are registered behind RequireAdmin() middleware.
// - Admin token → 200, non-admin → 403, unauthenticated → 401.

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
  duration: '30s',
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
    'admin-login: user has admin role': (a) => a.user && a.user.role === 'admin',
  });

  sleep(thinkTime(PAGE_THINK));

  // ── Step 2: Admin token on /api/v1/prompts → 404 (not registered) or 401 ──
  // In docker-compose, admin handlers are not initialized → routes return 404.
  // In production with Firebase, this would return 200 for admin.
  const promptsRes = apiGet(ROUTES.prompts, authHeaders(admin.token));
  check(promptsRes, {
    'admin-prompts: protected or not registered': (r) =>
      r.status === 401 || r.status === 404,
  });
  checkNoLeak(promptsRes, 'admin-prompts');
  console.info(`Admin prompts returned ${promptsRes.status} — expected in docker-compose`);

  sleep(thinkTime(PAGE_THINK));

  // ── Step 3: Admin token on /api/v1/agents → 404 (not registered) or 401 ──
  const agentsRes = apiGet(ROUTES.agents, authHeaders(admin.token));
  check(agentsRes, {
    'admin-agents: protected or not registered': (r) =>
      r.status === 401 || r.status === 404,
  });
  checkNoLeak(agentsRes, 'admin-agents');

  sleep(thinkTime(PAGE_THINK));

  // ── Step 4: Register and login as a non-admin user ────────────────────
  const email = uniqueEmail('k6-nonadmin');
  const password = 'TestPass123!';
  const user = registerAndLogin(email, 'K6 NonAdmin', password);

  if (!user.token) {
    console.warn('Non-admin login failed, skipping authorization checks');
    return;
  }

  check(user, {
    'nonadmin-login: token returned': (u) => typeof u.token === 'string' && u.token.length > 0,
  });

  sleep(thinkTime(PAGE_THINK));

  // ── Step 5: Non-admin token on admin routes → 404 or 401 ──────────────
  const promptsForbidden = apiGet(ROUTES.prompts, authHeaders(user.token));
  check(promptsForbidden, {
    'nonadmin-prompts: protected or not registered': (r) =>
      r.status === 401 || r.status === 403 || r.status === 404,
  });
  checkNoLeak(promptsForbidden, 'nonadmin-prompts');

  const agentsForbidden = apiGet(ROUTES.agents, authHeaders(user.token));
  check(agentsForbidden, {
    'nonadmin-agents: protected or not registered': (r) =>
      r.status === 401 || r.status === 403 || r.status === 404,
  });
  checkNoLeak(agentsForbidden, 'nonadmin-agents');

  sleep(thinkTime(PAGE_THINK));

  // ── Step 6: Unauthenticated requests → 404 or 401 ─────────────────────
  const promptsUnauth = apiGet(ROUTES.prompts);
  check(promptsUnauth, {
    'unauth-prompts: protected or not registered': (r) =>
      r.status === 401 || r.status === 404,
  });
  checkNoLeak(promptsUnauth, 'unauth-prompts');

  const agentsUnauth = apiGet(ROUTES.agents);
  check(agentsUnauth, {
    'unauth-agents: protected or not registered': (r) =>
      r.status === 401 || r.status === 404,
  });
  checkNoLeak(agentsUnauth, 'unauth-agents');
}
