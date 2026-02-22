import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

interface PromptLogRow {
  request_id: string;
  session_id: string;
  method: string;
  session_type: string;
  model_name: string;
  system_prompt: string;
  user_message: string;
  chat_history: string;
  raw_response: string;
  structured_response: string;
  status: string;
  error_message: string | null;
  latency_ms: number;
  retry_count: number;
  request_timestamp: number;
  response_timestamp: number;
  token_count_estimate: number;
}

// POST /api/prompt-logs
router.post('/', (req, res) => {
  const e = req.body;
  if (!e.request_id || !e.session_id) {
    return res.status(400).json({ error: 'request_id and session_id are required.' });
  }

  const db = getDB();
  db.prepare(`
    INSERT INTO prompt_logs (
      request_id, session_id, method, session_type, model_name,
      system_prompt, user_message, chat_history, raw_response, structured_response,
      status, error_message, latency_ms, retry_count,
      request_timestamp, response_timestamp, token_count_estimate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    e.request_id, e.session_id, e.method, e.session_type, e.model_name,
    e.system_prompt, e.user_message, e.chat_history, e.raw_response, e.structured_response,
    e.status, e.error_message ?? null, e.latency_ms, e.retry_count,
    e.request_timestamp, e.response_timestamp, e.token_count_estimate,
  );

  return res.json({ ok: true });
});

// GET /api/prompt-logs
router.get('/', (req, res) => {
  const { method, status, sessionId } = req.query;

  let query = 'SELECT * FROM prompt_logs WHERE 1=1';
  const params: (string | number)[] = [];

  if (method) {
    query += ' AND method = ?';
    params.push(method as string);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status as string);
  }
  if (sessionId) {
    query += ' AND session_id = ?';
    params.push(sessionId as string);
  }

  query += ' ORDER BY request_timestamp DESC';

  const db = getDB();
  const rows = db.prepare(query).all(...params);
  return res.json(rows);
});

// GET /api/prompt-logs/stats
router.get('/stats', (_req, res) => {
  const db = getDB();
  const row = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
      AVG(latency_ms) as avg_latency,
      SUM(token_count_estimate) as total_tokens
    FROM prompt_logs
  `).get() as { total: number; success_count: number; error_count: number; avg_latency: number; total_tokens: number };

  return res.json({
    totalCalls: row.total || 0,
    successCount: row.success_count || 0,
    errorCount: row.error_count || 0,
    avgLatencyMs: Math.round(row.avg_latency || 0),
    totalTokenEstimate: row.total_tokens || 0,
  });
});

// GET /api/prompt-logs/export-csv
router.get('/export-csv', (_req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM prompt_logs ORDER BY request_timestamp DESC').all() as PromptLogRow[];

  if (!rows.length) {
    return res.type('text/csv').send('');
  }

  const headers = [
    'request_id', 'session_id', 'method', 'session_type', 'model_name',
    'status', 'error_message', 'latency_ms', 'retry_count',
    'request_timestamp', 'response_timestamp', 'token_count_estimate',
    'system_prompt', 'user_message', 'raw_response',
  ];

  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csvRows = rows.map((row) =>
    headers.map((h) => escape((row as unknown as Record<string, unknown>)[h])).join(',')
  );

  return res.type('text/csv').send([headers.join(','), ...csvRows].join('\n'));
});

// DELETE /api/prompt-logs
router.delete('/', (_req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM prompt_logs').run();
  db.prepare('DELETE FROM sessions').run();
  return res.json({ ok: true });
});

export default router;
