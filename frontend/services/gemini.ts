import { GoogleGenAI, Type } from '@google/genai';
import type { ChatMessage } from '../types/chat';
import type { OnboardingInsights, VoiceDialect } from '../types/user';
import type { StationResult } from '../types/journey';
import type { VucaCurriculum, CourseContent } from '../types/vuca';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
export const MODEL_NAME = 'gemini-2.0-flash-lite';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const DIALECT_PROMPTS: Record<VoiceDialect, string> = {
  hochdeutsch: 'Lies diesen Text in klarem Hochdeutsch vor.',
  bayerisch: 'Lies diesen Text mit bayerischem Akzent vor.',
  schwaebisch: 'Lies diesen Text mit schwaebischem Akzent vor.',
  berlinerisch: 'Lies diesen Text mit Berliner Dialekt vor.',
  saechsisch: 'Lies diesen Text mit saechsischem Akzent vor.',
  koelsch: 'Lies diesen Text mit koelschem Akzent vor.',
};

export interface RetryInfo {
  attempt: number;
  maxRetries: number;
  delayMs: number;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  onRetry?: (info: RetryInfo) => void
): Promise<{ result: T; retryCount: number }> {
  let retryCount = 0;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, retryCount };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      if (is429 && attempt < maxRetries) {
        const delay = (attempt + 1) * 2000;
        retryCount++;
        onRetry?.({ attempt: attempt + 1, maxRetries, delayMs: delay });
        console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export const geminiService = {
  async chat(
    systemInstruction: string,
    history: ChatMessage[],
    userMessage: string,
    onRetry?: (info: RetryInfo) => void
  ): Promise<{ text: string; retryCount: number }> {
    const { result, retryCount } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          ...history.map((h) => ({
            role: h.role === 'user' ? ('user' as const) : ('model' as const),
            parts: [{ text: h.content }],
          })),
          { role: 'user' as const, parts: [{ text: userMessage }] },
        ],
        config: {
          systemInstruction,
        },
      });
      return response.text || '';
    }, 3, onRetry);
    return { text: result, retryCount };
  },

  async extractInsights(
    chatHistory: ChatMessage[],
    onRetry?: (info: RetryInfo) => void
  ): Promise<{ data: OnboardingInsights; retryCount: number; rawText: string }> {
    const transcript = chatHistory
      .map((m) => `${m.role === 'user' ? 'Nutzer' : 'Coach'}: ${m.content}`)
      .join('\n');

    const { result, retryCount } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analysiere dieses Onboarding-Gespraech und extrahiere strukturierte Insights:\n\n${transcript}`,
        config: {
          systemInstruction:
            'Du bist ein Analyse-Tool. Extrahiere strukturierte Daten aus Gespraechen. Antworte nur mit dem JSON-Schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interests: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Liste der erkannten Interessen (3-5 Stueck)',
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Liste der erkannten Staerken (2-4 Stueck)',
              },
              preferredStyle: {
                type: Type.STRING,
                enum: ['hands-on', 'reflective', 'creative'],
                description:
                  'Bevorzugter Lernstil: hands-on (Macher), reflective (Denker), creative (Kreativer)',
              },
              recommendedJourney: {
                type: Type.STRING,
                enum: ['vuca', 'entrepreneur', 'self-learning'],
                description:
                  'Empfohlene Reise: vuca fuer Entdecker, entrepreneur fuer Macher, self-learning fuer Denker',
              },
              summary: {
                type: Type.STRING,
                description:
                  'Kurze Zusammenfassung des Profils in 1-2 Saetzen auf Deutsch',
              },
            },
            required: [
              'interests',
              'strengths',
              'preferredStyle',
              'recommendedJourney',
              'summary',
            ],
          },
        },
      });
      return response.text || '{}';
    }, 3, onRetry);

    try {
      return { data: JSON.parse(result), retryCount, rawText: result };
    } catch {
      return {
        data: {
          interests: [],
          strengths: [],
          preferredStyle: 'hands-on' as const,
          recommendedJourney: 'vuca' as const,
          summary: 'Profil konnte nicht analysiert werden.',
        },
        retryCount,
        rawText: result,
      };
    }
  },

  async extractStationResult(
    journeyType: string,
    stationId: string,
    chatHistory: ChatMessage[],
    onRetry?: (info: RetryInfo) => void
  ): Promise<{ data: StationResult; retryCount: number; rawText: string }> {
    const transcript = chatHistory
      .map((m) => `${m.role === 'user' ? 'Nutzer' : 'Guide'}: ${m.content}`)
      .join('\n');

    const { result, retryCount } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analysiere diese Station und bewerte die gezeigten Faehigkeiten auf einer Skala von 0-100:\n\nReise-Typ: ${journeyType}\nStation: ${stationId}\n\n${transcript}`,
        config: {
          systemInstruction:
            'Du bist ein Bewertungs-Tool. Analysiere das Gespraech und vergib Scores fuer die gezeigten Dimensionen. Antworte nur mit dem JSON-Schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dimensionScores: {
                type: Type.OBJECT,
                description:
                  'Scores pro Dimension (0-100). Keys sind die Dimensions-IDs.',
                properties: {},
                additionalProperties: true,
              },
              summary: {
                type: Type.STRING,
                description:
                  'Kurze Zusammenfassung der gezeigten Faehigkeiten (1-2 Saetze, Deutsch)',
              },
            },
            required: ['dimensionScores', 'summary'],
          },
        },
      });
      return response.text || '{}';
    }, 3, onRetry);

    try {
      const parsed = JSON.parse(result);
      return {
        data: {
          stationId,
          journeyType: journeyType as StationResult['journeyType'],
          dimensionScores: parsed.dimensionScores || {},
          summary: parsed.summary || '',
          completedAt: Date.now(),
        },
        retryCount,
        rawText: result,
      };
    } catch {
      return {
        data: {
          stationId,
          journeyType: journeyType as StationResult['journeyType'],
          dimensionScores: {},
          summary: 'Ergebnis konnte nicht analysiert werden.',
          completedAt: Date.now(),
        },
        retryCount,
        rawText: result,
      };
    }
  },

  async generateCurriculum(
    goal: string,
    onRetry?: (info: RetryInfo) => void
  ): Promise<{ data: VucaCurriculum; retryCount: number; rawText: string }> {
    const { result, retryCount } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Erstelle einen Lehrplan fuer das Berufsziel: "${goal}". Der Lehrplan soll 12 Module haben, 3 pro VUCA-Kategorie (V=Volatility, U=Uncertainty, C=Complexity, A=Ambiguity). Jedes Modul soll auf Deutsch sein und zum Berufsziel passen.`,
        config: {
          systemInstruction:
            'Du bist ein Curriculum-Generator fuer die VUCA-Reise. Erstelle strukturierte Lehrplaene mit 12 Modulen (3 pro VUCA-Dimension). Antworte nur mit dem JSON-Schema. Alle Texte auf Deutsch.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              goal: { type: Type.STRING, description: 'Das Berufsziel' },
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'Eindeutige ID z.B. v1, u2, c3, a1' },
                    title: { type: Type.STRING, description: 'Modul-Titel auf Deutsch' },
                    description: { type: Type.STRING, description: 'Kurzbeschreibung (1-2 Saetze)' },
                    category: { type: Type.STRING, enum: ['V', 'U', 'C', 'A'], description: 'VUCA-Dimension' },
                    order: { type: Type.NUMBER, description: 'Reihenfolge 1-12' },
                  },
                  required: ['id', 'title', 'description', 'category', 'order'],
                },
                description: '12 Module, 3 pro VUCA-Kategorie',
              },
            },
            required: ['goal', 'modules'],
          },
        },
      });
      return response.text || '{}';
    }, 3, onRetry);

    try {
      const parsed = JSON.parse(result);
      return {
        data: {
          goal: parsed.goal || goal,
          modules: (parsed.modules || []).map((m: Record<string, unknown>) => ({
            ...m,
            completed: false,
          })),
        },
        retryCount,
        rawText: result,
      };
    } catch {
      return {
        data: { goal, modules: [] },
        retryCount,
        rawText: result,
      };
    }
  },

  async generateCourse(
    module: { title: string; description: string; category: string },
    goal: string,
    onRetry?: (info: RetryInfo) => void
  ): Promise<{ data: CourseContent; retryCount: number; rawText: string }> {
    const { result, retryCount } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Erstelle Kursinhalt fuer das Modul "${module.title}" (${module.description}). VUCA-Dimension: ${module.category}. Berufsziel: "${goal}". Erstelle 2-3 Abschnitte mit Lerninhalt und 3 Quiz-Fragen (Multiple-Choice mit je 4 Optionen). Alles auf Deutsch.`,
        config: {
          systemInstruction:
            'Du bist ein Kurs-Generator. Erstelle Lernmaterial mit Quiz-Fragen. Antworte nur mit dem JSON-Schema. Alle Texte auf Deutsch.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  required: ['heading', 'content'],
                },
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.NUMBER },
                    explanation: { type: Type.STRING },
                  },
                  required: ['question', 'options', 'correctIndex', 'explanation'],
                },
              },
            },
            required: ['title', 'sections', 'quiz'],
          },
        },
      });
      return response.text || '{}';
    }, 3, onRetry);

    try {
      const parsed = JSON.parse(result);
      return {
        data: {
          moduleId: module.title,
          title: parsed.title || module.title,
          sections: parsed.sections || [],
          quiz: parsed.quiz || [],
        },
        retryCount,
        rawText: result,
      };
    } catch {
      return {
        data: {
          moduleId: module.title,
          title: module.title,
          sections: [],
          quiz: [],
        },
        retryCount,
        rawText: result,
      };
    }
  },

  async textToSpeech(
    text: string,
    dialect: VoiceDialect = 'hochdeutsch',
    onRetry?: (info: RetryInfo) => void
  ): Promise<string> {
    const dialectPrompt = DIALECT_PROMPTS[dialect] || DIALECT_PROMPTS.hochdeutsch;
    const { result } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [`${dialectPrompt}\n\n${text}`],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Kore',
              },
            },
          },
        },
      });

      // Walk through all candidates/parts to find audio inlineData
      const candidates = response.candidates || [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          const inline = (part as { inlineData?: { data: string; mimeType?: string } }).inlineData;
          if (inline?.data) {
            return inline.data;
          }
        }
      }

      // Debug: log the raw response structure if no audio found
      console.error('[TTS] No audio data found in response. Response keys:', Object.keys(response));
      if (candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];
        console.error('[TTS] First candidate parts:', parts.map(p => Object.keys(p)));
      }
      throw new Error('No audio data in TTS response');
    }, 3, onRetry);
    return result;
  },

  async speechToText(
    audioBase64: string,
    mimeType = 'audio/wav',
    onRetry?: (info: RetryInfo) => void
  ): Promise<string> {
    const { result } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          {
            role: 'user' as const,
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              { text: 'Transkribiere diese Aufnahme auf Deutsch. Gib nur den transkribierten Text zurueck, ohne Erklaerungen.' },
            ],
          },
        ],
      });
      return response.text || '';
    }, 3, onRetry);
    return result.trim();
  },
};
