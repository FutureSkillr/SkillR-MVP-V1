import { describe, it, expect, vi } from 'vitest';
import { computeInterestProfile, DIMENSION_TO_CATEGORY, CATEGORY_ORDER } from './interestProfile';
import type { StationResult } from '../types/journey';
import type { OnboardingInsights } from '../types/user';

vi.mock('./firestore', () => ({
  saveUserState: vi.fn(),
  loadUserState: vi.fn().mockResolvedValue(null),
}));

const mockInsights: OnboardingInsights = {
  interests: ['Technik', 'Kochen', 'Musik', 'Sport', 'Reisen'],
  strengths: ['Kreativitaet', 'Teamarbeit', 'Problemloesung'],
  preferredStyle: 'hands-on',
  recommendedJourney: 'vuca',
  summary: 'Du bist ein kreativer Entdecker.',
};

const mockVucaResult: StationResult = {
  stationId: 'vuca-01',
  journeyType: 'vuca',
  dimensionScores: { change: 80, uncertainty: 60, complexity: 70, ambiguity: 50 },
  summary: 'Gut gemacht in der VUCA-Station.',
  completedAt: Date.now(),
};

const mockEntrepreneurResult: StationResult = {
  stationId: 'entrepreneur-01',
  journeyType: 'entrepreneur',
  dimensionScores: { creativity: 90, initiative: 70, resilience: 60, 'value-creation': 80 },
  summary: 'Tolles Ergebnis.',
  completedAt: Date.now(),
};

describe('computeInterestProfile', () => {
  it('returns empty profile with no results', () => {
    const profile = computeInterestProfile([], null);
    expect(profile.skillCategories).toHaveLength(CATEGORY_ORDER.length);
    expect(profile.skillCategories.every((c) => c.score === 0)).toBe(true);
    expect(profile.topInterests).toEqual([]);
    expect(profile.completeness).toBe(0);
  });

  it('computes future-skills from VUCA dimensions', () => {
    const profile = computeInterestProfile([mockVucaResult], null);
    const futureSkills = profile.skillCategories.find((c) => c.key === 'future-skills');
    expect(futureSkills).toBeDefined();
    // Average of (80+60+70+50)/4 = 65
    expect(futureSkills!.score).toBe(65);
  });

  it('computes soft-skills from entrepreneur dimensions', () => {
    const profile = computeInterestProfile([mockEntrepreneurResult], null);
    const softSkills = profile.skillCategories.find((c) => c.key === 'soft-skills');
    // creativity (90) + initiative (70) → avg = 80
    expect(softSkills!.score).toBe(80);
  });

  it('computes resilience separately', () => {
    const profile = computeInterestProfile([mockEntrepreneurResult], null);
    const resilience = profile.skillCategories.find((c) => c.key === 'resilience');
    expect(resilience!.score).toBe(60);
  });

  it('computes hard-skills from value-creation', () => {
    const profile = computeInterestProfile([mockEntrepreneurResult], null);
    const hardSkills = profile.skillCategories.find((c) => c.key === 'hard-skills');
    expect(hardSkills!.score).toBe(80);
  });

  it('aggregates multiple station results', () => {
    const profile = computeInterestProfile([mockVucaResult, mockEntrepreneurResult], null);
    // future-skills still 65 (only VUCA dims map there)
    const futureSkills = profile.skillCategories.find((c) => c.key === 'future-skills');
    expect(futureSkills!.score).toBe(65);
    // soft-skills still 80
    const softSkills = profile.skillCategories.find((c) => c.key === 'soft-skills');
    expect(softSkills!.score).toBe(80);
  });

  it('extracts top interests from onboarding insights', () => {
    const profile = computeInterestProfile([], mockInsights);
    expect(profile.topInterests).toEqual(['Technik', 'Kochen', 'Musik', 'Sport', 'Reisen']);
    expect(profile.topStrengths).toEqual(['Kreativitaet', 'Teamarbeit', 'Problemloesung']);
  });

  it('calculates completeness based on filled categories and onboarding', () => {
    // No data → 0
    expect(computeInterestProfile([], null).completeness).toBe(0);

    // Onboarding only → 0.2
    expect(computeInterestProfile([], mockInsights).completeness).toBe(0.2);

    // VUCA only fills 1 category (future-skills) + no onboarding
    const p1 = computeInterestProfile([mockVucaResult], null);
    expect(p1.completeness).toBeCloseTo(0.2); // 1/4 * 0.8

    // Entrepreneur fills 3 categories + onboarding
    const p2 = computeInterestProfile([mockEntrepreneurResult], mockInsights);
    expect(p2.completeness).toBeCloseTo(0.8); // 0.2 + 3/4 * 0.8

    // Both results + onboarding → all 4 categories filled
    const p3 = computeInterestProfile([mockVucaResult, mockEntrepreneurResult], mockInsights);
    expect(p3.completeness).toBe(1);
  });

  it('has correct category labels', () => {
    const profile = computeInterestProfile([], null);
    const labels = profile.skillCategories.map((c) => c.label);
    expect(labels).toEqual(['Future Skills', 'Soft Skills', 'Hard Skills', 'Resilienz']);
  });

  it('dimension to category mapping is complete for known dimensions', () => {
    const knownDims = [
      'change', 'uncertainty', 'complexity', 'ambiguity',
      'creativity', 'initiative', 'resilience', 'value-creation',
      'metacognition', 'transfer', 'curiosity', 'persistence', 'self-direction',
    ];
    for (const dim of knownDims) {
      expect(DIMENSION_TO_CATEGORY[dim]).toBeDefined();
    }
  });
});
