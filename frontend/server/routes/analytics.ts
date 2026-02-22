import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

interface UserEventRow {
  id: number;
  event_type: string;
  browser_session_id: string;
  prompt_session_id: string | null;
  timestamp: number;
  properties: string;
}

// POST /api/analytics/events — batch insert
router.post('/events', (req, res) => {
  const events = req.body;
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Expected non-empty array of events.' });
  }

  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO user_events (event_type, browser_session_id, prompt_session_id, timestamp, properties)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: typeof events) => {
    for (const e of items) {
      if (!e.event_type || !e.browser_session_id || !e.timestamp) continue;
      stmt.run(
        e.event_type,
        e.browser_session_id,
        e.prompt_session_id ?? null,
        e.timestamp,
        JSON.stringify(e.properties ?? {}),
      );
    }
  });

  insertMany(events);
  return res.json({ ok: true, inserted: events.length });
});

// GET /api/analytics/events — query with filters
router.get('/events', (req, res) => {
  const { event_type, browser_session_id, from, to, limit } = req.query;

  let query = 'SELECT * FROM user_events WHERE 1=1';
  const params: (string | number)[] = [];

  if (event_type) {
    query += ' AND event_type = ?';
    params.push(event_type as string);
  }
  if (browser_session_id) {
    query += ' AND browser_session_id = ?';
    params.push(browser_session_id as string);
  }
  if (from) {
    query += ' AND timestamp >= ?';
    params.push(Number(from));
  }
  if (to) {
    query += ' AND timestamp <= ?';
    params.push(Number(to));
  }

  query += ' ORDER BY timestamp DESC';
  query += ` LIMIT ${Math.min(Number(limit) || 500, 5000)}`;

  const db = getDB();
  const rows = db.prepare(query).all(...params);
  return res.json(rows);
});

// GET /api/analytics/overview — aggregated stats
router.get('/overview', (_req, res) => {
  const db = getDB();

  const totals = db.prepare(`
    SELECT
      COUNT(*) as totalEvents,
      COUNT(DISTINCT browser_session_id) as uniqueSessions
    FROM user_events
  `).get() as { totalEvents: number; uniqueSessions: number };

  const eventsByType = db.prepare(`
    SELECT event_type, COUNT(*) as count
    FROM user_events
    GROUP BY event_type
    ORDER BY count DESC
  `).all() as { event_type: string; count: number }[];

  const avgOnboarding = db.prepare(`
    SELECT AVG(json_extract(properties, '$.duration_ms')) as avg_ms
    FROM user_events
    WHERE event_type = 'onboarding_complete'
  `).get() as { avg_ms: number | null };

  const avgStation = db.prepare(`
    SELECT AVG(json_extract(properties, '$.duration_ms')) as avg_ms
    FROM user_events
    WHERE event_type = 'station_complete'
  `).get() as { avg_ms: number | null };

  const journeyPop = db.prepare(`
    SELECT json_extract(properties, '$.journey_type') as journey_type, COUNT(*) as count
    FROM user_events
    WHERE event_type = 'journey_select'
    GROUP BY journey_type
    ORDER BY count DESC
  `).all() as { journey_type: string; count: number }[];

  const topPaths = db.prepare(`
    SELECT
      json_extract(properties, '$.from_view') as from_view,
      json_extract(properties, '$.to_view') as to_view,
      COUNT(*) as count
    FROM user_events
    WHERE event_type = 'page_view'
    GROUP BY from_view, to_view
    ORDER BY count DESC
    LIMIT 20
  `).all() as { from_view: string; to_view: string; count: number }[];

  // Conversion funnel
  const funnelSteps = [
    { label: 'Landing', query: `SELECT COUNT(DISTINCT browser_session_id) as c FROM user_events WHERE event_type = 'page_view' AND json_extract(properties, '$.to_view') = 'landing'` },
    { label: 'Onboarding Start', query: `SELECT COUNT(DISTINCT browser_session_id) as c FROM user_events WHERE event_type = 'onboarding_start'` },
    { label: 'Onboarding Complete', query: `SELECT COUNT(DISTINCT browser_session_id) as c FROM user_events WHERE event_type = 'onboarding_complete'` },
    { label: 'Journey Select', query: `SELECT COUNT(DISTINCT browser_session_id) as c FROM user_events WHERE event_type = 'journey_select'` },
    { label: 'Station Start', query: `SELECT COUNT(DISTINCT browser_session_id) as c FROM user_events WHERE event_type = 'station_start'` },
    { label: 'Station Complete', query: `SELECT COUNT(DISTINCT browser_session_id) as c FROM user_events WHERE event_type = 'station_complete'` },
    { label: 'Profile View', query: `SELECT COUNT(DISTINCT browser_session_id) as c FROM user_events WHERE event_type = 'profile_view'` },
  ];

  const conversionFunnel = funnelSteps.map((step, i) => {
    const row = db.prepare(step.query).get() as { c: number };
    const count = row.c || 0;
    const prevCount = i === 0 ? count : (db.prepare(funnelSteps[i - 1].query).get() as { c: number }).c || 0;
    const dropoff = prevCount > 0 ? Math.round((1 - count / prevCount) * 100) : 0;
    return { label: step.label, count, dropoff_percent: i === 0 ? 0 : dropoff };
  });

  const eventsByTypeMap: Record<string, number> = {};
  for (const r of eventsByType) eventsByTypeMap[r.event_type] = r.count;

  const journeyPopMap: Record<string, number> = {};
  for (const r of journeyPop) journeyPopMap[r.journey_type] = r.count;

  return res.json({
    totalEvents: totals.totalEvents || 0,
    uniqueSessions: totals.uniqueSessions || 0,
    avgOnboardingDurationMs: Math.round(avgOnboarding.avg_ms || 0),
    avgStationDurationMs: Math.round(avgStation.avg_ms || 0),
    eventsByType: eventsByTypeMap,
    conversionFunnel,
    journeyPopularity: journeyPopMap,
    topPaths,
  });
});

// GET /api/analytics/sessions/:id — full clickstream for one session
router.get('/sessions/:id', (req, res) => {
  const db = getDB();
  const rows = db.prepare(
    'SELECT * FROM user_events WHERE browser_session_id = ? ORDER BY timestamp ASC'
  ).all(req.params.id);
  return res.json(rows);
});

// GET /api/analytics/export-csv
router.get('/export-csv', (_req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM user_events ORDER BY timestamp DESC').all() as UserEventRow[];

  if (!rows.length) {
    return res.type('text/csv').send('');
  }

  const headers = ['id', 'event_type', 'browser_session_id', 'prompt_session_id', 'timestamp', 'properties'];

  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csvRows = rows.map((row) =>
    headers.map((h) => escape((row as unknown as Record<string, unknown>)[h])).join(',')
  );

  res.setHeader('Content-Disposition', 'attachment; filename=analytics-events.csv');
  return res.type('text/csv').send([headers.join(','), ...csvRows].join('\n'));
});

// DELETE /api/analytics/events
router.delete('/events', (_req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM user_events').run();
  return res.json({ ok: true });
});

export default router;
