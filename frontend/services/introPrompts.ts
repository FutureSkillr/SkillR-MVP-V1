import type { CoachPersona } from '../types/intro';

export function buildSmalltalkPrompt(coach: CoachPersona): string {
  return `${coach.systemPromptFragment}

AUFGABE: Fuehre 5 lockere Smalltalk-Fragen mit einem Jugendlichen (14+).

REGELN:
- Jede deiner Nachrichten: 2-3 Saetze + EINE Frage
- Reagiere auf die Antworten des Users — sei spontan, nicht roboterhaft
- Bleib in deiner Persona als ${coach.name}
- KEIN "was willst du mal werden?", keine Berufsberatung
- Frag nach: Was macht Spass? Was nervt? Was ist gerade angesagt? Was wuerdest du aendern?
- Zaehle intern deine Fragen mit (Frage 1 von 5, etc.)
- Bei deiner 5. Nachricht MUSST du am Ende den Marker [SMALLTALK_DONE] einfuegen
- Starte direkt mit deiner ersten Frage — stell dich dabei kurz vor

WICHTIG: Der Marker [SMALLTALK_DONE] darf NUR in deiner 5. Nachricht vorkommen, nicht frueher.`;
}

// M7: Sanitize interests before interpolation into prompt
function sanitizeInterest(s: string): string {
  return s.replace(/[^a-zA-ZäöüÄÖÜß\s0-9-]/g, '').trim().slice(0, 50);
}

export function buildDemoPrompt(coach: CoachPersona, interests: string[]): string {
  const sanitized = interests.map(sanitizeInterest).filter((s) => s.length > 0);
  const interestList = sanitized.length > 0 ? sanitized.join(', ') : 'verschiedene Themen';

  return `${coach.systemPromptFragment}

AUFGABE: Fuehre eine Mini-Lern-Sequenz basierend auf den Interessen des Users durch: ${interestList}

REGELN:
- Erklaere eine Denk- oder Kreativtechnik die zu den Interessen passt (z.B. Mind-Mapping, Perspektivwechsel, Design Thinking Basics, 5-Why-Methode)
- Lass den User die Technik SOFORT in 1 Schritt ausprobieren (z.B. "Schreib mir 3 Ideen zu...")
- Gib Feedback auf die Antwort und erklaere was der User gerade gelernt hat
- Beende mit dem Marker [DEMO_COMPLETE]
- Maximal 4 Nachrichten von dir insgesamt
- Erwaehne den verdienten Skill-Punkt ("Du hast gerade deinen ersten Skill-Punkt verdient!")
- Bleib in deiner Persona als ${coach.name}

WICHTIG: Der Marker [DEMO_COMPLETE] darf NUR in deiner letzten Nachricht vorkommen.`;
}

export function extractInterestsFromChat(messages: { role: string; content: string }[]): string[] {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase());

  const allText = userMessages.join(' ');

  const keywords: string[] = [];
  const interestPatterns = [
    /(?:mag|liebe?|feier[en]?|gern[e]?|spass|cool|interessier|begeister)[^.!?]*?(\b\w{4,}\b)/gi,
    /(?:musik|gaming|sport|kochen|kunst|technik|natur|tiere|filme|serien|lesen|schreiben|tanzen|programmier|youtube|tiktok|handwerk|design|foto)/gi,
  ];

  for (const pattern of interestPatterns) {
    const matches = allText.match(pattern);
    if (matches) {
      keywords.push(...matches.map((m) => m.trim()));
    }
  }

  // Deduplicate, sanitize, and take top 5
  const sanitize = (s: string) =>
    s.replace(/[^a-zA-ZäöüÄÖÜß\s0-9-]/g, '').trim().slice(0, 50);
  const unique = [...new Set(keywords)]
    .map(sanitize)
    .filter((s) => s.length > 0)
    .slice(0, 5);
  return unique.length > 0 ? unique : ['Kreativitaet', 'Neues entdecken'];
}
