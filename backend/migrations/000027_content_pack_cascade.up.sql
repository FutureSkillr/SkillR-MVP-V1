-- FR-124: Add foreign key with CASCADE on content_pack_lernreisen.pack_id
-- brand_content_packs.pack_id already has ON DELETE CASCADE (migration 000025).
ALTER TABLE content_pack_lernreisen
    ADD CONSTRAINT fk_lernreisen_pack_id
    FOREIGN KEY (pack_id) REFERENCES content_packs(id) ON DELETE CASCADE;
