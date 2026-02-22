-- Rollback FR-072/FR-074/FR-075: Lernreise tracking tables

DROP TABLE IF EXISTS lernreise_progress;
DROP TABLE IF EXISTS lernreise_instances;
DROP INDEX IF EXISTS idx_users_honeycomb_ctx_id;
ALTER TABLE users DROP COLUMN IF EXISTS honeycomb_ctx_id;
