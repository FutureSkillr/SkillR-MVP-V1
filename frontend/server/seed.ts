import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getDB } from './db.js';

export function seedDefaultAdmin(): void {
  const db = getDB();
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c > 0) return;

  const hash = bcrypt.hashSync('skillr', 10);
  db.prepare(`
    INSERT INTO users (id, email, display_name, role, auth_provider, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), 'admin', 'Admin', 'admin', 'email', hash, Date.now());

  console.log('[seed] Default admin user created (email=admin, password=skillr)');
}
