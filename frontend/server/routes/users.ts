import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  role: string;
  auth_provider: string;
  photo_url: string | null;
  password_hash: string;
  created_at: number;
}

function toAuthUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    authProvider: row.auth_provider,
    photoURL: row.photo_url,
    createdAt: row.created_at,
  };
}

// GET /api/users
router.get('/', (_req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all() as UserRow[];
  return res.json(rows.map(toAuthUser));
});

// PATCH /api/users/:id/role
router.patch('/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Valid role (admin | user) is required.' });
  }

  const db = getDB();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  if (!row) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  return res.json({ ok: true });
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  }
  return res.json({ ok: true });
});

export default router;
