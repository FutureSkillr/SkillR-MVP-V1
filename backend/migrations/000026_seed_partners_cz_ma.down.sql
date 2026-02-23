-- Reverse FR-123: Remove Carls Zukunft + maindset.ACADEMY seed data

DELETE FROM brand_content_packs WHERE brand_slug IN ('carls-zukunft', 'maindset-academy');
DELETE FROM brand_configs WHERE slug IN ('carls-zukunft', 'maindset-academy');
DELETE FROM content_pack_lernreisen WHERE pack_id IN ('004', '005');
DELETE FROM content_packs WHERE id IN ('004', '005');
