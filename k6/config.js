// k6/config.js — Shared configuration for all K6 test scenarios
//
// Targets the Go backend in docker-compose (make local-up → localhost:9090).
// The Go backend serves: /api/health, /api/config, /api/auth/*, /api/v1/ai/*,
// and optionally /api/v1/lernreise/*, /api/v1/pod/*.
//
// Node.js-only routes (/api/gemini/*, /api/capacity, /api/users, /api/analytics/*)
// are NOT available in docker-compose. Scenarios that need them will skip gracefully.

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:9090';
export const HEALTH_TOKEN = __ENV.HEALTH_CHECK_TOKEN || '';
export const LIVE_AI = __ENV.K6_LIVE_AI === 'true';

// Default admin credentials — seeded by docker-compose via ADMIN_SEED_EMAIL/PASSWORD
export const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@futureskiller.local';
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin1local';

// Think time ranges (seconds) — simulates real user pauses
export const AI_THINK = { min: 3, max: 8 };
export const PAGE_THINK = { min: 1, max: 3 };

// ── API Route Constants ─────────────────────────────────────────────────────
// Go backend routes (docker-compose)
export const ROUTES = {
  // Public
  health:         '/api/health',
  healthDetailed: '/api/health/detailed',
  config:         '/api/config',

  // Auth (Go backend local auth)
  register:       '/api/auth/register',
  login:          '/api/auth/login',
  loginProvider:  '/api/auth/login-provider',
  resetPassword:  '/api/auth/reset-password',

  // AI (Go backend — requires GCP credentials)
  aiChat:         '/api/v1/ai/chat',
  aiExtract:      '/api/v1/ai/extract',
  aiGenerate:     '/api/v1/ai/generate',

  // Lernreise (Go backend — requires Honeycomb + Memory)
  lernreiseCatalog:  '/api/v1/lernreise/catalog',
  lernreiseSelect:   '/api/v1/lernreise/select',
  lernreiseActive:   '/api/v1/lernreise/active',

  // Admin (Go backend — requires Firebase auth middleware to set user info)
  prompts:        '/api/v1/prompts',
  agents:         '/api/v1/agents',
};

// ── Threshold Presets ────────────────────────────────────────────────────────
export const thresholds = {
  health: {
    'http_req_duration{endpoint:/api/health}': ['p(95)<200', 'p(99)<500'],
    'http_req_failed{endpoint:/api/health}': ['rate<0.01'],
  },
  config: {
    'http_req_duration{endpoint:/api/config}': ['p(95)<200', 'p(99)<500'],
    'http_req_failed{endpoint:/api/config}': ['rate<0.01'],
  },
  auth: {
    'http_req_duration{endpoint:/api/auth/register}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{endpoint:/api/auth/login}': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed{endpoint:/api/auth/register}': ['rate<0.02'],
    'http_req_failed{endpoint:/api/auth/login}': ['rate<0.02'],
  },
  aiLive: {
    'http_req_duration{endpoint:/api/v1/ai/chat}': ['p(95)<8000', 'p(99)<15000'],
    'http_req_failed{endpoint:/api/v1/ai/chat}': ['rate<0.10'],
    'http_req_duration{endpoint:/api/v1/ai/extract}': ['p(95)<10000', 'p(99)<20000'],
    'http_req_failed{endpoint:/api/v1/ai/extract}': ['rate<0.15'],
  },
  aiMock: {
    'http_req_duration{endpoint:/api/v1/ai/chat}': ['p(95)<200', 'p(99)<500'],
    'http_req_failed{endpoint:/api/v1/ai/chat}': ['rate<0.01'],
  },
  security: {
    checks: ['rate>0.99'],
  },
};

// Helper: random sleep duration between min and max
export function thinkTime(range_) {
  return Math.random() * (range_.max - range_.min) + range_.min;
}
