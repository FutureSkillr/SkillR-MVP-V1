import { Router } from 'express';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { acquireSlot, releaseSlot } from './capacity.js';

const router = Router();

// M24: Pre-auth signed session token — prevents bot abuse of Gemini proxy
const SESSION_TOKEN_SECRET = process.env.JWT_SECRET || 'dev-session-secret';
const SESSION_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function issueSessionToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + SESSION_TOKEN_TTL_MS;
  const payload = `${expiresAt}`;
  const hmac = crypto.createHmac('sha256', SESSION_TOKEN_SECRET).update(payload).digest('hex');
  return { token: `${payload}.${hmac}`, expiresAt };
}

function validateSessionToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, hmac] = parts;
  const expected = crypto.createHmac('sha256', SESSION_TOKEN_SECRET).update(payload).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return false;
  const expiresAt = parseInt(payload, 10);
  return Date.now() < expiresAt;
}

// Validate session token on all Gemini routes
router.use((req, res, next) => {
  // Skip validation if user is authenticated (has valid JWT)
  if (req.user) return next();
  const sessionToken = req.headers['x-session-token'] as string;
  if (!sessionToken || !validateSessionToken(sessionToken)) {
    res.status(403).json({ error: 'Valid session token required', code: 'SESSION_REQUIRED' });
    return;
  }
  next();
});

const MODEL_NAME = 'gemini-2.0-flash-lite';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 50;
const MAX_TEXT_LENGTH = 5000;
const MAX_AUDIO_BASE64_LENGTH = 7 * 1024 * 1024; // ~7MB base64 ≈ 5MB binary
const MAX_GOAL_LENGTH = 500;

const DIALECT_PROMPTS: Record<string, string> = {
  hochdeutsch: 'Lies diesen Text in klarem Hochdeutsch vor.',
  bayerisch: 'Lies diesen Text mit bayerischem Akzent vor.',
  schwaebisch: 'Lies diesen Text mit schwaebischem Akzent vor.',
  berlinerisch: 'Lies diesen Text mit Berliner Dialekt vor.',
  saechsisch: 'Lies diesen Text mit saechsischem Akzent vor.',
  koelsch: 'Lies diesen Text mit koelschem Akzent vor.',
};

// Server-side prompt registry — clients reference prompts by key, not raw text
const PROMPT_REGISTRY: Record<string, string> = {
  smalltalk: 'Du bist ein freundlicher Coach fuer Jugendliche. Fuehre ein lockeres Gespraech.',
  demo: 'Du bist ein Lern-Coach. Fuehre eine Mini-Lern-Sequenz durch.',
  default: 'Du bist ein hilfreicher Assistent fuer Jugendliche auf Deutsch.',
};

// M3: Sanitize user-supplied values before interpolating into AI prompt strings
function sanitizeForPrompt(value: string, maxLen = 500): string {
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // strip control chars
    .slice(0, maxLen)
    .trim();
}

function validateHistoryEntry(entry: unknown): entry is { role: string; content: string } {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  if (typeof e.role !== 'string' || (e.role !== 'user' && e.role !== 'model')) return false;
  if (typeof e.content !== 'string' || e.content.length > MAX_MESSAGE_LENGTH) return false;
  return true;
}

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  return new GoogleGenAI({ apiKey });
}

