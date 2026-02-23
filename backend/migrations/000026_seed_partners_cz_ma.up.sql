-- FR-123: Seed content packs and brand configs for Carls Zukunft + maindset.ACADEMY

-- Pack 004 — Zukunftsdenken (Carls Zukunft)
INSERT INTO content_packs (id, name, description, sponsor, default_enabled)
VALUES ('004', 'Zukunftsdenken',
        'Drei Lernreisen rund um Zukunftsforschung: Szenarien entwickeln, KI verstehen und Ideen pitchen.',
        'Carls Zukunft',
        TRUE)
ON CONFLICT (id) DO NOTHING;

-- Pack 005 — KI-gestuetztes Lernen (maindset.ACADEMY)
INSERT INTO content_packs (id, name, description, sponsor, default_enabled)
VALUES ('005', 'KI-gestuetztes Lernen',
        'Drei Lernreisen rund um die Zukunft des Lernens: KI-Lernbegleiter bauen, Wissen vernetzen und die Schule von morgen entwerfen.',
        'maindset.ACADEMY',
        TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3 Lernreisen for pack 004 (Carls Zukunft)
INSERT INTO content_pack_lernreisen
    (id, title, subtitle, description, icon, journey_type, location, lat, lng, setting, character_name, character_desc, dimensions, sort_order, pack_id)
VALUES
  ('lr-zukunftswerkstatt', 'Zukunftswerkstatt', 'Gestalte die Welt von morgen',
   'Im Zukunftsinstitut in Leipzig lernst du, wie Zukunftsforscher denken. Du entwickelst Szenarien, hinterfragst Trends und entwirfst deine eigene Vision fuer 2040.',
   '🔮', 'vuca', 'Leipzig', 51.34, 12.37,
   'Ein lichtdurchfluteter Co-Working-Space in der Leipziger Baumwollspinnerei, mit Whiteboards voller Zukunftsszenarien, Post-its in allen Farben und einem Podcast-Studio nebenan.',
   'Michael', 'Ein neugieriger Zukunftsforscher mit ansteckender Begeisterung, der seit 20 Jahren Unternehmen und junge Menschen auf die Welt von morgen vorbereitet.',
   '["complexity","uncertainty"]', 14, '004'),

  ('lr-ki-navigator', 'KI-Navigator', 'Kuenstliche Intelligenz verstehen',
   'Im carl.institut erkundest du, wie kuenstliche Intelligenz unseren Alltag veraendert — von Chatbots ueber selbstfahrende Autos bis zu kreativer KI. Du baust deinen eigenen Mini-Agenten.',
   '🤖', 'entrepreneur', 'Leipzig', 51.33, 12.38,
   'Ein modernes Seminarhaus in Leipzig-Lindenau, mit grossen Bildschirmen, auf denen KI-Demos laufen, und einem Tisch voller Prototypen und Sensoren.',
   'Raphael', 'Ein kommunikativer Technik-Erklaerer, der komplizierte KI-Konzepte mit einfachen Geschichten und Live-Demos zum Leben erweckt.',
   '["creativity","initiative"]', 15, '004'),

  ('lr-elephant-festival', 'Elephant Festival', 'Ideen, die die Welt veraendern',
   'Auf dem Zukunftsfestival in Leipzig triffst du Gruender, Forscher und Visionaere. Du pitchst deine eigene Idee fuer eine nachhaltige Zukunft — und bekommst echtes Feedback.',
   '🐘', 'self-learning', 'Leipzig', 51.34, 12.39,
   'Ein Open-Air-Festivalgelaende mit Buehnen, Food-Trucks und bunten Zelten, in denen Workshops, Talks und Pitch-Sessions stattfinden. Ueberall wird diskutiert und gezeichnet.',
   'Luise', 'Eine energiegeladene Community-Managerin, die jeden mit jedem vernetzt und dafuer sorgt, dass aus Ideen echte Projekte werden.',
   '["curiosity","self-direction","reflection"]', 16, '004')
ON CONFLICT (id) DO NOTHING;

-- 3 Lernreisen for pack 005 (maindset.ACADEMY)
INSERT INTO content_pack_lernreisen
    (id, title, subtitle, description, icon, journey_type, location, lat, lng, setting, character_name, character_desc, dimensions, sort_order, pack_id)
VALUES
  ('lr-lernmaschine', 'Deine Lernmaschine', 'Baue deinen KI-Lernbegleiter',
   'In der maindset.ACADEMY entdeckst du, wie KI-gestuetzte Lernbegleiter funktionieren. Du trainierst deinen eigenen digitalen Assistenten und testest, wie er dir beim Lernen hilft.',
   '🧠', 'entrepreneur', 'Berlin', 52.52, 13.41,
   'Ein futuristisches Lernlabor mit interaktiven Bildschirmen, Sprachassistenten und einer KI, die auf deine Stimme reagiert. An den Waenden leuchten Wissensgraphen.',
   'Ada', 'Eine junge KI-Entwicklerin, die dir zeigt, wie man Maschinen das Lernen beibringt — und dabei selbst noch jeden Tag Neues entdeckt.',
   '["creativity","initiative"]', 17, '005'),

  ('lr-wissen-vernetzen', 'Wissen vernetzen', 'Verbinde, was zusammengehoert',
   'Lerne, wie du Wissen aus verschiedenen Quellen verbindest und dein eigenes Wissensnetzwerk aufbaust. Von Notizen ueber Podcasts bis zu KI-Zusammenfassungen — alles wird vernetzt.',
   '🕸️', 'self-learning', 'Hamburg', 53.55, 9.99,
   'Eine moderne Bibliothek mit digitalen Tischen, auf denen Wissensgraphen wachsen. Buecher, Tablets und holographische Mindmaps stehen nebeneinander.',
   'Professor Liang', 'Ein ruhiger Wissensarchitekt, der dir zeigt, wie man aus Informationschaos klare Strukturen baut.',
   '["reflection","self-direction"]', 18, '005'),

  ('lr-zukunft-lernen', 'Zukunft des Lernens', 'Wie lernst du in 10 Jahren?',
   'Erkunde, wie Lernen in der Zukunft aussehen koennte — von VR-Klassenraeumen ueber KI-Tutoren bis zu Lern-Games. Du entwirfst deine eigene Schule der Zukunft.',
   '🎓', 'vuca', 'Muenchen', 48.14, 11.58,
   'Ein experimentelles Klassenzimmer der Zukunft, mit VR-Brillen, holographischen Tafeln und einem KI-Tutor, der auf jede Frage eine andere Antwort hat.',
   'Mira', 'Eine Bildungsinnovatorin, die Schulen neu denkt und fest daran glaubt, dass Lernen Spass machen muss.',
   '["adaptability","uncertainty"]', 19, '005')
ON CONFLICT (id) DO NOTHING;

-- Seed brand config: Carls Zukunft (UPSERT — ensure is_active even if previously deactivated)
INSERT INTO brand_configs (slug, config, is_active, created_at, updated_at, updated_by)
VALUES ('carls-zukunft',
        '{"slug":"carls-zukunft","brandName":"Carls Zukunft","brandNameShort":"CZ","tagline":"Hier ist der Raum fuer Zukunft","universeTitle":"Das Carls Zukunft Universum","contactEmail":"michael@carls-zukunft.de","copyrightHolder":"Carls Zukunft GmbH","logoUrl":"/icons/app-icon.png","appIconUrl":"/icons/app-icon.png","pageTitle":"Carls Zukunft - Hier ist der Raum fuer Zukunft","metaDescription":"Entdecke die Zukunft mit Carls Zukunft — Zukunftsforschung, KI-Kompetenz und nachhaltiges Denken fuer junge Entdecker.","theme":{"primaryColor":"#2d1b14","accentColor":"#e4553e"},"legal":{"companyName":"Carls Zukunft GmbH","companyAddress":"Diakonissenstrasse 1, 04177 Leipzig","companyCountry":"Deutschland","contactEmail":"michael@carls-zukunft.de","contactPhone":"+49 170 41 45 935","legalRepresentative":"Michael Carl","registerEntry":"HRB 39189, Amtsgericht Leipzig","vatId":"DE347682526","contentResponsible":"Michael Carl"},"aiCoachBrandName":"Carls Coach","sponsorLabel":"Powered by Carls Zukunft"}',
        TRUE, NOW(), NOW(), 'system-seed')
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, config = EXCLUDED.config, updated_at = NOW(), updated_by = 'system-seed';

-- Seed brand config: maindset.ACADEMY (UPSERT — ensure is_active even if previously deactivated)
INSERT INTO brand_configs (slug, config, is_active, created_at, updated_at, updated_by)
VALUES ('maindset-academy',
        '{"slug":"maindset-academy","brandName":"maindset.ACADEMY","brandNameShort":"MA","tagline":"Lerne mit Absicht — jeden Tag ein Stueck weiter","universeTitle":"Das maindset.ACADEMY Universum","contactEmail":"hello@maindset.academy","copyrightHolder":"maindset.ACADEMY","logoUrl":"/icons/app-icon.png","appIconUrl":"/icons/app-icon.png","pageTitle":"maindset.ACADEMY - Lerne mit Absicht","metaDescription":"Entdecke KI-gestuetztes Lernen mit maindset.ACADEMY — dein interaktiver Lernbegleiter fuer neue Skills und echtes Wissen.","theme":{"primaryColor":"#0f2b1e","accentColor":"#34d399"},"legal":{"companyName":"maindset.ACADEMY","companyAddress":"","companyCountry":"Deutschland","contactEmail":"hello@maindset.academy","contactPhone":"","legalRepresentative":"","registerEntry":"","vatId":"","contentResponsible":""},"aiCoachBrandName":"maindset Coach","sponsorLabel":"Powered by maindset.ACADEMY"}',
        TRUE, NOW(), NOW(), 'system-seed')
ON CONFLICT (slug) DO UPDATE SET is_active = TRUE, config = EXCLUDED.config, updated_at = NOW(), updated_by = 'system-seed';

-- Link pack 004 to Carls Zukunft
INSERT INTO brand_content_packs (brand_slug, pack_id, is_active, updated_by)
VALUES ('carls-zukunft', '004', TRUE, 'system-seed')
ON CONFLICT (brand_slug, pack_id) DO NOTHING;

-- Link pack 005 to maindset.ACADEMY
INSERT INTO brand_content_packs (brand_slug, pack_id, is_active, updated_by)
VALUES ('maindset-academy', '005', TRUE, 'system-seed')
ON CONFLICT (brand_slug, pack_id) DO NOTHING;
