import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from './gemini';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: () => Promise.resolve(data),
  };
}

describe('geminiService (Go backend client)', () => {
  describe('chat', () => {
    it('sends correct request to /api/v1/ai/chat', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ text: 'Hallo!', response: 'Hallo!', agent_id: 'passthrough' }));

      const result = await geminiService.chat(
        'Du bist ein Coach.',
        [{ role: 'user', content: 'Hi' }],
        'Wie geht es?'
      );

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: 'Du bist ein Coach.',
          history: [{ role: 'user', content: 'Hi' }],
          message: 'Wie geht es?',
        }),
      });
      expect(result).toEqual({ text: 'Hallo!', retryCount: 0 });
    });

    it('falls back to response field when text is empty', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ text: '', response: 'Antwort', agent_id: 'default' }));

      const result = await geminiService.chat('sys', [], 'msg');
      expect(result.text).toBe('Antwort');
    });

    it('throws on 429 rate limit', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '30' }),
        json: () => Promise.resolve({ error: 'Too many requests', error_code: 'ai_rate_limited' }),
      });

      await expect(
        geminiService.chat('sys', [], 'msg')
      ).rejects.toThrow('Too many requests');
    });

    it('throws on gateway error', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: 'AI service unavailable' }, 500));

      await expect(
        geminiService.chat('sys', [], 'msg')
      ).rejects.toThrow('AI service unavailable');
    });
  });

  describe('extractInsights', () => {
    it('sends messages to /api/v1/ai/extract with insights context', async () => {
      const mockResult = {
        interests: ['Holz'],
        strengths: ['Kreativitaet'],
        preferredStyle: 'hands-on',
        recommendedJourney: 'vuca',
        summary: 'Test',
      };
      mockFetch.mockResolvedValue(jsonResponse({ result: mockResult, prompt_id: 'builtin:insights' }));

      const result = await geminiService.extractInsights([
        { role: 'user', content: 'Ich mag Holz' },
      ]);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/extract', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Ich mag Holz' }],
          context: { extract_type: 'insights' },
        }),
      }));
      expect(result.data.interests).toContain('Holz');
      expect(result.retryCount).toBe(0);
    });
  });

  describe('extractStationResult', () => {
    it('sends correct params to /api/v1/ai/extract with station-result context', async () => {
      const mockResult = {
        stationId: 'v1',
        journeyType: 'vuca',
        dimensionScores: { creativity: 80 },
        summary: 'Gut gemacht',
        completedAt: 12345,
      };
      mockFetch.mockResolvedValue(jsonResponse({ result: mockResult, prompt_id: 'builtin:station-result' }));

      const result = await geminiService.extractStationResult('vuca', 'v1', []);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/extract', expect.objectContaining({
        body: JSON.stringify({
          messages: [],
          context: { extract_type: 'station-result', journey_type: 'vuca', station_id: 'v1' },
        }),
      }));
      expect(result.data.stationId).toBe('v1');
    });
  });

  describe('generateCurriculum', () => {
    it('sends goal to /api/v1/ai/generate with curriculum context', async () => {
      mockFetch.mockResolvedValue(jsonResponse({
        result: { goal: 'Foerster', modules: [] },
        prompt_id: 'builtin:curriculum',
      }));

      const result = await geminiService.generateCurriculum('Foerster');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/generate', expect.objectContaining({
        body: JSON.stringify({
          parameters: { goal: 'Foerster' },
          context: { generate_type: 'curriculum' },
        }),
      }));
      expect(result.data.goal).toBe('Foerster');
    });
  });

  describe('generateCourse', () => {
    it('sends module and goal to /api/v1/ai/generate with course context', async () => {
      mockFetch.mockResolvedValue(jsonResponse({
        result: { moduleId: 'test', title: 'Test', sections: [], quiz: [] },
        prompt_id: 'builtin:course',
      }));

      const result = await geminiService.generateCourse(
        { title: 'Test', description: 'Desc', category: 'V' },
        'Goal'
      );

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/generate', expect.objectContaining({
        body: JSON.stringify({
          parameters: { module: { title: 'Test', description: 'Desc', category: 'V' }, goal: 'Goal' },
          context: { generate_type: 'course' },
        }),
      }));
      expect(result.data.title).toBe('Test');
    });
  });

  describe('textToSpeech', () => {
    it('returns audio base64 from /api/v1/ai/tts', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ audio: 'AAAA==' }));

      const result = await geminiService.textToSpeech('Hallo Welt');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/tts', expect.objectContaining({
        body: JSON.stringify({ text: 'Hallo Welt', voice_dialect: 'hochdeutsch' }),
      }));
      expect(result).toBe('AAAA==');
    });
  });

  describe('speechToText', () => {
    it('returns text from /api/v1/ai/stt', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ text: 'Hallo' }));

      const result = await geminiService.speechToText('audiodata', 'audio/wav');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/ai/stt', expect.objectContaining({
        body: JSON.stringify({ audio: 'audiodata', mime_type: 'audio/wav' }),
      }));
      expect(result).toBe('Hallo');
    });
  });
});
