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

  // --- Pack 003: Abenteuer Weltraum (Space Service International) ---
  {
    id: 'lr-kosmonautentraining',
    title: 'Kosmonautentraining',
    subtitle: 'Einmal Weltraum und zurueck',
    description:
      'Im Raumfahrtmuseum Mittweida absolvierst du ein echtes Kosmonautentraining: Raketentechnik, Raumanzug anziehen und Weltraumnahrung probieren. Die DDR hatte ihren eigenen Weg ins All — und du erlebst ihn hautnah.',
    icon: '🚀',
    journeyType: 'vuca',
    location: 'Mittweida',
    lat: 50.99,
    lng: 12.98,
    setting:
      'Ein vollgestopftes Raumfahrtmuseum in Sachsen, mit Orlan-Raumanzuegen, Gagarin-Erinnerungsstuecken und dem Geruch von Weltraumnahrung. An der Wand haengen Fotos von Sigmund Jaehn, dem ersten Deutschen im All.',
    character:
      'Tasillo — ein leidenschaftlicher Raumfahrthistoriker mit Schnauzbart und leuchtendem Blick, der seit 1969 alles ueber Kosmonauten sammelt und mehr als 100.000 Objekte besitzt.',
    dimensions: ['resilience', 'adaptability'],
  },
  {
    id: 'lr-gagarins-spuren',
    title: 'Gagarins Spuren folgen',
    subtitle: 'Der erste Mensch im All',
    description:
      'Am legendaeren Weltraumbahnhof Baikonur folgst du den Spuren von Juri Gagarin. Du erfaehrst, wie ein einfacher Bauernsohn 1961 Geschichte schrieb — und warum sein Mut die ganze Welt veraenderte.',
    icon: '🌍',
    journeyType: 'entrepreneur',
    location: 'Baikonur',
    lat: 45.62,
    lng: 63.31,
    setting:
      'Die endlose kasachische Steppe, durchschnitten von Eisenbahnschienen, die zum groessten Weltraumbahnhof der Welt fuehren. Am Horizont ragt eine Sojus-Rakete in den blauen Himmel.',
    character:
      'Kosmonaut Nikolai — ein pensionierter Raketentechniker mit tiefer Stimme und ruhigen Haenden, der selbst Raketen fuer die Sojus-Missionen vorbereitet hat und Gagarins Geschichte aus erster Hand kennt.',
    dimensions: ['initiative', 'risk-taking'],
  },
  {
    id: 'lr-mission-mars',
    title: 'Mission Mars',
    subtitle: 'Deine Zukunft beginnt im All',
    description:
      'Im Kennedy Space Center planst du deine eigene Mars-Mission. Vom Raketendesign bis zur Marskolonie — du entwirfst, wie Menschen in Zukunft auf dem Roten Planeten leben koennten.',
    icon: '🔴',
    journeyType: 'self-learning',
    location: 'Cape Canaveral',
    lat: 28.39,
    lng: -80.6,
    setting:
      'Ein hochmodernes Raumfahrtzentrum an der Kueste Floridas, mit riesigen Montage-Hallen, einem Mars-Habitat-Simulator und Bildschirmen voller Missionsdaten.',
    character:
      'Dr. Stella — eine junge Luft- und Raumfahrtingenieurin, die an der naechsten Generation von Mars-Landern arbeitet und fest daran glaubt, dass die erste Person auf dem Mars schon heute zur Schule geht.',
    dimensions: ['creativity', 'curiosity'],
  },

  // --- Pack 004: Zukunftsdenken (Carls Zukunft) ---
  {
    id: 'lr-zukunftswerkstatt',
    title: 'Zukunftswerkstatt',
    subtitle: 'Gestalte die Welt von morgen',
    description:
      'Im Zukunftsinstitut in Leipzig lernst du, wie Zukunftsforscher denken. Du entwickelst Szenarien, hinterfragst Trends und entwirfst deine eigene Vision fuer 2040.',
    icon: '🔮',
    journeyType: 'vuca',
    location: 'Leipzig',
    lat: 51.34,
    lng: 12.37,
    setting:
      'Ein lichtdurchfluteter Co-Working-Space in der Leipziger Baumwollspinnerei, mit Whiteboards voller Zukunftsszenarien, Post-its in allen Farben und einem Podcast-Studio nebenan.',
    character:
      'Michael — ein neugieriger Zukunftsforscher mit ansteckender Begeisterung, der seit 20 Jahren Unternehmen und junge Menschen auf die Welt von morgen vorbereitet.',
    dimensions: ['complexity', 'uncertainty'],
  },
  {
    id: 'lr-ki-navigator',
    title: 'KI-Navigator',
    subtitle: 'Kuenstliche Intelligenz verstehen',
    description:
      'Im carl.institut erkundest du, wie kuenstliche Intelligenz unseren Alltag veraendert — von Chatbots ueber selbstfahrende Autos bis zu kreativer KI. Du baust deinen eigenen Mini-Agenten.',
    icon: '🤖',
    journeyType: 'entrepreneur',
    location: 'Leipzig',
    lat: 51.33,
    lng: 12.38,
    setting:
      'Ein modernes Seminarhaus in Leipzig-Lindenau, mit grossen Bildschirmen, auf denen KI-Demos laufen, und einem Tisch voller Prototypen und Sensoren.',
    character:
      'Raphael — ein kommunikativer Technik-Erklaerer, der komplizierte KI-Konzepte mit einfachen Geschichten und Live-Demos zum Leben erweckt.',
    dimensions: ['creativity', 'initiative'],
  },
  {
    id: 'lr-elephant-festival',
    title: 'Elephant Festival',
    subtitle: 'Ideen, die die Welt veraendern',
    description:
      'Auf dem Zukunftsfestival in Leipzig triffst du Gruender, Forscher und Visionaere. Du pitchst deine eigene Idee fuer eine nachhaltige Zukunft — und bekommst echtes Feedback.',
    icon: '🐘',
    journeyType: 'self-learning',
    location: 'Leipzig',
    lat: 51.34,
    lng: 12.39,
    setting:
      'Ein Open-Air-Festivalgelaende mit Buehnen, Food-Trucks und bunten Zelten, in denen Workshops, Talks und Pitch-Sessions stattfinden. Ueberall wird diskutiert und gezeichnet.',
    character:
      'Luise — eine energiegeladene Community-Managerin, die jeden mit jedem vernetzt und dafuer sorgt, dass aus Ideen echte Projekte werden.',
    dimensions: ['curiosity', 'self-direction', 'reflection'],
  },

  // --- Pack 005: KI-gestuetztes Lernen (maindset.ACADEMY) ---
  {
    id: 'lr-lernmaschine',
    title: 'Deine Lernmaschine',
    subtitle: 'Baue deinen KI-Lernbegleiter',
    description:
      'In der maindset.ACADEMY entdeckst du, wie KI-gestuetzte Lernbegleiter funktionieren. Du trainierst deinen eigenen digitalen Assistenten und testest, wie er dir beim Lernen hilft.',
    icon: '🧠',
    journeyType: 'entrepreneur',
    location: 'Berlin',
    lat: 52.52,
    lng: 13.41,
    setting:
      'Ein futuristisches Lernlabor mit interaktiven Bildschirmen, Sprachassistenten und einer KI, die auf deine Stimme reagiert. An den Waenden leuchten Wissensgraphen.',
    character:
      'Ada — eine junge KI-Entwicklerin, die dir zeigt, wie man Maschinen das Lernen beibringt — und dabei selbst noch jeden Tag Neues entdeckt.',
    dimensions: ['creativity', 'initiative'],
  },
  {
    id: 'lr-wissen-vernetzen',
    title: 'Wissen vernetzen',
    subtitle: 'Verbinde, was zusammengehoert',
    description:
      'Lerne, wie du Wissen aus verschiedenen Quellen verbindest und dein eigenes Wissensnetzwerk aufbaust. Von Notizen ueber Podcasts bis zu KI-Zusammenfassungen — alles wird vernetzt.',
    icon: '🕸️',
    journeyType: 'self-learning',
    location: 'Hamburg',
    lat: 53.55,
    lng: 9.99,
    setting:
      'Eine moderne Bibliothek mit digitalen Tischen, auf denen Wissensgraphen wachsen. Buecher, Tablets und holographische Mindmaps stehen nebeneinander.',
    character:
      'Professor Liang — ein ruhiger Wissensarchitekt, der dir zeigt, wie man aus Informationschaos klare Strukturen baut.',
    dimensions: ['reflection', 'self-direction'],
  },
  {
    id: 'lr-zukunft-lernen',
    title: 'Zukunft des Lernens',
    subtitle: 'Wie lernst du in 10 Jahren?',
    description:
      'Erkunde, wie Lernen in der Zukunft aussehen koennte — von VR-Klassenraeumen ueber KI-Tutoren bis zu Lern-Games. Du entwirfst deine eigene Schule der Zukunft.',
    icon: '🎓',
    journeyType: 'vuca',
    location: 'Muenchen',
    lat: 48.14,
    lng: 11.58,
    setting:
      'Ein experimentelles Klassenzimmer der Zukunft, mit VR-Brillen, holographischen Tafeln und einem KI-Tutor, der auf jede Frage eine andere Antwort hat.',
    character:
      'Mira — eine Bildungsinnovatorin, die Schulen neu denkt und fest daran glaubt, dass Lernen Spass machen muss.',
    dimensions: ['adaptability', 'uncertainty'],
  },
];
