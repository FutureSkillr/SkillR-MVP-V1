-- Revert FR-124: Remove foreign key on content_pack_lernreisen.pack_id
ALTER TABLE content_pack_lernreisen
    DROP CONSTRAINT IF EXISTS fk_lernreisen_pack_id;
