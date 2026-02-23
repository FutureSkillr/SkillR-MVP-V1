CREATE TABLE IF NOT EXISTS content_pack_lernreisen (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    subtitle       TEXT NOT NULL,
    description    TEXT NOT NULL,
    icon           TEXT NOT NULL,
    journey_type   TEXT NOT NULL,
    location       TEXT NOT NULL,
    lat            DOUBLE PRECISION NOT NULL,
    lng            DOUBLE PRECISION NOT NULL,
    setting        TEXT NOT NULL,
    character_name TEXT NOT NULL,
    character_desc TEXT NOT NULL,
    dimensions     TEXT NOT NULL DEFAULT '[]',
    sort_order     INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the 10 default Lernreisen
INSERT INTO content_pack_lernreisen (id, title, subtitle, description, icon, journey_type, location, lat, lng, setting, character_name, character_desc, dimensions, sort_order)
VALUES
  ('lr-loeten', 'Loeten', 'Verbinde, was zusammengehoert',
   'In einer Elektronikwerkstatt in Nuernberg lernst du, wie man Bauteile verbindet und eigene Schaltungen baut. Deine Ideen werden zu echten Prototypen.',
   '🔌', 'entrepreneur', 'Nuernberg', 49.45, 11.08,
   'Eine lebhafte Elektronikwerkstatt in der Nuernberger Altstadt, voller Loetkolben, Platinen und blinkender LEDs.',
   'Meister Huber', 'Ein geduldiger Elektroniker mit ruhiger Hand und trockenem Humor, der seit 30 Jahren Lehrlinge begeistert.',
   '["creativity","initiative"]', 1),

  ('lr-lachs-angeln', 'Lachs angeln', 'Geduld zahlt sich aus',
   'Am eiskalten Fjord in Tromsoe lernst du, wie man mit Respekt vor der Natur Lachse faengt. Hier zaehlt Geduld mehr als Kraft.',
   '🐟', 'vuca', 'Tromsoe', 69.65, 18.96,
   'Ein verschneiter Fjord noerdlich des Polarkreises, mit klarem Wasser und Nordlicht am Himmel.',
   'Ingrid', 'Eine erfahrene Fischerin mit wettergegerbtem Gesicht, die dir zeigt, wie man die Natur liest.',
   '["resilience","adaptability"]', 2),

  ('lr-baeume-faellen', 'Baeume faellen', 'Der Wald braucht Pflege',
   'Im Schwarzwald lernst du, warum Baeume gefaellt werden muessen und wie nachhaltiger Waldbau funktioniert. Koerpereinsatz inklusive.',
   '🌲', 'vuca', 'Schwarzwald', 48.0, 8.15,
   'Ein dichter Tannenwald im Schwarzwald, mit moosigen Pfaden, Vogelgesang und dem Geruch von frischem Holz.',
   'Foerster Braun', 'Ein baeriger Naturschuetzer, der jeden Baum beim Namen kennt und den Wald wie seine Westentasche.',
   '["resilience","complexity"]', 3),

  ('lr-gold-finden', 'Gold finden', 'Das Glueck liegt im Fluss',
   'Am legendaeren Klondike in Dawson City waescht du Gold wie die Pioniere. Wer genau hinschaut, findet mehr als Nuggets.',
   '💎', 'entrepreneur', 'Dawson City', 64.06, -139.43,
   'Ein historisches Goldgraeberlager am Yukon-Fluss, mit Holzhuetten, rostigen Werkzeugen und endloser Wildnis.',
   'Old Pete', 'Ein schrulliger Goldsucher mit langem Bart, der Geschichten vom Goldrausch erzaehlt.',
   '["initiative","risk-taking"]', 4),

  ('lr-boot-bauen', 'Boot bauen', 'Handwerk trifft Wind und Wellen',
   'In einer Werft an der Flensburger Foerde baust du dein eigenes kleines Segelboot. Vom Kiel bis zum Mast — alles selbst gemacht.',
   '⛵', 'entrepreneur', 'Flensburg', 54.79, 9.44,
   'Eine traditionelle Holzbootwerft an der Flensburger Foerde, mit Saegespaenen, Lack-Geruch und Moewen im Wind.',
   'Kapitaenin Svea', 'Eine junge Bootsbauerin, die Tradition mit modernem Design verbindet.',
   '["creativity","initiative","risk-taking"]', 5),

  ('lr-kleider-naehen', 'Kleider naehen', 'Dein Stil, dein Stoff, dein Design',
   'In einem Atelier in Florenz entwirfst du Mode und naehst dein erstes eigenes Kleidungsstueck. Fashion trifft Handwerk.',
   '🧵', 'self-learning', 'Florenz', 43.77, 11.25,
   'Ein sonnendurchflutetes Mode-Atelier im Herzen von Florenz, mit Stoffrollen, Schneiderpuppen und italienischer Musik.',
   'Signora Bianchi', 'Eine elegante Schneiderin, die dir zeigt, dass Mode eine Sprache ist.',
   '["self-direction","reflection"]', 6),

  ('lr-rehkitz-pflegen', 'Rehkitz pflegen', 'Verantwortung fuer die Kleinsten',
   'Im Bayerischen Wald pflegst du verwaiste Rehkitze und lernst, was Tiere wirklich brauchen. Ein Job, der Herz erfordert.',
   '🦌', 'self-learning', 'Bayerischer Wald', 48.9, 13.4,
   'Eine Wildtier-Auffangstation am Rand des Bayerischen Waldes, mit Gehegen, Strohballen und scheuen Waldtieren.',
   'Tieraerztin Lena', 'Eine warmherzige Veterinaeraerztin, die jedes Tier wie einen Patienten behandelt.',
   '["reflection","self-direction","curiosity"]', 7),

  ('lr-schneemobil-fahren', 'Schneemobil fahren', 'Vollgas durch die Arktis',
   'In Rovaniemi rast du mit dem Schneemobil durch die finnische Wildnis. Orientierung, Reaktion und Respekt vor der Kaelte sind gefragt.',
   '❄️', 'vuca', 'Rovaniemi', 66.5, 25.73,
   'Eine verschneite Ebene in Lappland, mit Rentieren, Polarlichtern und minus 20 Grad.',
   'Mikko', 'Ein finnischer Guide, der selbst bei Eiskaelte lacht und dir zeigt, wie man sicher faehrt.',
   '["adaptability","uncertainty"]', 8),

  ('lr-einbaum-segeln', 'Einbaum segeln', 'Navigieren ohne GPS',
   'Auf Samoa lernst du, wie Polynesier seit Jahrhunderten mit Sternen und Wellen navigieren. Ein Einbaum, das Meer und du.',
   '🛶', 'vuca', 'Samoa', -13.83, -171.76,
   'Ein tuerkisfarbener Strand auf Samoa, mit Palmen, warmem Wind und einem handgeschnitzten Einbaum am Ufer.',
   'Tui', 'Ein polynesischer Navigator, der dir zeigt, wie man das Meer als Karte liest.',
   '["complexity","uncertainty","adaptability"]', 9),

  ('lr-wildpferde-reiten', 'Wildpferde reiten', 'Freiheit in der Steppe',
   'In der mongolischen Steppe lernst du, wie Nomaden mit Wildpferden leben. Kein Sattel, kein Zaun — nur du und das Pferd.',
   '🐴', 'self-learning', 'Mongolei', 47.92, 106.91,
   'Eine endlose gruene Steppe unter blauem Himmel, mit Jurten am Horizont und einer Herde wilder Pferde.',
   'Bataar', 'Ein junger mongolischer Nomade, der seit seiner Kindheit reitet und die Steppe liebt.',
   '["curiosity","self-direction","reflection"]', 10)
ON CONFLICT (id) DO NOTHING;
