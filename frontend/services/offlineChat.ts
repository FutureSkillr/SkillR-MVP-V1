/**
 * Offline chat engine — predefined conversation steps for when AI is unavailable.
 * Provides a smalltalk phase (5 steps) and a demo phase (3 steps),
 * each ending with a marker the IntroChat component can detect.
 */

const SMALLTALK_STEPS = [
  'Hey! Schoen, dass du da bist! Ich bin gerade im Offline-Modus, aber wir koennen trotzdem ein bisschen quatschen. Was interessiert dich so? Erzaehl mir von einem Hobby oder einer Sache, die dich begeistert!',
  'Cool, das klingt spannend! Weisst du, viele Leute entdecken durch ihre Hobbys ganz neue Faehigkeiten, die sie vorher gar nicht kannten. Was magst du daran am meisten — das Kreative, das Technische, oder eher den Kontakt mit anderen?',
  'Interessant! Und wenn du dir vorstellst, du koenntest einen ganzen Tag genau so verbringen, wie du willst — was wuerdest du machen? Denk ruhig gross!',
  'Das sagt schon viel ueber dich aus! Du bist jemand, der gerne neue Sachen ausprobiert und Dinge in die Hand nimmt. Gibt es etwas, das du schon immer mal lernen wolltest, aber noch nicht dazu gekommen bist?',
  'Super spannend! Ich merke, du hast total vielfaeltige Interessen. Lass uns als naechstes eine kleine Uebung machen, damit wir deine Staerken noch besser kennenlernen. [SMALLTALK_DONE]',
];

const DEMO_STEPS = [
  'Willkommen zur Mini-Uebung! Stell dir vor, du bist in einem Team und sollt zusammen ein Projekt planen. Was waere deine Lieblingsrolle — die Ideen entwickeln, das Team organisieren, oder die Umsetzung?',
  'Gute Wahl! Und jetzt die letzte Frage: Wenn du ein Problem loesen musst, gehst du eher Schritt fuer Schritt vor, oder probierst du kreativ verschiedene Wege aus?',
  'Perfekt! Damit habe ich schon einen richtig guten Eindruck von deinen Staerken bekommen. Du hast echtes Potenzial! Wenn du dich registrierst, koennen wir gemeinsam noch tiefer eintauchen. [DEMO_COMPLETE]',
];

export class OfflineChatEngine {
  private coachName: string;
  private smalltalkStep = 0;
  private demoStep = 0;
  private mode: 'smalltalk' | 'demo' = 'smalltalk';

  constructor(coachName: string) {
    this.coachName = coachName;
  }

  /** Get the opening message for smalltalk phase. */
  start(): string {
    this.mode = 'smalltalk';
    this.smalltalkStep = 0;
    const msg = SMALLTALK_STEPS[0].replace(/Ich bin/g, `Ich bin ${this.coachName} und bin`);
    this.smalltalkStep = 1;
    return msg;
  }

  /** Get the opening message for demo phase. */
  startDemo(): string {
    this.mode = 'demo';
    this.demoStep = 0;
    const msg = DEMO_STEPS[0];
    this.demoStep = 1;
    return msg;
  }

  /** Reply to a user message; returns the next predefined response. */
  reply(_userMessage: string): string {
    if (this.mode === 'smalltalk') {
      const step = Math.min(this.smalltalkStep, SMALLTALK_STEPS.length - 1);
      this.smalltalkStep = step + 1;
      return SMALLTALK_STEPS[step];
    }
    const step = Math.min(this.demoStep, DEMO_STEPS.length - 1);
    this.demoStep = step + 1;
    return DEMO_STEPS[step];
  }
}
