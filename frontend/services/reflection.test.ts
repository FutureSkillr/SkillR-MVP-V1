import { describe, it, expect } from 'vitest';
import {
  shouldTriggerReflection,
  selectReflectionQuestion,
  scoreReflectionResponse,
  aggregateCapabilities,
  REFLECTION_BANK,
} from './reflection';
import type { StationResult } from '../types/journey';
import type { ReflectionResult } from './reflection';

const mockResult: StationResult = {
  stationId: 'vuca-01',
  journeyType: 'vuca',
  dimensionScores: { change: 70 },
  summary: 'Test',
  completedAt: Date.now(),
};

describe('shouldTriggerReflection', () => {
  it('returns false with no last result', () => {
    expect(shouldTriggerReflection(['vuca-01'], null)).toBe(false);
  });

  it('returns true after first station', () => {
    expect(shouldTriggerReflection(['vuca-01'], mockResult)).toBe(true);
  });

  it('returns false with empty completed stations', () => {
    expect(shouldTriggerReflection([], mockResult)).toBe(false);
  });
});

describe('selectReflectionQuestion', () => {
  it('returns a question from the bank', () => {
    const q = selectReflectionQuestion(0);
    expect(q).toBeDefined();
    expect(q.question).toBeTruthy();
    expect(q.dimension).toBeTruthy();
  });

  it('returns different questions for different station counts', () => {
    const q1 = selectReflectionQuestion(0);
    const q2 = selectReflectionQuestion(1);
    expect(q1.id).not.toBe(q2.id);
  });

  it('avoids previously used question IDs', () => {
    const q1 = selectReflectionQuestion(0);
    const q2 = selectReflectionQuestion(0, [q1.id]);
    expect(q2.id).not.toBe(q1.id);
  });

  it('cycles through all questions', () => {
    const ids = new Set<string>();
    for (let i = 0; i < REFLECTION_BANK.length; i++) {
      ids.add(selectReflectionQuestion(i).id);
    }
    expect(ids.size).toBe(REFLECTION_BANK.length);
  });
});

describe('scoreReflectionResponse', () => {
  const question = REFLECTION_BANK[0]; // analyticalDepth

  it('gives higher score for longer responses', () => {
    const short = scoreReflectionResponse(question, 'Ja war schwer', 10000);
    const long = scoreReflectionResponse(
      question,
      'Es war schwierig weil ich nicht wusste was ich tun sollte und dann habe ich verschiedene Moeglichkeiten durchdacht und mich fuer den besten Weg entschieden',
      10000,
    );
    expect(long[question.dimension]).toBeGreaterThan(short[question.dimension]);
  });

  it('gives bonus for self-reflection language', () => {
    const plain = scoreReflectionResponse(question, 'Es war halt schwer', 10000);
    const reflective = scoreReflectionResponse(
      question,
      'Mir ist aufgefallen dass ich in solchen Situationen unsicher werde',
      10000,
    );
    expect(reflective[question.dimension]).toBeGreaterThan(plain[question.dimension]);
  });

  it('gives bonus for concrete examples', () => {
    const plain = scoreReflectionResponse(question, 'Das war eine Herausforderung', 10000);
    const withExample = scoreReflectionResponse(
      question,
      'Zum Beispiel musste ich zwischen zwei Optionen waehlen',
      10000,
    );
    expect(withExample[question.dimension]).toBeGreaterThan(plain[question.dimension]);
  });

  it('caps score at 100', () => {
    const maxResponse = 'Mir ist aufgefallen dass ich zum Beispiel ein Gefuehl von Stolz hatte als ich dieses Problem geloest habe und ich denke dass mir das in Zukunft helfen wird solche Situationen besser zu meistern weil ich jetzt weiss dass ich es schaffen kann und das gibt mir Sicherheit und Vertrauen in meine eigenen Faehigkeiten';
    const score = scoreReflectionResponse(question, maxResponse, 5000);
    expect(score[question.dimension]).toBeLessThanOrEqual(100);
  });

  it('floors score at 10', () => {
    const score = scoreReflectionResponse(question, 'Ja', 60000);
    expect(score[question.dimension]).toBeGreaterThanOrEqual(10);
  });
});

describe('aggregateCapabilities', () => {
  it('returns zeros with no results', () => {
    const caps = aggregateCapabilities([]);
    expect(caps.analyticalDepth).toBe(0);
    expect(caps.creativity).toBe(0);
    expect(caps.confidence).toBe(0);
    expect(caps.resilience).toBe(0);
    expect(caps.selfAwareness).toBe(0);
  });

  it('averages scores for same dimension', () => {
    const results: ReflectionResult[] = [
      { questionId: 'r1', response: 'test', responseTime: 1000, capabilityScores: { analyticalDepth: 60 } },
      { questionId: 'r2', response: 'test', responseTime: 1000, capabilityScores: { analyticalDepth: 80 } },
    ];
    const caps = aggregateCapabilities(results);
    expect(caps.analyticalDepth).toBe(70);
  });

  it('handles multiple dimensions', () => {
    const results: ReflectionResult[] = [
      { questionId: 'r1', response: 'test', responseTime: 1000, capabilityScores: { creativity: 90 } },
      { questionId: 'r2', response: 'test', responseTime: 1000, capabilityScores: { resilience: 60 } },
    ];
    const caps = aggregateCapabilities(results);
    expect(caps.creativity).toBe(90);
    expect(caps.resilience).toBe(60);
    expect(caps.analyticalDepth).toBe(0);
  });
});
