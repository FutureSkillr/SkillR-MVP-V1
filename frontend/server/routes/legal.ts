import { Router } from 'express';
import { getDB } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

/** GET /api/config/legal — public, returns all business_config as key/value object */
router.get('/', (_req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT key, value FROM business_config').all() as { key: string; value: string }[];
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  res.set('Cache-Control', 'public, max-age=300'); // 5 min cache
  res.json(config);
});

/** PUT /api/config/legal — admin-only, upserts business_config rows */
router.put('/', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    res.status(400).json({ error: 'Expected a key/value object' });
    return;
  }

  const allowedKeys = [
    'company_name', 'company_address', 'company_country',
    'contact_email', 'contact_phone',
    'legal_representative', 'register_entry', 'vat_id',
    'content_responsible', 'content_responsible_address',
    'dpo_name', 'dpo_email',
  ];

  const upsert = db.prepare(`
    INSERT INTO business_config (key, value, updated_at, updated_by)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by
  `);

  const now = Date.now();
  const updatedBy = req.user?.email || 'unknown';

  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(data)) {
      if (!allowedKeys.includes(key)) continue;
      if (typeof value !== 'string') continue;
      upsert.run(key, value, now, updatedBy);
    }
  });

  transaction();
  res.json({ ok: true });
});

export default router;
