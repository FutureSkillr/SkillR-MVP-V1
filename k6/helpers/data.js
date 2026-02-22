// k6/helpers/data.js — Test data generators and mock AI responses
//
// Request bodies match the Go backend's API format:
// - AI chat: {message, system_instruction, history:[{role,content}]}
// - AI extract: {messages:[{role,content}], context:{extract_type}}
// - AI generate: {parameters:{goal,...}, context:{generate_type}}

import exec from 'k6/execution';

// Generate a unique email per VU + iteration to avoid collisions
export function uniqueEmail(prefix) {
  const vu = exec.vu.idInTest || 0;
  const iter = exec.vu.iterationInScenario || 0;
  const ts = Date.now();
  return `${prefix}-${vu}-${iter}-${ts}@test.local`;
}

// Realistic German messages for intro chat simulation
export function germanMessages() {
  return [
    'Hallo! Ich bin 16 und gehe aufs Gymnasium.',
    'Mich interessiert eigentlich alles mit Technik und Computern.',
    'Ja, ich spiele gerne Videospiele und baue auch manchmal eigene Mods.',
    'In der Schule mag ich Mathe und Physik am liebsten.',
    'Ich hab auch schon mal eine kleine Website gebaut, das hat Spass gemacht!',
  ];
}

// Build alternating user/model chat history in Go backend format.
// Format: [{role:"user", content:"..."}, {role:"model", content:"..."}]
export function chatHistory(n) {
  const msgs = germanMessages();
  const modelReplies = [
    'Das klingt super! Erzaehl mir mehr darueber.',
    'Interessant! Was genau fasziniert dich daran?',
    'Cool! Hast du schon eigene Projekte gemacht?',
    'Toll! Was moechtest du in Zukunft damit machen?',
    'Das ist ein toller Anfang! Welche Sprache hast du benutzt?',
  ];
  const history = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      history.push({ role: 'user', content: msgs[i % msgs.length] });
    } else {
      history.push({ role: 'model', content: modelReplies[i % modelReplies.length] });
    }
  }
  return history;
}

// Build a chat request body for the Go backend's /api/v1/ai/chat
export function chatRequestBody(message, history) {
  return {
    message: message,
    history: history || [],
    system_instruction: 'Du bist ein freundlicher Karriere-Coach fuer Jugendliche. Antworte auf Deutsch.',
  };
}

// Build an extract request body for /api/v1/ai/extract
export function extractRequestBody(messages) {
  return {
    messages: messages || chatHistory(6),
    context: { extract_type: 'insights' },
  };
}

// Build a generate request body for /api/v1/ai/generate (curriculum)
export function generateCurriculumBody(goal) {
  return {
    parameters: { goal: goal || 'Software Entwickler' },
    context: { generate_type: 'curriculum' },
  };
}

// Build a generate request body for /api/v1/ai/generate (course)
export function generateCourseBody(goal, module_) {
  return {
    parameters: {
      goal: goal || 'Software Entwickler',
      module: module_ || { title: 'Einstieg', description: 'Grundlagen', category: 'V' },
    },
    context: { generate_type: 'course' },
  };
}

// Generate a string of n characters for validation tests
export function longString(n) {
  return 'A'.repeat(n);
}

// ─── Mock AI Responses ──────────────────────────────────────────────
// Used when K6_LIVE_AI is not set; mirrors exact JSON shape of Go backend responses.

// Go backend chat returns: {response, text, agent_id, markers}
export function mockChatResponse() {
  return {
    response: 'Das ist eine tolle Antwort! Erzaehl mir mehr ueber deine Interessen.',
    text: 'Das ist eine tolle Antwort! Erzaehl mir mehr ueber deine Interessen.',
    agent_id: 'passthrough',
  };
}

// Go backend extract returns: {result: {...}, prompt_id, prompt_version}
export function mockExtractResponse() {
  return {
    result: {
      interests: ['Technologie', 'Gaming', 'Programmierung'],
      strengths: ['Logisches Denken', 'Kreativitaet'],
      preferredStyle: 'hands-on',
      recommendedJourney: 'vuca',
      summary: 'Technikbegeisterter Schueler mit kreativem Potenzial.',
    },
    prompt_id: 'builtin:insights',
    prompt_version: 0,
  };
}

// Go backend generate (curriculum) returns: {result: {...}, prompt_id, prompt_version}
export function mockCurriculumResponse() {
  return {
    result: {
      goal: 'Software Entwickler',
      modules: [
        { id: 'v1', title: 'Veraenderung verstehen', description: 'Grundlagen', category: 'V', order: 1 },
        { id: 'u1', title: 'Unsicherheit meistern', description: 'Strategien', category: 'U', order: 4 },
      ],
    },
    prompt_id: 'builtin:curriculum',
    prompt_version: 0,
  };
}

// Go backend generate (course) returns: {result: {...}, prompt_id, prompt_version}
export function mockCourseResponse() {
  return {
    result: {
      title: 'Veraenderung verstehen',
      sections: [{ heading: 'Was ist VUCA?', content: 'VUCA steht fuer...' }],
      quiz: [{ question: 'Was bedeutet V?', options: ['Volatilitaet', 'Vision', 'Vielfalt', 'Verantwortung'], correctIndex: 0 }],
    },
    prompt_id: 'builtin:course',
    prompt_version: 0,
  };
}
