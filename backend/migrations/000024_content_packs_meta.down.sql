DELETE FROM content_pack_lernreisen WHERE pack_id = '003';
ALTER TABLE content_pack_lernreisen DROP COLUMN IF EXISTS pack_id;
DROP TABLE IF EXISTS content_packs;
