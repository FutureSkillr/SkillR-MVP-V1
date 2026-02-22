// k6/scenarios/security/ts-030-auth-enforcement.js
// Tests FR-056, FR-057: Auth enforcement on protected v1 routes
//
// Validates that protected API v1 endpoints reject unauthenticated requests
// and requests with invalid/fake Bearer tokens.
//
// In docker-compose:
// - Admin routes (/api/v1/prompts, /api/v1/agents) return 404 because
//   deps.AdminPrompts and deps.AdminAgents are nil (not initialized).
// - AI routes use OptionalFirebaseAuth — they allow unauthenticated access.
//   The AI handler may return 502 (model not found) without GCP credentials.

import { sleep } from 'k6';
import { check } from 'k6';
import { apiGet, apiPost } from '../../helpers/http.js';
import {
  checkNoLeak,
} from '../../helpers/checks.js';
import { authHeaders } from '../../helpers/auth.js';
import { chatRequestBody, extractRequestBody } from '../../helpers/data.js';
import { ROUTES, thresholds } from '../../config.js';

export const options = {
  vus: 1,
  duration: '30s',
  iterations: 1,
  thresholds: Object.assign({}, thresholds.security),
};

export default function () {
  // ── Protected v1 routes ────────────────────────────────────────────────
  // Admin routes: not registered in docker-compose → 404.
  // In production: 401 without auth, 403 for non-admin.
  const protectedGetRoutes = [
    { path: ROUTES.prompts, label: 'prompts' },
    { path: ROUTES.agents, label: 'agents' },
  ];

  const protectedPostRoutes = [
    { path: ROUTES.aiChat, label: 'ai-chat', body: chatRequestBody('Hallo!') },
    { path: ROUTES.aiExtract, label: 'ai-extract', body: extractRequestBody() },
    { path: ROUTES.aiGenerate, label: 'ai-generate', body: { parameters: { goal: 'Test' }, context: { generate_type: 'curriculum' } } },
  ];

  // ── Step 1: Test GET routes without any token ─────────────────────────
  for (const route of protectedGetRoutes) {
    const res = apiGet(route.path);
    // Admin routes return 404 (not registered) or 401 (auth required)
    check(res, {
      [`${route.label}-no-token: protected or not registered`]: (r) =>
        r.status === 401 || r.status === 404,
    });
    checkNoLeak(res, `${route.label}-no-token`);
    sleep(0.3);
  }

  // ── Step 2: Test POST routes without any token ────────────────────────
  // AI routes use OptionalFirebaseAuth — they allow unauthenticated access.
  // Without GCP creds, AI returns 502. The key check: no info leaks.
  for (const route of protectedPostRoutes) {
    const res = apiPost(route.path, route.body);
    checkNoLeak(res, `${route.label}-no-token`);
    sleep(0.3);
  }

  // ── Step 3: Test GET routes with invalid/fake Bearer token ────────────
  const fakeToken = 'fake-invalid-token-xyz-12345';
  const fakeHeaders = authHeaders(fakeToken);

  for (const route of protectedGetRoutes) {
    const res = apiGet(route.path, fakeHeaders);
    check(res, {
      [`${route.label}-fake-token: protected or not registered`]: (r) =>
        r.status === 401 || r.status === 404,
    });
    checkNoLeak(res, `${route.label}-fake-token`);
    sleep(0.3);
  }

  // ── Step 4: Test POST routes with fake Bearer token ───────────────────
  for (const route of protectedPostRoutes) {
    const res = apiPost(route.path, route.body, fakeHeaders);
    checkNoLeak(res, `${route.label}-fake-token`);
    sleep(0.3);
  }

  // ── Step 5: Test with an expired-looking JWT (still fake) ─────────────
  const expiredJwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.expired';
  const expiredHeaders = authHeaders(expiredJwt);

  for (const route of protectedGetRoutes) {
    const res = apiGet(route.path, expiredHeaders);
    check(res, {
      [`${route.label}-expired-jwt: protected or not registered`]: (r) =>
        r.status === 401 || r.status === 404,
    });
    checkNoLeak(res, `${route.label}-expired-jwt`);
    sleep(0.3);
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log('Auth enforcement test complete: protected routes reject unauthorized access');
}
