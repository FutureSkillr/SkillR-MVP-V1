// k6/scenarios/student/ts-005-profile-generation.js
// Tests FR-008, FR-005: Profile generation pipeline
//
// Simulates an authenticated user extracting insights from a chat conversation,
// generating a curriculum based on interests, and generating a course from a
// module. In mock mode (default), canned responses are used; in live mode
// (K6_LIVE_AI=true), real AI calls are made via the Go backend.

import { sleep, check } from 'k6';
import { ROUTES, thresholds, PAGE_THINK, LIVE_AI, thinkTime } from '../../config.js';
import { apiPost } from '../../helpers/http.js';
import {
  checkStatus,
  checkJSON,
  checkFields,
  checkNoLeak,
} from '../../helpers/checks.js';
import { registerAndLogin, authHeaders } from '../../helpers/auth.js';
import {
  uniqueEmail,
  chatHistory,
  extractRequestBody,
  generateCurriculumBody,
  generateCourseBody,
  mockExtractResponse,
  mockCurriculumResponse,
  mockCourseResponse,
} from '../../helpers/data.js';

export const options = {
  vus: 2,
  duration: '3m',
  thresholds: Object.assign(
    {},
    LIVE_AI ? thresholds.aiLive : thresholds.aiMock,
    thresholds.security,
  ),
};

export default function () {
  // -- Step 1: Register + login new user ------------------------------------
  const email = uniqueEmail('k6-profile');
  const password = 'Test1234!';
  const { token } = registerAndLogin(email, 'K6 Profile Test', password);

  check(token, {
    'auth token obtained': (t) => t && t.length > 0,
  });

  const headers = authHeaders(token);

  sleep(thinkTime(PAGE_THINK));

  // -- Step 2: Extract insights from chat history ---------------------------
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
      extractData = JSON.parse(extractRes.body);
    } else {
      extractData = mockExtractResponse();
    }
  } else {
    sleep(0.1);
    extractData = mockExtractResponse();
  }

  // Verify extract returns result with interests
  check(extractData, {
    'extract: has result object': (d) => d && d.result !== undefined,
    'extract: has interests array': (d) =>
      d && d.result && Array.isArray(d.result.interests),
    'extract: has prompt_id': (d) => d && d.prompt_id !== undefined,
  });

  sleep(thinkTime(PAGE_THINK));

  // -- Step 3: Generate curriculum ------------------------------------------
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
      checkFields(currRes, ['result'], 'generate-curriculum');
      checkNoLeak(currRes, 'generate-curriculum');
      curriculumData = JSON.parse(currRes.body);
    } else {
      curriculumData = mockCurriculumResponse();
    }
  } else {
    sleep(0.1);
    curriculumData = mockCurriculumResponse();
  }

  // Verify curriculum has modules array inside result
  check(curriculumData, {
    'curriculum: has result object': (d) => d && d.result !== undefined,
    'curriculum: has modules array': (d) =>
      d && d.result && Array.isArray(d.result.modules),
    'curriculum: modules not empty': (d) =>
      d && d.result && d.result.modules && d.result.modules.length > 0,
  });

  sleep(thinkTime(PAGE_THINK));

  // -- Step 4: Generate course from first module ----------------------------
  let courseData;

  if (LIVE_AI) {
    const courseRes = apiPost(
      ROUTES.aiGenerate,
      generateCourseBody('Software Entwickler', { title: 'Einstieg', description: 'Grundlagen', category: 'V' }),
      headers,
    );

    check(courseRes, {
      'generate-course: status ok': (r) => r.status === 200 || r.status === 201,
    });

    if (courseRes.status === 200 || courseRes.status === 201) {
      checkJSON(courseRes, 'generate-course');
      checkFields(courseRes, ['result'], 'generate-course');
      checkNoLeak(courseRes, 'generate-course');
      courseData = JSON.parse(courseRes.body);
    } else {
      courseData = mockCourseResponse();
    }
  } else {
    sleep(0.1);
    courseData = mockCourseResponse();
  }

  // Verify course has sections inside result
  check(courseData, {
    'course: has result object': (d) => d && d.result !== undefined,
    'course: has sections array': (d) =>
      d && d.result && Array.isArray(d.result.sections),
    'course: sections not empty': (d) =>
      d && d.result && d.result.sections && d.result.sections.length > 0,
  });

  sleep(thinkTime(PAGE_THINK));
}
