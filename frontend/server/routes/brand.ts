import { Router } from 'express';
import { getDB } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/brand/:slug — public, returns BrandConfig for a partner
router.get('/:slug', (req, res) => {
  const db = getDB();
  const row = db.prepare(
    'SELECT config FROM brand_configs WHERE slug = ? AND is_active = 1'
  ).get(req.params.slug) as { config: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Brand not found', code: 'NOT_FOUND' });
    return;
  }

  try {
    const config = JSON.parse(row.config);
    res.json(config);
  } catch {
    res.status(500).json({ error: 'Invalid brand config', code: 'INTERNAL' });
  }
});

// GET /api/brand — admin only, lists all brand configs
router.get('/', requireAuth, requireAdmin, (_req, res) => {
  const db = getDB();
  const rows = db.prepare(
    'SELECT slug, config, is_active, created_at, updated_at, updated_by FROM brand_configs ORDER BY created_at DESC'
  ).all() as { slug: string; config: string; is_active: number; created_at: number; updated_at: number; updated_by: string | null }[];

  const brands = rows.map((r) => ({
    slug: r.slug,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
    ...JSON.parse(r.config),
  }));

  res.json(brands);
});

// POST /api/brand — admin only, creates new partner brand
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { slug, ...config } = req.body;

  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    res.status(400).json({ error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.', code: 'INVALID_SLUG' });
    return;
  }

  const db = getDB();
  const existing = db.prepare('SELECT slug FROM brand_configs WHERE slug = ?').get(slug);
  if (existing) {
    res.status(409).json({ error: 'Brand slug already exists', code: 'CONFLICT' });
    return;
  }

  const now = Date.now();
  db.prepare(
    'INSERT INTO brand_configs (slug, config, is_active, created_at, updated_at, updated_by) VALUES (?, ?, 1, ?, ?, ?)'
  ).run(slug, JSON.stringify({ slug, ...config }), now, now, req.user?.email || null);

  res.status(201).json({ slug, created: true });
});

// PUT /api/brand/:slug — admin or sponsor_admin, updates brand config
router.put('/:slug', requireAuth, (req, res) => {
  const db = getDB();
  const { slug } = req.params;

  const existing = db.prepare('SELECT slug FROM brand_configs WHERE slug = ?').get(slug);
  if (!existing) {
    res.status(404).json({ error: 'Brand not found', code: 'NOT_FOUND' });
    return;
  }

  // Allow admin or sponsor_admin role
  if (req.user?.role !== 'admin' && req.user?.role !== 'sponsor_admin') {
    res.status(403).json({ error: 'Admin or sponsor_admin access required', code: 'FORBIDDEN' });
    return;
  }

  const config = req.body;
  const now = Date.now();
  db.prepare(
    'UPDATE brand_configs SET config = ?, updated_at = ?, updated_by = ? WHERE slug = ?'
  ).run(JSON.stringify({ slug, ...config }), now, req.user?.email || null, slug);

  res.json({ slug, updated: true });
});

// DELETE /api/brand/:slug — admin only, deactivates a brand
router.delete('/:slug', requireAuth, requireAdmin, (req, res) => {
  const db = getDB();
  const { slug } = req.params;

  const existing = db.prepare('SELECT slug FROM brand_configs WHERE slug = ?').get(slug);
  if (!existing) {
    res.status(404).json({ error: 'Brand not found', code: 'NOT_FOUND' });
    return;
  }

  const now = Date.now();
  db.prepare(
    'UPDATE brand_configs SET is_active = 0, updated_at = ?, updated_by = ? WHERE slug = ?'
  ).run(now, req.user?.email || null, slug);

  res.json({ slug, deactivated: true });
});

export default router;
