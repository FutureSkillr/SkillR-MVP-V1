import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock so it's available inside vi.mock factory
const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

// Mock @google/genai before importing the module under test
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', NUMBER: 'NUMBER' },
}));

import { geminiService, backendChatService, MODEL_NAME } from './gemini';

beforeEach(() => {
  mockGenerateContent.mockReset();
  vi.restoreAllMocks();
});

describe('geminiService (Google GenAI SDK)', () => {
  describe('chat', () => {
    it('calls generateContent and returns text', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Hallo!' });

      const result = await geminiService.chat(
        'Du bist ein Coach.',
        [{ role: 'user', content: 'Hi' }],
        'Wie geht es?',
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: MODEL_NAME,
          config: expect.objectContaining({
            systemInstruction: 'Du bist ein Coach.',
          }),
        }),
      );
      expect(result).toEqual({ text: 'Hallo!', retryCount: 0 });
    });

    it('returns empty string when response text is undefined', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });

      const result = await geminiService.chat('sys', [], 'msg');
      expect(result.text).toBe('');
    });

    it('retries on 429 rate limit', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'))
        .mockResolvedValue({ text: 'OK' });

      const result = await geminiService.chat('sys', [], 'msg');
      expect(result.text).toBe('OK');
      expect(result.retryCount).toBe(1);
    }, 10000);
  });

  describe('extractInsights', () => {
    it('parses JSON response into insights', async () => {
      const mockResult = {
        interests: ['Holz'],
        strengths: ['Kreativitaet'],
        preferredStyle: 'hands-on',
        recommendedJourney: 'vuca',
        summary: 'Test',
      };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResult),
      });

      const result = await geminiService.extractInsights([
        { role: 'user', content: 'Ich mag Holz' },
      ]);

      expect(result.data.interests).toContain('Holz');
      expect(result.retryCount).toBe(0);
    });

    it('returns fallback on invalid JSON', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'not json' });

      const result = await geminiService.extractInsights([]);
      expect(result.data.interests).toEqual([]);
      expect(result.data.summary).toContain('konnte nicht analysiert');
    });
  });

  describe('generateCurriculum', () => {
    it('generates curriculum for a goal', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          goal: 'Foerster',
          modules: [{ id: 'v1', title: 'Wald', description: '', category: 'V', order: 1 }],
        }),
      });

      const result = await geminiService.generateCurriculum('Foerster');
      expect(result.data.goal).toBe('Foerster');
      expect(result.data.modules[0].completed).toBe(false);
    });
  });

  describe('generateCourse', () => {
    it('generates course content for a module', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          sections: [{ heading: 'Intro', content: 'Hello' }],
          quiz: [],
        }),
      });

      const result = await geminiService.generateCourse(
        { title: 'Test', description: 'Desc', category: 'V' },
        'Goal',
      );
      expect(result.data.title).toBe('Test');
      expect(result.data.sections).toHaveLength(1);
    });
  });

  describe('textToSpeech', () => {
    it('returns audio base64 from TTS response', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{ inlineData: { data: 'AAAA==', mimeType: 'audio/wav' } }],
          },
        }],
      });

      const result = await geminiService.textToSpeech('Hallo Welt');
      expect(result).toBe('AAAA==');
    });
  });

  describe('speechToText', () => {
    it('returns transcription from STT response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Hallo' });

      const result = await geminiService.speechToText('audiodata', 'audio/wav');
      expect(result).toBe('Hallo');
    });
  });
});

describe('backendChatService (Go backend)', () => {
  it('sends correct JSON body with assistant→model role mapping', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: 'Antwort vom Backend' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await backendChatService.chat(
      'Du bist ein Coach.',
      [
        { role: 'user', content: 'Hallo' },
        { role: 'assistant', content: 'Hi!' },
        { role: 'user', content: 'Wie geht es?' },
      ],
      'Erzaehl mir mehr',
    );

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: 'Du bist ein Coach.',
        message: 'Erzaehl mir mehr',
        history: [
          { role: 'user', content: 'Hallo' },
          { role: 'model', content: 'Hi!' },
          { role: 'user', content: 'Wie geht es?' },
        ],
      }),
    });
    expect(result).toEqual({ text: 'Antwort vom Backend', retryCount: 0 });
  });

  it('throws error with HTTP status and error_code on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'AI rate limit exceeded', error_code: 'ai_rate_limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(backendChatService.chat('sys', [], 'msg')).rejects.toThrow(
      '429 ai_rate_limited',
    );
  });

  it('handles non-JSON error responses gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    );

    await expect(backendChatService.chat('sys', [], 'msg')).rejects.toThrow(
      '500',
    );
  });

  it('returns empty string when response text is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ response: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await backendChatService.chat('sys', [], 'msg');
    expect(result.text).toBe('');
  });
});
