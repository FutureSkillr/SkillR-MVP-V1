import type { LernreiseDefinition } from '../types/journey';

/** Default content pack: 10 concrete Lernreisen at real-world locations. */
export const DEFAULT_LERNREISEN: LernreiseDefinition[] = [
  {
    id: 'lr-loeten',
    title: 'Loeten',
    subtitle: 'Verbinde, was zusammengehoert',
    description:
      'In einer Elektronikwerkstatt in Nuernberg lernst du, wie man Bauteile verbindet und eigene Schaltungen baut. Deine Ideen werden zu echten Prototypen.',
    icon: '🔌',
    journeyType: 'entrepreneur',
    location: 'Nuernberg',
    lat: 49.45,
    lng: 11.08,
    setting:
      'Eine lebhafte Elektronikwerkstatt in der Nuernberger Altstadt, voller Loetkolben, Platinen und blinkender LEDs.',
    character:
      'Meister Huber — ein geduldiger Elektroniker mit ruhiger Hand und trockenem Humor, der seit 30 Jahren Lehrlinge begeistert.',
    dimensions: ['creativity', 'initiative'],
  },
  {
    id: 'lr-lachs-angeln',
    title: 'Lachs angeln',
    subtitle: 'Geduld zahlt sich aus',
    description:
      'Am eiskalten Fjord in Tromsoe lernst du, wie man mit Respekt vor der Natur Lachse faengt. Hier zaehlt Geduld mehr als Kraft.',
    icon: '🐟',
    journeyType: 'vuca',
    location: 'Tromsoe',
    lat: 69.65,
    lng: 18.96,
    setting:
      'Ein verschneiter Fjord noerdlich des Polarkreises, mit klarem Wasser und Nordlicht am Himmel.',
    character:
      'Ingrid — eine erfahrene Fischerin mit wettergegerbtem Gesicht, die dir zeigt, wie man die Natur liest.',
    dimensions: ['resilience', 'adaptability'],
  },
  {
    id: 'lr-baeume-faellen',
    title: 'Baeume faellen',
    subtitle: 'Der Wald braucht Pflege',
    description:
      'Im Schwarzwald lernst du, warum Baeume gefaellt werden muessen und wie nachhaltiger Waldbau funktioniert. Koerpereinsatz inklusive.',
    icon: '🌲',
    journeyType: 'vuca',
    location: 'Schwarzwald',
    lat: 48.0,
    lng: 8.15,
    setting:
      'Ein dichter Tannenwald im Schwarzwald, mit moosigen Pfaden, Vogelgesang und dem Geruch von frischem Holz.',
    character:
      'Foerster Braun — ein baeriger Naturschuetzer, der jeden Baum beim Namen kennt und den Wald wie seine Westentasche.',
    dimensions: ['resilience', 'complexity'],
  },
  {
    id: 'lr-gold-finden',
    title: 'Gold finden',
    subtitle: 'Das Glueck liegt im Fluss',
    description:
      'Am legendaeren Klondike in Dawson City waescht du Gold wie die Pioniere. Wer genau hinschaut, findet mehr als Nuggets.',
    icon: '💎',
    journeyType: 'entrepreneur',
    location: 'Dawson City',
    lat: 64.06,
    lng: -139.43,
    setting:
      'Ein historisches Goldgraeberlager am Yukon-Fluss, mit Holzhuetten, rostigen Werkzeugen und endloser Wildnis.',
    character:
      'Old Pete — ein schrulliger Goldsucher mit langem Bart, der Geschichten vom Goldrausch erzaehlt.',
    dimensions: ['initiative', 'risk-taking'],
  },
  {
    id: 'lr-boot-bauen',
    title: 'Boot bauen',
    subtitle: 'Handwerk trifft Wind und Wellen',
    description:
      'In einer Werft an der Flensburger Foerde baust du dein eigenes kleines Segelboot. Vom Kiel bis zum Mast — alles selbst gemacht.',
    icon: '⛵',
    journeyType: 'entrepreneur',
    location: 'Flensburg',
    lat: 54.79,
    lng: 9.44,
    setting:
      'Eine traditionelle Holzbootwerft an der Flensburger Foerde, mit Saegespaenen, Lack-Geruch und Moewen im Wind.',
    character:
      'Kapitaenin Svea — eine junge Bootsbauerin, die Tradition mit modernem Design verbindet.',
    dimensions: ['creativity', 'initiative', 'risk-taking'],
  },
  {
    id: 'lr-kleider-naehen',
    title: 'Kleider naehen',
    subtitle: 'Dein Stil, dein Stoff, dein Design',
    description:
      'In einem Atelier in Florenz entwirfst du Mode und naehst dein erstes eigenes Kleidungsstueck. Fashion trifft Handwerk.',
    icon: '🧵',
    journeyType: 'self-learning',
    location: 'Florenz',
    lat: 43.77,
    lng: 11.25,
    setting:
      'Ein sonnendurchflutetes Mode-Atelier im Herzen von Florenz, mit Stoffrollen, Schneiderpuppen und italienischer Musik.',
    character:
      'Signora Bianchi — eine elegante Schneiderin, die dir zeigt, dass Mode eine Sprache ist.',
    dimensions: ['self-direction', 'reflection'],
  },
  {
    id: 'lr-rehkitz-pflegen',
    title: 'Rehkitz pflegen',
    subtitle: 'Verantwortung fuer die Kleinsten',
    description:
      'Im Bayerischen Wald pflegst du verwaiste Rehkitze und lernst, was Tiere wirklich brauchen. Ein Job, der Herz erfordert.',
    icon: '🦌',
    journeyType: 'self-learning',
    location: 'Bayerischer Wald',
    lat: 48.9,
    lng: 13.4,
    setting:
      'Eine Wildtier-Auffangstation am Rand des Bayerischen Waldes, mit Gehegen, Strohballen und scheuen Waldtieren.',
    character:
      'Tieraerztin Lena — eine warmherzige Veterinaeraerztin, die jedes Tier wie einen Patienten behandelt.',
    dimensions: ['reflection', 'self-direction', 'curiosity'],
  },
  {
    id: 'lr-schneemobil-fahren',
    title: 'Schneemobil fahren',
    subtitle: 'Vollgas durch die Arktis',
    description:
      'In Rovaniemi rast du mit dem Schneemobil durch die finnische Wildnis. Orientierung, Reaktion und Respekt vor der Kaelte sind gefragt.',
    icon: '❄️',
    journeyType: 'vuca',
    location: 'Rovaniemi',
    lat: 66.5,
    lng: 25.73,
    setting:
      'Eine verschneite Ebene in Lappland, mit Rentieren, Polarlichtern und minus 20 Grad.',
    character:
      'Mikko — ein finnischer Guide, der selbst bei Eiskaelte lacht und dir zeigt, wie man sicher faehrt.',
    dimensions: ['adaptability', 'uncertainty'],
  },
  {
    id: 'lr-einbaum-segeln',
    title: 'Einbaum segeln',
    subtitle: 'Navigieren ohne GPS',
    description:
      'Auf Samoa lernst du, wie Polynesier seit Jahrhunderten mit Sternen und Wellen navigieren. Ein Einbaum, das Meer und du.',
    icon: '🛶',
    journeyType: 'vuca',
    location: 'Samoa',
    lat: -13.83,
    lng: -171.76,
    setting:
      'Ein tuerkisfarbener Strand auf Samoa, mit Palmen, warmem Wind und einem handgeschnitzten Einbaum am Ufer.',
    character:
      'Tui — ein polynesischer Navigator, der dir zeigt, wie man das Meer als Karte liest.',
    dimensions: ['complexity', 'uncertainty', 'adaptability'],
  },
  {
    id: 'lr-wildpferde-reiten',
    title: 'Wildpferde reiten',
    subtitle: 'Freiheit in der Steppe',
    description:
      'In der mongolischen Steppe lernst du, wie Nomaden mit Wildpferden leben. Kein Sattel, kein Zaun — nur du und das Pferd.',
    icon: '🐴',
    journeyType: 'self-learning',
    location: 'Mongolei',
    lat: 47.92,
    lng: 106.91,
    setting:
      'Eine endlose gruene Steppe unter blauem Himmel, mit Jurten am Horizont und einer Herde wilder Pferde.',
    character:
      'Bataar — ein junger mongolischer Nomade, der seit seiner Kindheit reitet und die Steppe liebt.',
    dimensions: ['curiosity', 'self-direction', 'reflection'],
  },
];
