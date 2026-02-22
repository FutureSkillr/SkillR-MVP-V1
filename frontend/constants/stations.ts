import type { Station } from '../types/journey';

export const FIRST_STATIONS: Record<string, Station> = {
  vuca: {
    id: 'vuca-01',
    journeyType: 'vuca',
    title: 'Die Kueche von Rom',
    description: 'Du bist in einer kleinen Trattoria in Rom. Der Koch braucht dringend Hilfe — aber nichts laeuft nach Plan.',
    setting: 'Eine lebhafte Trattoria in Rom. Es ist Samstagabend, die Kueche ist voll, Toepfe dampfen, und ein wichtiger Kritiker hat sich angekuendigt. Du bist gerade als Aushilfe eingesprungen.',
    character: 'Marco, der leidenschaftliche Chefkoch. Er ist gestresst aber herzlich, wechselt zwischen Italienisch und Deutsch.',
    dimensions: ['change', 'uncertainty', 'complexity', 'ambiguity'],
    status: 'available',
  },
  entrepreneur: {
    id: 'entrepreneur-01',
    journeyType: 'entrepreneur',
    title: 'Die Schulhof-Challenge',
    description: 'Dein Schulhof hat ein Problem. Finde es, entwickle eine Loesung und teste sie.',
    setting: 'Dein Schulhof. Du hast eine Woche Zeit, eine Idee umzusetzen, die das Schulleben besser macht.',
    challenge: 'Identifiziere ein echtes Problem an deiner Schule und entwickle einen Prototyp fuer eine Loesung.',
    dimensions: ['creativity', 'initiative', 'resilience', 'value-creation'],
    status: 'available',
  },
  'self-learning': {
    id: 'self-learning-01',
    journeyType: 'self-learning',
    title: 'Die Feynman-Methode',
    description: 'Lerne die Feynman-Technik — erklaere komplizierte Dinge so einfach, dass ein Kind sie versteht.',
    setting: 'Ein virtuelles Lern-Labor, in dem du neue Techniken ausprobieren kannst.',
    technique: 'Feynman-Methode: 1. Waehle ein Thema. 2. Erklaere es wie fuer ein Kind. 3. Finde Luecken. 4. Vereinfache weiter.',
    dimensions: ['metacognition', 'transfer', 'curiosity', 'persistence', 'self-direction'],
    status: 'available',
  },
};
