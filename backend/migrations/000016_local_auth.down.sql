-- Revert: remove password_hash and restore firebase_uid NOT NULL
DELETE FROM users WHERE firebase_uid IS NULL;
ALTER TABLE users ALTER COLUMN firebase_uid SET NOT NULL;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
