import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
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

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, displayName, password } = req.body;
  if (!email || !displayName || !password) {
    return res.status(400).json({ error: 'email, displayName, and password are required.' });
  }

  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Ein Konto mit dieser E-Mail existiert bereits.' });
  }

  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const role = count === 0 ? 'admin' : 'user';
  const hash = bcrypt.hashSync(password, 10);
  const id = randomUUID();
  const createdAt = Date.now();

  db.prepare(`
    INSERT INTO users (id, email, display_name, role, auth_provider, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, displayName, role, 'email', hash, createdAt);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  return res.json(toAuthUser(row));
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  const db = getDB();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!row) {
    return res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
  }

  if (!bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
  }

  return res.json(toAuthUser(row));
});

// POST /api/auth/login-provider
router.post('/login-provider', (req, res) => {
  const { provider } = req.body;
  if (!provider) {
    return res.status(400).json({ error: 'provider is required.' });
  }

  const providerNames: Record<string, string> = {
    google: 'Google',
    apple: 'Apple',
    facebook: 'Facebook',
    email: 'E-Mail',
  };

  const name = providerNames[provider] || provider;
  const fakeEmail = `${provider}-user-${Date.now()}@${provider}.local`;

  const db = getDB();
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const role = count === 0 ? 'admin' : 'user';
  const id = randomUUID();
  const createdAt = Date.now();

  db.prepare(`
    INSERT INTO users (id, email, display_name, role, auth_provider, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, fakeEmail, `${name}-Nutzer`, role, provider, '', createdAt);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  return res.json(toAuthUser(row));
});

export default router;
