// k6/scenarios/load/ts-041-sustained-load.js
// Tests FR-068, FR-054, FR-060: Composite sustained load test
//
// Runs five concurrent user archetypes against the Go backend for 10 minutes:
//   - browsers:       page-load simulation (health + config)
//   - chatters:       students chatting with the AI coach via /api/v1/ai/chat
//   - explorers:      authenticated users browsing health + config (portfolio
//                     routes are not registered in the Go backend)
//   - monitors:       automated health-check polling (e.g. uptime robot)
//   - registrations:  new user signup cycles
//
// Each archetype has its own k6 scenario executor so they run independently
// with distinct VU counts and ramp-up profiles.
//
// Go backend API:
//   GET  /api/health          → {status:"ok"}
//   GET  /api/config          → {firebase:{...}}
//   POST /api/auth/register   → {id, email, displayName, role, ...}
//   POST /api/auth/login      → {user:{...}, token:"uuid-string"}
//   POST /api/v1/ai/chat      → {response, text, agent_id, markers}
//   NOTE: /api/capacity and /api/v1/portfolio/* do not exist in Go backend.

import { sleep, check } from 'k6';
import { apiGet, apiPost } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkNoLeak,
} from '../../helpers/checks.js';
import {
  registerUser,
  loginUser,
  registerAndLogin,
  authHeaders,
} from '../../helpers/auth.js';
import {
  uniqueEmail,
  germanMessages,
  chatRequestBody,
} from '../../helpers/data.js';
import { ROUTES, LIVE_AI, PAGE_THINK, AI_THINK, thinkTime } from '../../config.js';

// ── Scenario configuration ──────────────────────────────────────────────────

export const options = {
  scenarios: {
    browsers: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10m',
      exec: 'browserFlow',
    },
    chatters: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 5 },
        { duration: '6m', target: 5 },
        { duration: '2m', target: 0 },
      ],
      exec: 'chatterFlow',
    },
    explorers: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10m',
      exec: 'explorerFlow',
    },
    monitors: {
      executor: 'constant-vus',
      vus: 2,
      duration: '10m',
      exec: 'monitorFlow',
    },
    registrations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 2 },
        { duration: '8m', target: 2 },
        { duration: '1m', target: 0 },
      ],
      exec: 'registrationFlow',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.10'],
  },
};

// ── Per-VU state for flows that require auth ─────────────────────────────────

const vuState = {};

function ensureAuth(prefix) {
  const vuId = __VU;
  if (vuState[vuId] && vuState[vuId].token) {
    return vuState[vuId];
  }
  const email = uniqueEmail(prefix);
  const password = 'Test1234!';
  const result = registerAndLogin(email, `K6 ${prefix}`, password);
  vuState[vuId] = { email, token: result.token };
  return vuState[vuId];
}

// ── Flow: browsers ──────────────────────────────────────────────────────────
// Simulates anonymous page loads — hit the public endpoints in sequence.

export function browserFlow() {
  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'browser-health');
  checkNoLeak(healthRes, 'browser-health');

  sleep(thinkTime(PAGE_THINK));

  const configRes = apiGet(ROUTES.config);
  checkStatus(configRes, 200, 'browser-config');
  checkNoLeak(configRes, 'browser-config');

  sleep(thinkTime(PAGE_THINK));
}

// ── Flow: chatters ──────────────────────────────────────────────────────────
// Simulates students chatting with the AI coach. Registers/logs in once per
// VU, then sends a chat message each iteration via /api/v1/ai/chat.

export function chatterFlow() {
  const auth = ensureAuth('k6-chatter');

  if (!auth.token) {
    console.warn('chatterFlow: auth failed, skipping iteration');
    sleep(5);
    return;
  }

  const messages = germanMessages();
  const msgIndex = __ITER % messages.length;
  const userMessage = messages[msgIndex];

  const headers = authHeaders(auth.token);
  const body = chatRequestBody(userMessage);

  const chatRes = apiPost(ROUTES.aiChat, body, headers);

  check(chatRes, {
    'chatter-chat: status ok': (r) => r.status === 200 || r.status === 201,
  });
  if (chatRes.status === 200 || chatRes.status === 201) {
    checkJSON(chatRes, 'chatter-chat');
    checkNoLeak(chatRes, 'chatter-chat');
  }

  sleep(thinkTime(AI_THINK));
}

// ── Flow: explorers ─────────────────────────────────────────────────────────
// Simulates authenticated users browsing the app. Portfolio routes are not
// registered in the Go backend, so this flow exercises health + config as
// an authenticated user would during normal navigation.

export function explorerFlow() {
  const auth = ensureAuth('k6-explorer');

  if (!auth.token) {
    console.warn('explorerFlow: auth failed, skipping iteration');
    sleep(5);
    return;
  }

  const headers = authHeaders(auth.token);

  // Authenticated health check
  const healthRes = apiGet(ROUTES.health, headers);
  checkStatus(healthRes, 200, 'explorer-health');
  checkJSON(healthRes, 'explorer-health');
  checkNoLeak(healthRes, 'explorer-health');

  sleep(thinkTime(PAGE_THINK));

  // Authenticated config fetch
  const configRes = apiGet(ROUTES.config, headers);
  checkStatus(configRes, 200, 'explorer-config');
  checkJSON(configRes, 'explorer-config');
  checkNoLeak(configRes, 'explorer-config');

  sleep(thinkTime(PAGE_THINK));
}

// ── Flow: monitors ──────────────────────────────────────────────────────────
// Simulates automated monitoring systems polling the health endpoint.

export function monitorFlow() {
  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'monitor-health');
  checkJSON(healthRes, 'monitor-health');
  checkNoLeak(healthRes, 'monitor-health');

  sleep(5);
}

// ── Flow: registrations ─────────────────────────────────────────────────────
// Simulates new user signups — register + login each iteration.

export function registrationFlow() {
  const email = uniqueEmail('k6-reg');
  const password = 'Test1234!';

  const regResult = registerUser(email, 'K6 Registration Test', password);
  check(regResult.response, {
    'registration: status ok': (r) => r.status === 200 || r.status === 201,
  });
  if (regResult.response.status === 200 || regResult.response.status === 201) {
    checkJSON(regResult.response, 'registration');
    checkNoLeak(regResult.response, 'registration');
  }

  sleep(thinkTime(PAGE_THINK));

  const loginResult = loginUser(email, password);
  check(loginResult.response, {
    'login: status ok': (r) => r.status === 200,
  });
  if (loginResult.response.status === 200) {
    checkJSON(loginResult.response, 'login');
    checkNoLeak(loginResult.response, 'login');

    check(loginResult.token, {
      'login: token obtained': (t) => t && t.length > 0,
    });
  }

  sleep(thinkTime(PAGE_THINK));
}
