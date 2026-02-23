-- Content Packs metadata table
CREATE TABLE IF NOT EXISTS content_packs (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    sponsor         TEXT NOT NULL DEFAULT '',
    default_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add pack_id to Lernreisen (NULL = legacy, defaults to '001')
ALTER TABLE content_pack_lernreisen
    ADD COLUMN IF NOT EXISTS pack_id TEXT NOT NULL DEFAULT '001';

-- Seed pack 001 — the original default pack
INSERT INTO content_packs (id, name, description, default_enabled)
VALUES ('001', 'Default Pack', 'Die 10 Original-Lernreisen der Reise nach VUCA.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed pack 003 — Space History (Space Service International / DDR / UdSSR / Zukunft)
INSERT INTO content_packs (id, name, description, sponsor, default_enabled)
VALUES ('003', 'Abenteuer Weltraum',
        'Drei Lernreisen rund um Raumfahrtgeschichte: DDR-Kosmonautentraining, sowjetische Pioniere und die Zukunft im All. Inspiriert von Space Service International, Mittweida.',
        'Space Service International',
        TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3 Space Lernreisen for pack 003
INSERT INTO content_pack_lernreisen
    (id, title, subtitle, description, icon, journey_type, location, lat, lng, setting, character_name, character_desc, dimensions, sort_order, pack_id)
VALUES
  ('lr-kosmonautentraining', 'Kosmonautentraining', 'Einmal Weltraum und zurueck',
   'Im Raumfahrtmuseum Mittweida absolvierst du ein echtes Kosmonautentraining: Raketentechnik, Raumanzug anziehen und Weltraumnahrung probieren. Die DDR hatte ihren eigenen Weg ins All — und du erlebst ihn hautnah.',
   '🚀', 'vuca', 'Mittweida', 50.99, 12.98,
   'Ein vollgestopftes Raumfahrtmuseum in Sachsen, mit Orlan-Raumanzuegen, Gagarin-Erinnerungsstuecken und dem Geruch von Weltraumnahrung. An der Wand haengen Fotos von Sigmund Jaehn, dem ersten Deutschen im All.',
   'Tasillo', 'Ein leidenschaftlicher Raumfahrthistoriker mit Schnauzbart und leuchtendem Blick, der seit 1969 alles ueber Kosmonauten sammelt und mehr als 100.000 Objekte besitzt.',
   '["resilience","adaptability"]', 11, '003'),

  ('lr-gagarins-spuren', 'Gagarins Spuren folgen', 'Der erste Mensch im All',
   'Am legendaeren Weltraumbahnhof Baikonur folgst du den Spuren von Juri Gagarin. Du erfaehrst, wie ein einfacher Bauernsohn 1961 Geschichte schrieb — und warum sein Mut die ganze Welt veraenderte.',
   '🌍', 'entrepreneur', 'Baikonur', 45.62, 63.31,
   'Die endlose kasachische Steppe, durchschnitten von Eisenbahnschienen, die zum groessten Weltraumbahnhof der Welt fuehren. Am Horizont ragt eine Sojus-Rakete in den blauen Himmel.',
   'Kosmonaut Nikolai', 'Ein pensionierter Raketentechniker mit tiefer Stimme und ruhigen Haenden, der selbst Raketen fuer die Sojus-Missionen vorbereitet hat und Gagarins Geschichte aus erster Hand kennt.',
   '["initiative","risk-taking"]', 12, '003'),

  ('lr-mission-mars', 'Mission Mars', 'Deine Zukunft beginnt im All',
   'Im Kennedy Space Center planst du deine eigene Mars-Mission. Vom Raketendesign bis zur Marskolonie — du entwirfst, wie Menschen in Zukunft auf dem Roten Planeten leben koennten.',
   '🔴', 'self-learning', 'Cape Canaveral', 28.39, -80.60,
   'Ein hochmodernes Raumfahrtzentrum an der Kueste Floridas, mit riesigen Montage-Hallen, einem Mars-Habitat-Simulator und Bildschirmen voller Missionsdaten.',
   'Dr. Stella', 'Eine junge Luft- und Raumfahrtingenieurin, die an der naechsten Generation von Mars-Landern arbeitet und fest daran glaubt, dass die erste Person auf dem Mars schon heute zur Schule geht.',
   '["creativity","curiosity"]', 13, '003')
ON CONFLICT (id) DO NOTHING;
