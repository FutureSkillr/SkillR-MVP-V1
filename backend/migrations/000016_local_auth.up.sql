-- Allow local (non-Firebase) authentication.
-- Local users have firebase_uid = NULL and a bcrypt password_hash.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;
