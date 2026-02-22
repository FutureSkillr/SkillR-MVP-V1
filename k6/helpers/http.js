// k6/helpers/http.js — Wrapped HTTP calls with auto-tagging for K6 metric grouping
import http from 'k6/http';
import { BASE_URL } from '../config.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function mergeHeaders(extra) {
  if (!extra) return JSON_HEADERS;
  return Object.assign({}, JSON_HEADERS, extra);
}

function params(path, headers) {
  return {
    headers: mergeHeaders(headers),
    tags: { endpoint: path },
  };
}

export function apiGet(path, headers) {
  return http.get(`${BASE_URL}${path}`, params(path, headers));
}

export function apiPost(path, body, headers) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return http.post(`${BASE_URL}${path}`, payload, params(path, headers));
}

export function apiPut(path, body, headers) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return http.put(`${BASE_URL}${path}`, payload, params(path, headers));
}

export function apiPatch(path, body, headers) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return http.patch(`${BASE_URL}${path}`, payload, params(path, headers));
}

export function apiDelete(path, headers) {
  return http.del(`${BASE_URL}${path}`, null, params(path, headers));
}
