// k6/scenarios/student/ts-003-registration.js
// Tests FR-054, FR-056, FR-001: Registration after intro
//
// Simulates a student who has completed the intro chat and now registers,
// then verifies the credentials work by logging in. The Go backend's
// register endpoint does NOT return a token — a separate login call is
// required afterward.
//
// NOTE: The Go backend has no session tokens and no /api/v1/portfolio/*
// routes. We verify the login token is valid instead.

import { sleep, check } from 'k6';
import {
  checkStatus,
  checkJSON,
  checkNoLeak,
} from '../../helpers/checks.js';
import { registerAndLogin } from '../../helpers/auth.js';
import { uniqueEmail } from '../../helpers/data.js';
import { thresholds, PAGE_THINK, thinkTime } from '../../config.js';

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: Object.assign({}, thresholds.auth, thresholds.security),
};

export default function () {
  // User arrives from intro (simulate brief pause)
  sleep(thinkTime(PAGE_THINK));

  // -- Step 1: Register + login a new student user ------------------------
  const email = uniqueEmail('student');
  const displayName = 'Test Student';
  const password = 'TestPass123!';

  const result = registerAndLogin(email, displayName, password);

  // Verify registration succeeded
  check(result.regResponse, {
    'register status ok': (r) => r.status === 200 || r.status === 201,
  });
  checkJSON(result.regResponse, 'register');
  checkNoLeak(result.regResponse, 'register');

  sleep(thinkTime(PAGE_THINK));

  // -- Step 2: Verify login succeeded and returned a token ----------------
  check(result.loginResponse, {
    'login status ok': (r) => r !== null && r.status === 200,
  });
  if (result.loginResponse) {
    checkStatus(result.loginResponse, 200, 'login');
    checkJSON(result.loginResponse, 'login');
    checkNoLeak(result.loginResponse, 'login');
  }

  check(result, {
    'login returns non-empty token': (r) => r.token && r.token.length > 0,
  });
}