// Retry helper for Gemini rate limits (429)
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<{ result: T; retryCount: number }> {
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
        console.warn(`[gemini] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// POST /api/gemini/chat
router.post('/chat', async (req, res, next) => {
  // FR-062: Acquire a capacity slot
  const browserSessionId = (req.headers['x-browser-session-id'] as string) || 'unknown';
  const slotId = acquireSlot(browserSessionId);
  if (!slotId) {
    res.status(503).json({ error: 'Server at capacity', code: 'QUEUE_REQUIRED' });
    return;
  }

  try {
    const { promptKey, history, userMessage } = req.body;
    if (!userMessage || typeof userMessage !== 'string') {
      res.status(400).json({ error: 'userMessage is required', code: 'INVALID_REQUEST' });
      return;
    }
    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: `userMessage exceeds ${MAX_MESSAGE_LENGTH} characters`, code: 'INVALID_REQUEST' });
      return;
    }

    // Validate history
    if (history) {
      if (!Array.isArray(history) || history.length > MAX_HISTORY_LENGTH) {
        res.status(400).json({ error: `history must be an array of max ${MAX_HISTORY_LENGTH} entries`, code: 'INVALID_REQUEST' });
        return;
      }
      for (const entry of history) {
        if (!validateHistoryEntry(entry)) {
          res.status(400).json({ error: 'Each history entry must have role (user|model) and content (string)', code: 'INVALID_REQUEST' });
          return;
        }
      }
    }

    // Use server-side prompt registry instead of client-supplied systemInstruction
    const systemInstruction = PROMPT_REGISTRY[promptKey as string] || PROMPT_REGISTRY.default;

    const ai = getAI();
    const { result: text, retryCount } = await withRetry(async () => {
      const contents = [
        ...(history || []).map((h: { role: string; content: string }) => ({
          role: h.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: h.content }],
        })),
        { role: 'user' as const, parts: [{ text: userMessage }] },
      ];
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents,
        config: { systemInstruction },
      });
      return response.text || '';
    });

    res.json({ text, retryCount });
  } catch (err) {
    next(err);
  } finally {
    releaseSlot(slotId);
  }
});

// POST /api/gemini/extract-insights
router.post('/extract-insights', async (req, res, next) => {
  try {
    const { chatHistory } = req.body;
    if (!chatHistory || !Array.isArray(chatHistory)) {
      res.status(400).json({ error: 'chatHistory array is required', code: 'INVALID_REQUEST' });
      return;
    }
    if (chatHistory.length > MAX_HISTORY_LENGTH) {
      res.status(400).json({ error: `chatHistory exceeds ${MAX_HISTORY_LENGTH} entries`, code: 'INVALID_REQUEST' });
      return;
    }
    for (const entry of chatHistory) {
      if (!validateHistoryEntry(entry)) {
        res.status(400).json({ error: 'Each history entry must have role (user|model) and content (string)', code: 'INVALID_REQUEST' });
        return;
      }
    }

    const transcript = chatHistory
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'Nutzer' : 'Coach'}: ${sanitizeForPrompt(m.content, MAX_MESSAGE_LENGTH)}`
      )
      .join('\n');

    const ai = getAI();
    const { result: rawText, retryCount } = await withRetry(async () => {
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
                description: 'Bevorzugter Lernstil: hands-on (Macher), reflective (Denker), creative (Kreativer)',
              },
              recommendedJourney: {
                type: Type.STRING,
                enum: ['vuca', 'entrepreneur', 'self-learning'],
                description: 'Empfohlene Reise: vuca fuer Entdecker, entrepreneur fuer Macher, self-learning fuer Denker',
              },
              summary: {
                type: Type.STRING,
                description: 'Kurze Zusammenfassung des Profils in 1-2 Saetzen auf Deutsch',
              },
            },
            required: ['interests', 'strengths', 'preferredStyle', 'recommendedJourney', 'summary'],
          },
        },
      });
      return response.text || '{}';
    });

    try {
      res.json({ data: JSON.parse(rawText), retryCount });
    } catch {
      res.json({
        data: {
          interests: [],
          strengths: [],
          preferredStyle: 'hands-on',
          recommendedJourney: 'vuca',
          summary: 'Profil konnte nicht analysiert werden.',
        },
        retryCount,
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/gemini/extract-station-result
router.post('/extract-station-result', async (req, res, next) => {
  try {
    const { journeyType, stationId, chatHistory } = req.body;
    if (!chatHistory || !Array.isArray(chatHistory)) {
      res.status(400).json({ error: 'chatHistory array is required', code: 'INVALID_REQUEST' });
      return;
    }
    if (chatHistory.length > MAX_HISTORY_LENGTH) {
      res.status(400).json({ error: `chatHistory exceeds ${MAX_HISTORY_LENGTH} entries`, code: 'INVALID_REQUEST' });
      return;
    }
    for (const entry of chatHistory) {
      if (!validateHistoryEntry(entry)) {
        res.status(400).json({ error: 'Each history entry must have role (user|model) and content (string)', code: 'INVALID_REQUEST' });
        return;
      }
    }
    // Validate journeyType and stationId patterns
    if (journeyType && (typeof journeyType !== 'string' || !/^[a-z0-9-]{1,50}$/.test(journeyType))) {
      res.status(400).json({ error: 'Invalid journeyType format', code: 'INVALID_REQUEST' });
      return;
    }
    if (stationId && (typeof stationId !== 'string' || !/^[a-zA-Z0-9-_]{1,100}$/.test(stationId))) {
      res.status(400).json({ error: 'Invalid stationId format', code: 'INVALID_REQUEST' });
      return;
    }

    const transcript = chatHistory
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'Nutzer' : 'Guide'}: ${sanitizeForPrompt(m.content, MAX_MESSAGE_LENGTH)}`
      )
      .join('\n');

    const ai = getAI();
    const safeJourneyType = sanitizeForPrompt(journeyType || '', 50);
    const safeStationId = sanitizeForPrompt(stationId || '', 100);
    const { result: rawText, retryCount } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analysiere diese Station und bewerte die gezeigten Faehigkeiten auf einer Skala von 0-100:\n\nReise-Typ: ${safeJourneyType}\nStation: ${safeStationId}\n\n${transcript}`,
        config: {
          systemInstruction:
            'Du bist ein Bewertungs-Tool. Analysiere das Gespraech und vergib Scores fuer die gezeigten Dimensionen. Antworte nur mit dem JSON-Schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dimensionScores: {
                type: Type.OBJECT,
                description: 'Scores pro Dimension (0-100). Keys sind die Dimensions-IDs.',
                properties: {},
                additionalProperties: true,
              },
              summary: {
                type: Type.STRING,
                description: 'Kurze Zusammenfassung der gezeigten Faehigkeiten (1-2 Saetze, Deutsch)',
              },
            },
            required: ['dimensionScores', 'summary'],
          },
        },
      });
      return response.text || '{}';
    });

    try {
      const parsed = JSON.parse(rawText);
      res.json({
        data: {
          stationId: stationId || '',
          journeyType: journeyType || '',
          dimensionScores: parsed.dimensionScores || {},
          summary: parsed.summary || '',
          completedAt: Date.now(),
        },
        retryCount,
      });
    } catch {
      res.json({
        data: {
          stationId: stationId || '',
          journeyType: journeyType || '',
          dimensionScores: {},
          summary: 'Ergebnis konnte nicht analysiert werden.',
          completedAt: Date.now(),
        },
        retryCount,
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/gemini/generate-curriculum
router.post('/generate-curriculum', async (req, res, next) => {
  try {
    const { goal } = req.body;
    if (!goal || typeof goal !== 'string') {
      res.status(400).json({ error: 'goal is required', code: 'INVALID_REQUEST' });
      return;
    }
    if (goal.length > MAX_GOAL_LENGTH) {
      res.status(400).json({ error: `goal exceeds ${MAX_GOAL_LENGTH} characters`, code: 'INVALID_REQUEST' });
      return;
    }

    const ai = getAI();
    const { result: rawText, retryCount } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Erstelle einen Lehrplan fuer das Berufsziel: "${sanitizeForPrompt(goal, MAX_GOAL_LENGTH)}". Der Lehrplan soll 12 Module haben, 3 pro VUCA-Kategorie (V=Volatility, U=Uncertainty, C=Complexity, A=Ambiguity). Jedes Modul soll auf Deutsch sein und zum Berufsziel passen.`,
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
    });

    try {
      const parsed = JSON.parse(rawText);
      res.json({
        data: {
          goal: parsed.goal || goal,
          modules: (parsed.modules || []).map((m: Record<string, unknown>) => ({
            ...m,
            completed: false,
          })),
        },
        retryCount,
      });
    } catch {
      res.json({
        data: { goal, modules: [] },
        retryCount,
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/gemini/generate-course
router.post('/generate-course', async (req, res, next) => {
  try {
    const { module: mod, goal } = req.body;
    if (!mod || !goal) {
      res.status(400).json({ error: 'module and goal are required', code: 'INVALID_REQUEST' });
      return;
    }

    const ai = getAI();
    const { result: rawText, retryCount } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Erstelle Kursinhalt fuer das Modul "${sanitizeForPrompt(String(mod.title || ''), 200)}" (${sanitizeForPrompt(String(mod.description || ''), 500)}). VUCA-Dimension: ${sanitizeForPrompt(String(mod.category || ''), 10)}. Berufsziel: "${sanitizeForPrompt(String(goal || ''), MAX_GOAL_LENGTH)}". Erstelle 2-3 Abschnitte mit Lerninhalt und 3 Quiz-Fragen (Multiple-Choice mit je 4 Optionen). Alles auf Deutsch.`,
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
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    });

    try {
      const parsed = JSON.parse(rawText);
      res.json({
        data: {
          moduleId: mod.title,
          title: parsed.title || mod.title,
          sections: parsed.sections || [],
          quiz: parsed.quiz || [],
        },
        retryCount,
      });
    } catch {
      res.json({
        data: {
          moduleId: mod.title,
          title: mod.title,
          sections: [],
          quiz: [],
        },
        retryCount,
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/gemini/tts
router.post('/tts', async (req, res, next) => {
  try {
    const { text, dialect } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text is required', code: 'INVALID_REQUEST' });
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      res.status(400).json({ error: `text exceeds ${MAX_TEXT_LENGTH} characters`, code: 'INVALID_REQUEST' });
      return;
    }

    const dialectPrompt = DIALECT_PROMPTS[dialect || 'hochdeutsch'] || DIALECT_PROMPTS.hochdeutsch;
    const ai = getAI();

    const { result: audioBase64 } = await withRetry(async () => {
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

      console.error('[TTS] No audio data found in response. Response keys:', Object.keys(response));
      throw new Error('No audio data in TTS response');
    });

    res.json({ audio: audioBase64 });
  } catch (err) {
    next(err);
  }
});

// POST /api/gemini/stt
router.post('/stt', async (req, res, next) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({ error: 'audioBase64 is required', code: 'INVALID_REQUEST' });
      return;
    }
    if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
      res.status(400).json({ error: 'audio data too large', code: 'INVALID_REQUEST' });
      return;
    }

    const ai = getAI();
    const { result: text } = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          {
            role: 'user' as const,
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/wav',
                  data: audioBase64,
                },
              },
              { text: 'Transkribiere diese Aufnahme auf Deutsch. Gib nur den transkribierten Text zurueck, ohne Erklaerungen.' },
            ],
          },
        ],
      });
      return response.text || '';
    });

    res.json({ text: text.trim() });
  } catch (err) {
    next(err);
  }
});

export default router;
