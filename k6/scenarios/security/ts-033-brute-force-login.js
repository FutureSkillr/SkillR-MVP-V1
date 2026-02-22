// k6/scenarios/security/ts-033-brute-force-login.js
// Tests FR-060: Brute force login protection
//
// Validates that the login endpoint enforces rate limiting against brute-force
// password guessing. The Go backend tracks failed login attempts per IP and
// blocks after 5 failed attempts within a 15-minute window (returns 429).
//
// Registers a user with known credentials, then sends 6 login attempts with
// the wrong password and expects a 429 response on or before the 6th attempt.
// Uses uniqueEmail to avoid collision with other test runs.

import { sleep } from 'k6';
import { check } from 'k6';
import { apiPost } from '../../helpers/http.js';
import { checkNoLeak } from '../../helpers/checks.js';
import { registerUser } from '../../helpers/auth.js';
import { uniqueEmail } from '../../helpers/data.js';
import { ROUTES, thresholds } from '../../config.js';

export const options = {
  vus: 1,
  duration: '1m',
  iterations: 1,
  thresholds: Object.assign({}, thresholds.security),
};

export default function () {
  // ── Step 1: Register a user with known credentials ────────────────────
  const email = uniqueEmail('brute');
  const correctPassword = 'CorrectPass123!';
  const reg = registerUser(email, 'Brute Force Test', correctPassword);

  if (reg.response.status !== 200 && reg.response.status !== 201) {
    console.warn(`Registration failed (status ${reg.response.status}); aborting brute-force test`);
    return;
  }

  sleep(0.5);

  // ── Step 2: Attempt 6 logins with wrong password ──────────────────────
  const wrongPassword = 'WrongPassword999!';
  const totalAttempts = 6;
  let rateLimitHit = false;
  let rateLimitAttempt = -1;

  for (let i = 0; i < totalAttempts; i++) {
    const res = apiPost(ROUTES.login, {
      email: email,
      password: wrongPassword,
    });

    if (res.status === 429) {
      rateLimitHit = true;
      rateLimitAttempt = i + 1;
      // Verify rate limit response doesn't leak info
      checkNoLeak(res, `brute-force-attempt-${i + 1}`);
      break;
    }

    // Verify failed login responses don't leak info either
    checkNoLeak(res, `brute-force-attempt-${i + 1}`);

    sleep(0.3);
  }

  // ── Step 3: Verify brute force protection triggered ───────────────────
  check(null, {
    'brute force: rate limit triggered within 6 attempts': () => rateLimitHit,
  });

  if (rateLimitHit) {
    console.log(
      `Brute force protection triggered on attempt ${rateLimitAttempt} of ${totalAttempts}`,
    );
  } else {
    console.warn(
      `Brute force protection NOT triggered after ${totalAttempts} attempts`,
    );
  }
}
