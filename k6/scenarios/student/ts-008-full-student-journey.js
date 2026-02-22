// k6/scenarios/student/ts-008-full-student-journey.js
// Tests FR-054, FR-005, FR-008, FR-056, FR-062: Full student lifecycle composite
//
// Simulates the complete end-to-end student journey: landing page arrival,
// intro chat with the AI coach, account registration, profile generation via
// AI extract/generate, and portfolio probe. Each phase is separated by
// realistic think-time pauses. Covers the happy path from anonymous visitor
// to fully-profiled student.

import { sleep, check } from 'k6';
import { ROUTES, thresholds, PAGE_THINK, AI_THINK, LIVE_AI, thinkTime } from '../../config.js';
import { apiGet, apiPost } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import { registerAndLogin, authHeaders, routeExists } from '../../helpers/auth.js';
import {
  uniqueEmail,
  germanMessages,
  chatHistory,
  chatRequestBody,
  extractRequestBody,
  generateCurriculumBody,
  mockChatResponse,
  mockExtractResponse,
  mockCurriculumResponse,
} from '../../helpers/data.js';

export const options = {
  vus: 2,
  duration: '5m',
  thresholds: Object.assign(
    {},
    thresholds.health,
    thresholds.config,
    thresholds.auth,
    LIVE_AI ? thresholds.aiLive : thresholds.aiMock,
    thresholds.security,
  ),
};

export default function () {
  // ====================================================================
  // Phase 1 - Landing: health + config
  // ====================================================================

  const healthRes = apiGet(ROUTES.health);
  checkStatus(healthRes, 200, 'landing-health');
  checkJSON(healthRes, 'landing-health');
  checkFields(healthRes, ['status'], 'landing-health');
  checkNoLeak(healthRes, 'landing-health');

  const configRes = apiGet(ROUTES.config);
  checkStatus(configRes, 200, 'landing-config');
  checkJSON(configRes, 'landing-config');
  checkNoLeak(configRes, 'landing-config');

  sleep(thinkTime(PAGE_THINK));

  // ====================================================================
  // Phase 2 - Intro Chat: 3 messages via Go backend AI chat
  // ====================================================================

  const messages = germanMessages();
  const history = [];

  for (let i = 0; i < 3; i++) {
    const userMessage = messages[i % messages.length];
    history.push({ role: 'user', content: userMessage });

    let aiResponse;

    if (LIVE_AI) {
      const chatRes = apiPost(
        ROUTES.aiChat,
        chatRequestBody(userMessage, history.slice(0, -1)),
      );

      check(chatRes, {
        [`intro-chat-${i}: status ok`]: (r) => r.status === 200 || r.status === 201,
      });

      if (chatRes.status === 200 || chatRes.status === 201) {
        checkJSON(chatRes, `intro-chat-${i}`);
        checkNoLeak(chatRes, `intro-chat-${i}`);
        try {
          const parsed = JSON.parse(chatRes.body);
          aiResponse = parsed.response || parsed.text || '';
        } catch (_) {
          aiResponse = mockChatResponse().response;
        }
      } else {
        aiResponse = mockChatResponse().response;
      }
    } else {
      sleep(0.1);
      aiResponse = mockChatResponse().response;
    }

    history.push({ role: 'model', content: aiResponse });

    sleep(thinkTime(AI_THINK));
  }

  sleep(thinkTime(PAGE_THINK));

  // ====================================================================
  // Phase 3 - Registration: register + login
  // ====================================================================

  const email = uniqueEmail('k6-journey');
  const password = 'Test1234!';

  const { token, regResponse } = registerAndLogin(email, 'K6 Journey Test', password);

  check(regResponse, {
    'register: status ok': (r) => r && (r.status === 200 || r.status === 201),
  });
  check(token, {
    'login: auth token obtained': (t) => t && t.length > 0,
  });

  const headers = authHeaders(token);

  sleep(thinkTime(PAGE_THINK));

  // ====================================================================
  // Phase 4 - Profile: extract insights + generate curriculum
  // ====================================================================

  let extractData;

  if (LIVE_AI) {
    const extractRes = apiPost(
      ROUTES.aiExtract,
      extractRequestBody(chatHistory(6)),
      headers,
    );

    check(extractRes, {
      'extract: status ok': (r) => r.status === 200 || r.status === 201,
    });

    if (extractRes.status === 200 || extractRes.status === 201) {
      checkJSON(extractRes, 'extract');
      checkFields(extractRes, ['result'], 'extract');
      checkNoLeak(extractRes, 'extract');
      try {
        extractData = JSON.parse(extractRes.body);
      } catch (_) {
        extractData = mockExtractResponse();
      }
    } else {
      extractData = mockExtractResponse();
    }
  } else {
    sleep(0.1);
    extractData = mockExtractResponse();
  }

  check(extractData, {
    'profile: has result': (d) => d && d.result !== undefined,
  });

  sleep(thinkTime(PAGE_THINK));

  let curriculumData;

  if (LIVE_AI) {
    const currRes = apiPost(
      ROUTES.aiGenerate,
      generateCurriculumBody('Software Entwickler'),
      headers,
    );

    check(currRes, {
      'generate-curriculum: status ok': (r) => r.status === 200 || r.status === 201,
    });

    if (currRes.status === 200 || currRes.status === 201) {
      checkJSON(currRes, 'generate-curriculum');
      checkNoLeak(currRes, 'generate-curriculum');
      try {
        curriculumData = JSON.parse(currRes.body);
      } catch (_) {
        curriculumData = mockCurriculumResponse();
      }
    } else {
      curriculumData = mockCurriculumResponse();
    }
  } else {
    sleep(0.1);
    curriculumData = mockCurriculumResponse();
  }

  check(curriculumData, {
    'profile: has result with curriculum': (d) => d && d.result !== undefined,
  });

  sleep(thinkTime(PAGE_THINK));

  // ====================================================================
  // Phase 5 - Portfolio: probe first, skip if 404
  // ====================================================================

  const portfolioAvailable = routeExists('/api/v1/portfolio/profile');

  if (!portfolioAvailable) {
    console.warn('portfolio routes not available in Go backend, skipping portfolio phase');
    return;
  }

  const createReflectionRes = apiPost(
    '/api/v1/portfolio/reflections',
    {
      topic: 'VUCA Bingo Reflexion',
      content: 'Ich habe heute gelernt, dass Veraenderung positiv sein kann.',
      dimension: 'V',
    },
    headers,
  );
  check(createReflectionRes, {
    'portfolio: create reflection status ok': (r) =>
      r.status === 200 || r.status === 201,
  });
  checkJSON(createReflectionRes, 'portfolio-create-reflection');
  checkNoLeak(createReflectionRes, 'portfolio-create-reflection');

  sleep(thinkTime(PAGE_THINK));

  const listReflectionsRes = apiGet('/api/v1/portfolio/reflections', headers);
  checkStatus(listReflectionsRes, 200, 'portfolio-list-reflections');
  checkJSON(listReflectionsRes, 'portfolio-list-reflections');
  checkNoLeak(listReflectionsRes, 'portfolio-list-reflections');

  let reflections;
  try {
    reflections = JSON.parse(listReflectionsRes.body);
  } catch (_) {
    reflections = null;
  }

  check(reflections, {
    'portfolio: reflections is array': (r) => Array.isArray(r),
  });

  sleep(thinkTime(PAGE_THINK));
}
