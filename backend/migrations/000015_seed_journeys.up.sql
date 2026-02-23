-- Seed: Journey definitions
INSERT INTO journey_definitions (id, journey_type, name, description, stations) VALUES
('vuca-journey', 'vuca', 'Reise nach VUCA', 'Tauche ein in lebendige Orte und erlebe, wie du mit Veraenderung, Unsicherheit und neuen Situationen umgehst.', '["station-v1","station-u1","station-c1","station-a1","station-v2","station-u2","station-c2","station-a2","station-v3","station-u3","station-c3","station-a3","station-v4","station-u4","station-c4","station-a4"]'),
('entrepreneur-journey', 'entrepreneur', 'Gruender-Werkstatt', 'Entwickle eigene Ideen, teste sie an der Realitaet und lerne, was es heisst, etwas Neues zu schaffen.', '["ent-station-1","ent-station-2","ent-station-3","ent-station-4"]'),
('self-learning-journey', 'self-learning', 'Lern-Labor', 'Entdecke Lerntechniken und wende sie direkt auf deine eigenen Interessen an.', '["sl-station-1","sl-station-2","sl-station-3","sl-station-4"]');

-- Seed: VUCA station definitions (16 stations — 4 per dimension)
INSERT INTO station_definitions (id, journey_id, name, description, vuca_dimension, order_index) VALUES
('station-v1', 'vuca-journey', 'Wandel erkennen', 'Erkenne Veränderungen in deiner Umgebung', 'volatility', 1),
('station-v2', 'vuca-journey', 'Wandel gestalten', 'Gestalte aktiv Veränderungsprozesse', 'volatility', 2),
('station-v3', 'vuca-journey', 'Wandel reflektieren', 'Reflektiere über deine Erfahrungen mit Wandel', 'volatility', 3),
('station-v4', 'vuca-journey', 'Wandel meistern', 'Meistere die Herausforderungen des Wandels', 'volatility', 4),
('station-u1', 'vuca-journey', 'Unsicherheit wahrnehmen', 'Nimm Unsicherheiten in deinem Alltag wahr', 'uncertainty', 5),
('station-u2', 'vuca-journey', 'Unsicherheit aushalten', 'Lerne mit Unsicherheit umzugehen', 'uncertainty', 6),
('station-u3', 'vuca-journey', 'Unsicherheit nutzen', 'Nutze Unsicherheit als Chance', 'uncertainty', 7),
('station-u4', 'vuca-journey', 'Unsicherheit meistern', 'Meistere unsichere Situationen souverän', 'uncertainty', 8),
('station-c1', 'vuca-journey', 'Komplexität verstehen', 'Verstehe komplexe Zusammenhänge', 'complexity', 9),
('station-c2', 'vuca-journey', 'Komplexität ordnen', 'Bringe Ordnung in komplexe Situationen', 'complexity', 10),
('station-c3', 'vuca-journey', 'Komplexität lösen', 'Entwickle Lösungen für komplexe Probleme', 'complexity', 11),
('station-c4', 'vuca-journey', 'Komplexität meistern', 'Werde zum Meister komplexer Herausforderungen', 'complexity', 12),
('station-a1', 'vuca-journey', 'Mehrdeutigkeit erkennen', 'Erkenne mehrdeutige Situationen', 'ambiguity', 13),
('station-a2', 'vuca-journey', 'Mehrdeutigkeit akzeptieren', 'Akzeptiere dass es nicht immer eine richtige Antwort gibt', 'ambiguity', 14),
('station-a3', 'vuca-journey', 'Mehrdeutigkeit navigieren', 'Navigiere durch mehrdeutige Situationen', 'ambiguity', 15),
('station-a4', 'vuca-journey', 'Mehrdeutigkeit meistern', 'Meistere die Kunst der Mehrdeutigkeit', 'ambiguity', 16);
