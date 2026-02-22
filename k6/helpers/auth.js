// k6/helpers/auth.js — Registration, login, and token helpers
//
// Targets the Go backend's local auth (non-Firebase) endpoints.
// Register returns a flat user object (no token).
// Login returns {user, token} where token is a UUID session token.
//
// NOTE: In docker-compose the v1 group has no Firebase auth middleware,
// so Bearer tokens from login are not verified by the backend. Protected
// routes that need userInfo (portfolio, admin) may return 401 or behave
// differently. Auth scenarios test the auth endpoints themselves, not
// downstream route authorization.

import { ADMIN_EMAIL, ADMIN_PASSWORD, ROUTES } from '../config.js';
import { apiPost, apiGet } from './http.js';

// Register a new test user.
// Go backend expects: {email, displayName, password}
// Returns: {user, token, response}
// NOTE: Register does NOT return a token — login is required afterward.
export function registerUser(email, displayName, password) {
  const res = apiPost(ROUTES.register, {
    email: email,
    displayName: displayName,
    password: password,
  });
  if (res.status !== 200 && res.status !== 201) {
    return { user: null, token: null, response: res };
  }
  const body = JSON.parse(res.body);
  // Go backend returns flat authUserResponse (id, email, displayName, role, ...)
  return {
    user: body,
    token: null, // Register doesn't return a token — must login afterward
    response: res,
  };
}

// Login with email/password.
// Go backend returns: {user: {...}, token: "uuid-string"}
export function loginUser(email, password) {
  const res = apiPost(ROUTES.login, {
    email: email,
    password: password,
  });
  if (res.status !== 200) {
    return { user: null, token: null, response: res };
  }
  const body = JSON.parse(res.body);
  return {
    user: body.user || body,
    token: body.token || '',
    response: res,
  };
}

// Register then login — convenience for scenarios that need a token.
export function registerAndLogin(email, displayName, password) {
  const regResult = registerUser(email, displayName, password);
  if (regResult.response.status !== 200 && regResult.response.status !== 201) {
    return { user: null, token: null, regResponse: regResult.response, loginResponse: null };
  }
  const loginResult = loginUser(email, password);
  return {
    user: loginResult.user,
    token: loginResult.token,
    regResponse: regResult.response,
    loginResponse: loginResult.response,
  };
}

// Login as admin using seeded credentials from docker-compose.
export function loginAdmin() {
  return loginUser(ADMIN_EMAIL, ADMIN_PASSWORD);
}

// Build Authorization header from Bearer token.
// NOTE: In docker-compose without Firebase, this token is not verified
// by the v1 middleware — it's a UUID from the login endpoint.
export function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

// Probe an endpoint — returns true if the route exists (not 404/405).
export function routeExists(path) {
  const res = apiGet(path);
  return res.status !== 404 && res.status !== 405;
}
