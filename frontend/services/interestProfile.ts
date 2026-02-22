/**
 * Interest Profile Tracking (FR-014)
 *
 * Aggregates dimension scores from station results and onboarding insights
 * into a structured interest profile with skill category breakdowns.
 * Frontend-first implementation; will migrate to Go backend later.
 */

import type { StationResult } from '../types/journey';
import type { OnboardingInsights } from '../types/user';
import { saveUserState, loadUserState } from './firestore';

export interface SkillCategory {
  key: string;
  label: string;
  score: number;       // 0-100, averaged
  dimensions: string[]; // contributing dimension keys
}

export interface InterestProfile {
  /** Aggregated skill categories with averaged scores. */
  skillCategories: SkillCategory[];
  /** Top 5 interests extracted from interactions. */
  topInterests: string[];
  /** Top 3 strengths. */
  topStrengths: string[];
  /** Overall profile completeness (0-1). */
  completeness: number;
  /** When the profile was last updated. */
  lastUpdated: number;
}

/** Maps dimension keys to skill categories. */
const DIMENSION_TO_CATEGORY: Record<string, string> = {
  // VUCA dimensions → Future Skills
  change: 'future-skills',
  uncertainty: 'future-skills',
  complexity: 'future-skills',
  ambiguity: 'future-skills',
  // Entrepreneur dimensions → Soft Skills + Hard Skills
  creativity: 'soft-skills',
  initiative: 'soft-skills',
  resilience: 'resilience',
  'value-creation': 'hard-skills',
  // Self-Learning dimensions → mix
  metacognition: 'soft-skills',
  transfer: 'hard-skills',
  curiosity: 'soft-skills',
  persistence: 'resilience',
  'self-direction': 'future-skills',
};

const CATEGORY_LABELS: Record<string, string> = {
  'hard-skills': 'Hard Skills',
  'soft-skills': 'Soft Skills',
  'future-skills': 'Future Skills',
  resilience: 'Resilienz',
};

const CATEGORY_ORDER = ['future-skills', 'soft-skills', 'hard-skills', 'resilience'];

/**
 * Compute an interest profile from station results and onboarding data.
 */
export function computeInterestProfile(
  stationResults: StationResult[],
  insights: OnboardingInsights | null,
): InterestProfile {
  // Aggregate scores per dimension
  const dimScores: Record<string, { total: number; count: number }> = {};
  for (const result of stationResults) {
    for (const [dim, score] of Object.entries(result.dimensionScores)) {
      if (!dimScores[dim]) dimScores[dim] = { total: 0, count: 0 };
      dimScores[dim].total += score as number;
      dimScores[dim].count += 1;
    }
  }

  // Group into categories
  const categoryScores: Record<string, { total: number; count: number; dims: string[] }> = {};
  for (const [dim, agg] of Object.entries(dimScores)) {
    const cat = DIMENSION_TO_CATEGORY[dim] || 'future-skills';
    if (!categoryScores[cat]) categoryScores[cat] = { total: 0, count: 0, dims: [] };
    const avg = agg.total / agg.count;
    categoryScores[cat].total += avg;
    categoryScores[cat].count += 1;
    categoryScores[cat].dims.push(dim);
  }

  const skillCategories: SkillCategory[] = CATEGORY_ORDER.map((key) => {
    const cat = categoryScores[key];
    return {
      key,
      label: CATEGORY_LABELS[key] || key,
      score: cat ? Math.round(cat.total / cat.count) : 0,
      dimensions: cat?.dims || [],
    };
  });

  // Extract interests and strengths
  const topInterests = insights?.interests.slice(0, 5) || [];
  const topStrengths = insights?.strengths.slice(0, 3) || [];

  // Completeness: based on how many categories have scores > 0
  const filledCategories = skillCategories.filter((c) => c.score > 0).length;
  const hasOnboarding = insights !== null ? 0.2 : 0;
  const completeness = Math.min(hasOnboarding + (filledCategories / CATEGORY_ORDER.length) * 0.8, 1);

  return {
    skillCategories,
    topInterests,
    topStrengths,
    completeness,
    lastUpdated: Date.now(),
  };
}

const PROFILE_KEY = 'interest-profile';

export async function saveInterestProfile(profile: InterestProfile): Promise<void> {
  return saveUserState(PROFILE_KEY, profile);
}

export async function loadInterestProfile(): Promise<InterestProfile | null> {
  return loadUserState<InterestProfile | null>(PROFILE_KEY, null);
}

export { DIMENSION_TO_CATEGORY, CATEGORY_LABELS, CATEGORY_ORDER };
