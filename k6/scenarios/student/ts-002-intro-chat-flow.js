// k6/scenarios/student/ts-002-intro-chat-flow.js
// Tests FR-054, FR-005, FR-058, FR-060: 5-question intro chat
//
// Simulates an anonymous visitor completing the 5-message intro chat flow.
// In mock mode (default), the AI endpoint is skipped and canned responses
// are used. In live mode (K6_LIVE_AI=true), real API calls are made to
// the Go backend's /api/v1/ai/chat.
//
// NOTE: The Go backend has no session token concept and no /api/gemini/*
// routes. AI routes are under /api/v1/ai/*.

import { sleep, check } from 'k6';
import { apiPost } from '../../helpers/http.js';
import {
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import {
  germanMessages,
  chatRequestBody,
  mockChatResponse,
} from '../../helpers/data.js';
import { ROUTES, LIVE_AI, thresholds, AI_THINK, thinkTime } from '../../config.js';

export const options = {
  vus: 5,
  duration: '3m',
  thresholds: Object.assign(
    {},
    LIVE_AI ? thresholds.aiLive : thresholds.aiMock,
    thresholds.security,
  ),
};

export default function () {
  const messages = germanMessages();
  const history = [];     // Go backend format: [{role, content}]
  const responses = [];

  // -- 5-message intro chat loop ------------------------------------------
  for (let i = 0; i < 5; i++) {
    const userMessage = messages[i % messages.length];

    let aiResponse;

    if (LIVE_AI) {
      // Live mode: call the real Go backend AI chat endpoint
      const body = chatRequestBody(userMessage, history);
      const chatRes = apiPost(ROUTES.aiChat, body);

      // Accept both success and potential fallback
      check(chatRes, {
        'chat response status ok': (r) => r.status === 200 || r.status === 201,
      });

      if (chatRes.status === 200 || chatRes.status === 201) {
        checkJSON(chatRes, `chat-${i}`);
        checkFields(chatRes, ['response'], `chat-${i}`);
        checkNoLeak(chatRes, `chat-${i}`);
        const parsed = JSON.parse(chatRes.body);
        aiResponse = parsed.response || '';
      } else {
        // Fallback to mock if live call fails
        aiResponse = mockChatResponse().response;
      }
    } else {
      // Mock mode: skip the real API call, use canned response
      sleep(0.1);
      aiResponse = mockChatResponse().response;
    }

    // Add user message and model reply to history (Go backend format)
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'model', content: aiResponse });
    responses.push(aiResponse);

    // User thinks before next message
    sleep(thinkTime(AI_THINK));
  }

  // -- Verify no information leaks in collected responses -----------------
  check(responses, {
    'no credential leak in responses': (rs) =>
      rs.every((r) => !/password|secret/i.test(r)),
    'no stack trace in responses': (rs) =>
      rs.every((r) => !/at\s+\w+\s+\(/.test(r) && !/goroutine\s+\d+/.test(r)),
  });
}
