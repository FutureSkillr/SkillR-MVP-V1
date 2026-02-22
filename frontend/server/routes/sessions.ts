import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

// POST /api/sessions
router.post('/', (req, res) => {
  const { session_id, session_type, station_id, journey_type, started_at, ended_at } = req.body;
  if (!session_id || !session_type || started_at == null) {
    return res.status(400).json({ error: 'session_id, session_type, and started_at are required.' });
  }

  const db = getDB();
  db.prepare(`
    INSERT OR REPLACE INTO sessions (session_id, session_type, station_id, journey_type, started_at, ended_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(session_id, session_type, station_id ?? null, journey_type ?? null, started_at, ended_at ?? null);

  return res.json({ ok: true });
});

// PATCH /api/sessions/:id/end
router.patch('/:id/end', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.prepare('UPDATE sessions SET ended_at = ? WHERE session_id = ?').run(Date.now(), id);
  return res.json({ ok: true });
});

// GET /api/sessions
router.get('/', (_req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM sessions ORDER BY started_at DESC').all();
  return res.json(rows);
});

export default router;
