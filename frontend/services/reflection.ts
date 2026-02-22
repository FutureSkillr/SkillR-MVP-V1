/**
 * Level 2 Reflection Engine (FR-020)
 *
 * Triggers proactive reflection questions after station completions.
 * Analyzes response patterns to derive capability indicators
 * (analytical depth, creativity, confidence, resilience).
 */

import type { StationResult } from '../types/journey';
import type { OnboardingInsights } from '../types/user';

export interface ReflectionQuestion {
  id: string;
  question: string;
  dimension: string;       // Which capability this probes
  dimensionLabel: string;
  followUp?: string;       // Optional follow-up prompt based on answer
}

export interface ReflectionResult {
  questionId: string;
  response: string;
  responseTime: number;    // ms from question display to response
  capabilityScores: Record<string, number>; // derived from response
}

export interface CapabilityIndicators {
  analyticalDepth: number;   // 0-100
  creativity: number;        // 0-100
  confidence: number;        // 0-100
  resilience: number;        // 0-100
  selfAwareness: number;     // 0-100
}

/** Reflection questions organized by capability dimension. */
const REFLECTION_BANK: ReflectionQuestion[] = [
  {
    id: 'r-analytical-1',
    question: 'Was war das Schwierigste an dieser Station? Warum war es schwierig?',
    dimension: 'analyticalDepth',
    dimensionLabel: 'Analytisches Denken',
    followUp: 'Wie hast du das Problem am Ende geloest?',
  },
  {
    id: 'r-creativity-1',
    question: 'Wenn du diese Situation nochmal erleben wuerdest — was wuerdest du anders machen?',
    dimension: 'creativity',
    dimensionLabel: 'Kreativitaet',
    followUp: 'Was waere das ueberraschendste Ergebnis?',
  },
  {
    id: 'r-confidence-1',
    question: 'In welchem Moment warst du dir am sichersten? Was hat dir Sicherheit gegeben?',
    dimension: 'confidence',
    dimensionLabel: 'Selbstvertrauen',
  },
  {
    id: 'r-resilience-1',
    question: 'Gab es einen Moment, in dem du unsicher warst? Wie bist du damit umgegangen?',
    dimension: 'resilience',
    dimensionLabel: 'Resilienz',
    followUp: 'Was hat dir geholfen, weiterzumachen?',
  },
  {
    id: 'r-selfawareness-1',
    question: 'Was hast du ueber dich selbst gelernt, das du vorher nicht wusstest?',
    dimension: 'selfAwareness',
    dimensionLabel: 'Selbsterkenntnis',
  },
  {
    id: 'r-analytical-2',
    question: 'Welche Zusammenhaenge hast du zwischen verschiedenen Teilen der Station erkannt?',
    dimension: 'analyticalDepth',
    dimensionLabel: 'Analytisches Denken',
  },
  {
    id: 'r-creativity-2',
    question: 'Was wuerdest du an dieser Station veraendern, damit sie noch spannender wird?',
    dimension: 'creativity',
    dimensionLabel: 'Kreativitaet',
  },
  {
    id: 'r-resilience-2',
    question: 'Stell dir vor, du erzaehlst einem Freund von dieser Erfahrung. Was wuerdest du sagen?',
    dimension: 'resilience',
    dimensionLabel: 'Resilienz',
  },
];

/**
 * Determine whether a reflection should be triggered.
 * Triggers after every station completion (MVP2).
 */
export function shouldTriggerReflection(
  completedStations: string[],
  lastResult: StationResult | null,
): boolean {
  if (!lastResult) return false;
  // Trigger after every station completion
  return completedStations.length > 0;
}

/**
 * Select a reflection question based on completed stations.
 * Avoids repeating recent questions by using station count as seed.
 */
export function selectReflectionQuestion(
  completedStationCount: number,
  previousQuestionIds: string[] = [],
): ReflectionQuestion {
  // Filter out recently used questions
  const available = REFLECTION_BANK.filter(
    (q) => !previousQuestionIds.includes(q.id)
  );
  const pool = available.length > 0 ? available : REFLECTION_BANK;
  const index = completedStationCount % pool.length;
  return pool[index];
}

/**
 * Score a reflection response based on content analysis.
 * Simple heuristic for MVP2 — proper NLP analysis deferred to backend.
 */
export function scoreReflectionResponse(
  question: ReflectionQuestion,
  response: string,
  responseTime: number,
): Record<string, number> {
  const wordCount = response.trim().split(/\s+/).length;
  const hasExample = /beispiel|zum beispiel|z\.b\.|z\.B\./i.test(response);
  const hasReflection = /ich denke|ich glaube|mir ist aufgefallen|ich habe gemerkt/i.test(response);
  const hasEmotion = /gefuehl|angst|freude|stolz|unsicher|sicher|mutig/i.test(response);

  // Base score from response length (longer = more engaged)
  let baseScore = Math.min(wordCount * 3, 70);

  // Bonus for concrete examples
  if (hasExample) baseScore += 10;

  // Bonus for self-reflection language
  if (hasReflection) baseScore += 10;

  // Bonus for emotional awareness
  if (hasEmotion) baseScore += 10;

  // Quick response time bonus (confident answer < 30s)
  if (responseTime < 30000 && wordCount > 5) baseScore += 5;

  const score = Math.min(Math.max(baseScore, 10), 100);

  return { [question.dimension]: score };
}

/**
 * Aggregate capability indicators from multiple reflection results.
 */
export function aggregateCapabilities(
  results: ReflectionResult[],
): CapabilityIndicators {
  const dimensions: Record<string, { total: number; count: number }> = {
    analyticalDepth: { total: 0, count: 0 },
    creativity: { total: 0, count: 0 },
    confidence: { total: 0, count: 0 },
    resilience: { total: 0, count: 0 },
    selfAwareness: { total: 0, count: 0 },
  };

  for (const result of results) {
    for (const [dim, score] of Object.entries(result.capabilityScores)) {
      if (dimensions[dim]) {
        dimensions[dim].total += score;
        dimensions[dim].count += 1;
      }
    }
  }

  return {
    analyticalDepth: dimensions.analyticalDepth.count > 0
      ? Math.round(dimensions.analyticalDepth.total / dimensions.analyticalDepth.count)
      : 0,
    creativity: dimensions.creativity.count > 0
      ? Math.round(dimensions.creativity.total / dimensions.creativity.count)
      : 0,
    confidence: dimensions.confidence.count > 0
      ? Math.round(dimensions.confidence.total / dimensions.confidence.count)
      : 0,
    resilience: dimensions.resilience.count > 0
      ? Math.round(dimensions.resilience.total / dimensions.resilience.count)
      : 0,
    selfAwareness: dimensions.selfAwareness.count > 0
      ? Math.round(dimensions.selfAwareness.total / dimensions.selfAwareness.count)
      : 0,
  };
}

export { REFLECTION_BANK };
