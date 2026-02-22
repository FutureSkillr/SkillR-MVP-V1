-- Rollback MVP4: Solid Pod connection metadata
ALTER TABLE users DROP COLUMN IF EXISTS pod_sync_status;
ALTER TABLE users DROP COLUMN IF EXISTS pod_last_synced_at;
ALTER TABLE users DROP COLUMN IF EXISTS pod_connected_at;
ALTER TABLE users DROP COLUMN IF EXISTS pod_provider;
ALTER TABLE users DROP COLUMN IF EXISTS pod_webid;
ALTER TABLE users DROP COLUMN IF EXISTS pod_url;
