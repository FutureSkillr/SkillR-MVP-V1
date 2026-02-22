// k6/scenarios/student/ts-004-vuca-journey.js
// Tests FR-005, FR-058, FR-060: Authenticated VUCA journey chat
//
// Simulates an authenticated student progressing through the VUCA journey,
// sending 5 messages to the Go backend's /api/v1/ai/chat endpoint.
// In mock mode (default), AI calls are skipped and canned responses are used.
// In live mode (K6_LIVE_AI=true), real Gemini requests are made with auth.
//
// NOTE: The Go backend has no session tokens, no /api/gemini/* routes, and
// uses context.journey_type rather than stationId.

import { sleep, check } from 'k6';
import { apiPost } from '../../helpers/http.js';
import {
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import { registerAndLogin, authHeaders } from '../../helpers/auth.js';
import {
  uniqueEmail,
  germanMessages,
  chatRequestBody,
  mockChatResponse,
} from '../../helpers/data.js';
import { ROUTES, LIVE_AI, thresholds, AI_THINK, thinkTime } from '../../config.js';

export const options = {
  vus: 3,
  duration: '5m',
  thresholds: Object.assign(
    {},
    LIVE_AI ? thresholds.aiLive : thresholds.aiMock,
    thresholds.auth,
    thresholds.security,
  ),
};

export default function () {
  // -- Step 1: Register + login a new user --------------------------------
  const email = uniqueEmail('vuca');
  const displayName = 'VUCA Student';
  const password = 'TestPass123!';

  const auth = registerAndLogin(email, displayName, password);

  check(auth.regResponse, {
    'register ok': (r) => r.status === 200 || r.status === 201,
  });
  check(auth.loginResponse, {
    'login ok': (r) => r !== null && r.status === 200,
  });

  if (!auth.token) {
    console.warn('VUCA journey: login failed, skipping iteration');
    return;
  }

  const headers = authHeaders(auth.token);
  const messages = germanMessages();
  const history = [];     // Go backend format: [{role, content}]
  const responses = [];

  // -- Step 2: VUCA chat loop (5 messages) --------------------------------
  for (let i = 0; i < 5; i++) {
    const userMessage = messages[i % messages.length];

    let aiResponse;

    if (LIVE_AI) {
      // Live mode: call real Go backend AI chat endpoint with auth
      const body = chatRequestBody(userMessage, history);
      const chatRes = apiPost(ROUTES.aiChat, body, headers);

      check(chatRes, {
        [`vuca-${i} status ok`]: (r) => r.status === 200 || r.status === 201,
      });

      if (chatRes.status === 200 || chatRes.status === 201) {
        checkJSON(chatRes, `vuca-${i}`);
        checkFields(chatRes, ['response'], `vuca-${i}`);
        checkNoLeak(chatRes, `vuca-${i}`);
        const parsed = JSON.parse(chatRes.body);
        aiResponse = parsed.response || '';
      } else {
        aiResponse = mockChatResponse().response;
      }
    } else {
      // Mock mode: skip real call, use canned response
      sleep(0.1);
      aiResponse = mockChatResponse().response;
    }

    // Add user message and model reply to history (Go backend format)
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'model', content: aiResponse });
    responses.push(aiResponse);

    // Simulate user thinking time between messages
    sleep(thinkTime(AI_THINK));
  }

  // -- Step 3: Validate all responses -------------------------------------
  check(responses, {
    'all responses non-empty': (rs) => rs.every((r) => r && r.length > 0),
    'no credential leak in responses': (rs) =>
      rs.every((r) => !/password|secret/i.test(r)),
    'no stack trace in responses': (rs) =>
      rs.every((r) => !/at\s+\w+\s+\(/.test(r) && !/goroutine\s+\d+/.test(r)),
  });
}
