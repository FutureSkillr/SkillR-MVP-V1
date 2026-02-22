// k6/helpers/checks.js — Reusable check() wrappers for K6 scenarios
import { check } from 'k6';

// Verify HTTP status code
export function checkStatus(res, expected, label) {
  const name = label ? `${label}: status ${expected}` : `status is ${expected}`;
  return check(res, { [name]: (r) => r.status === expected });
}

// Verify response is valid JSON
export function checkJSON(res, label) {
  const name = label ? `${label}: valid JSON` : 'response is valid JSON';
  return check(res, {
    [name]: (r) => {
      try {
        const ct = r.headers['Content-Type'] || '';
        if (!ct.includes('application/json')) return false;
        JSON.parse(r.body);
        return true;
      } catch (_) {
        return false;
      }
    },
  });
}

// Verify fields exist in parsed JSON body
export function checkFields(res, fields, label) {
  const prefix = label ? `${label}: ` : '';
  const parsed = safeParseJSON(res.body);
  if (!parsed) return false;
  let allPassed = true;
  const checks = {};
  for (const f of fields) {
    checks[`${prefix}has field '${f}'`] = () => parsed[f] !== undefined;
  }
  return check(null, checks);
}

// Verify a specific response header value
export function checkHeader(res, header, expected, label) {
  const name = label
    ? `${label}: header ${header}`
    : `header ${header} is ${expected}`;
  return check(res, {
    [name]: (r) => {
      const val = r.headers[header] || '';
      if (expected instanceof RegExp) return expected.test(val);
      return val.toLowerCase().includes(expected.toLowerCase());
    },
  });
}

// Verify no stack traces, file paths, or internal error leaks
export function checkNoLeak(res, label) {
  const name = label ? `${label}: no info leak` : 'no information leak';
  return check(res, {
    [name]: (r) => {
      const body = r.body || '';
      // Check for common leak patterns
      if (/at\s+\w+\s+\(/.test(body)) return false;       // JS stack trace
      if (/goroutine\s+\d+/.test(body)) return false;      // Go stack trace
      if (/\/home\/|\/app\/|\/usr\//.test(body)) return false; // file paths
      if (/password|secret/i.test(body)) return false;   // credential fields (token excluded — normal auth response field)
      return true;
    },
  });
}

function safeParseJSON(body) {
  try {
    return JSON.parse(body);
  } catch (_) {
    return null;
  }
}
