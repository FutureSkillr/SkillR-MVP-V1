import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getJourneysAsDefinitions, getAllDimensions, getStations } from '../services/contentResolver';
import { COACHES } from '../constants/coaches';
import { CoachCard } from './intro/CoachCard';
import type { UserProfile } from '../types/user';
import type { CoachId } from '../types/intro';
import type { StationResult, JourneyType } from '../types/journey';

// --- Activity Timeline helpers ---

interface ActivityEvent {
  id: string;
  type: 'onboarding' | 'station';
  title: string;
  description: string;
  timestamp: number;
  journeyType?: JourneyType;
  icon: string;
}

const JOURNEY_BG: Record<JourneyType, string> = {
  vuca: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  entrepreneur: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  'self-learning': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
};

const JOURNEY_DOT: Record<JourneyType, string> = {
  vuca: 'bg-blue-500',
  entrepreneur: 'bg-orange-500',
  'self-learning': 'bg-purple-500',
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Gerade eben';
  if (minutes < 60) return `Vor ${minutes} Min.`;
  if (hours < 24) return `Vor ${hours} Std.`;
  if (days === 1) return 'Gestern';
  if (days < 7) return `Vor ${days} Tagen`;
  const date = new Date(timestamp);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildActivityTimeline(
  profile: UserProfile,
  stationResults: StationResult[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const stationDefs = getStations();
  const stationLookup = new Map(stationDefs.map((s) => [s.id, s]));

  if (profile.onboardingInsights) {
    events.push({
      id: 'onboarding',
      type: 'onboarding',
      title: 'Onboarding abgeschlossen',
      description: profile.onboardingInsights.summary || 'Interessen und Staerken erfasst',
      timestamp: (profile as any).onboardingCompletedAt || Date.now() - 86400000,
      icon: '💬',
    });
  }

  for (const result of stationResults) {
    const def = stationLookup.get(result.stationId);
    const title = def?.title || result.stationId;
    events.push({
      id: `station-${result.stationId}-${result.completedAt}`,
      type: 'station',
      title: `${title} abgeschlossen`,
      description: result.summary || 'Station beendet',
      timestamp: result.completedAt,
      journeyType: result.journeyType,
      icon: '🎯',
    });
  }

  events.sort((a, b) => b.timestamp - a.timestamp);
  return events;
}

interface CombinedProfileProps {
  profile: UserProfile;
  stationResults: StationResult[];
  onBack: () => void;
  onSelectJourney: () => void;
  onCoachChange?: (coachId: CoachId) => void;
}

export const CombinedProfile: React.FC<CombinedProfileProps> = ({
  profile,
  stationResults,
  onBack,
  onSelectJourney,
  onCoachChange,
}) => {
  // FR-070 AC8: 3-tier responsive radar chart sizing
  const [radarSize, setRadarSize] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < 400 ? 220 : window.innerWidth < 640 ? 280 : 350
      : 350
  );
  useEffect(() => {
    const handleResize = () => {
      setRadarSize(window.innerWidth < 400 ? 220 : window.innerWidth < 640 ? 280 : 350);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Aggregate scores per dimension across all station results
  const dimensionAggregates: Record<string, { total: number; count: number }> = {};
  for (const result of stationResults) {
    for (const [dim, score] of Object.entries(result.dimensionScores)) {
      if (!dimensionAggregates[dim]) {
        dimensionAggregates[dim] = { total: 0, count: 0 };
      }
      dimensionAggregates[dim].total += score as number;
      dimensionAggregates[dim].count += 1;
    }
  }

  // Build radar chart data from all dimensions
  const ALL_DIMENSIONS = getAllDimensions();
  const radarData = ALL_DIMENSIONS.map((dim) => {
    const agg = dimensionAggregates[dim.key];
    return {
      dimension: dim.experienceLabel,
      score: agg ? Math.round(agg.total / agg.count) : 0,
      fullMark: 100,
    };
  });

  // Per-journey progress
  const journeyList = Object.values(getJourneysAsDefinitions());
  const completedPerJourney: Record<JourneyType, number> = {
    vuca: 0,
    entrepreneur: 0,
    'self-learning': 0,
  };
  for (const result of stationResults) {
    completedPerJourney[result.journeyType] += 1;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Dein Profil</h1>
        <p className="text-slate-400 text-sm">
          {profile.onboardingInsights?.summary ||
            'Deine Faehigkeiten auf einen Blick.'}
        </p>
      </div>

      {/* Radar Chart */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 text-center">
          Faehigkeiten-Radar
        </h2>
        {stationResults.length > 0 ? (
          <ResponsiveContainer width="100%" height={radarSize}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#475569', fontSize: 10 }}
              />
              <Radar
                name="Dein Profil"
                dataKey="score"
                stroke="#818cf8"
                fill="#818cf8"
                fillOpacity={0.3}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-4">📊</p>
            <p>Schliesse deine erste Station ab, um dein Profil zu sehen.</p>
          </div>
        )}
      </div>

      {/* Journey Progress */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">Reise-Fortschritt</h2>
        {journeyList.map((journey) => {
          const completed = completedPerJourney[journey.type];
          const progress = Math.min(completed * 33, 100);

          return (
            <div key={journey.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${journey.colorClass}`}>
                  {journey.icon} {journey.title}
                </span>
                <span className="text-xs text-slate-500">
                  {completed} Station{completed !== 1 ? 'en' : ''} abgeschlossen
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${journey.gradientClass} rounded-full transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interests & Strengths */}
      {profile.onboardingInsights && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-sm text-slate-300">Deine Interessen</h3>
            <div className="flex flex-wrap gap-2">
              {profile.onboardingInsights.interests.map((interest, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-sm text-slate-300">Deine Staerken</h3>
            <div className="flex flex-wrap gap-2">
              {profile.onboardingInsights.strengths.map((strength, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/20"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coach Selection */}
      <div className="space-y-4">
        <div className="px-1">
          <h2 className="text-lg font-bold">Dein Coach</h2>
          <p className="text-xs text-slate-400 mt-1">
            Jeder Coach hat seinen eigenen Stil und Dialekt. Du kannst jederzeit wechseln.
          </p>
        </div>
        <div className="border border-slate-700/50 rounded-2xl p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {COACHES.map((coach) => (
              <div key={coach.id} className="h-full">
                <CoachCard
                  coach={coach}
                  selected={profile.coachId === coach.id}
                  dimmed={!!profile.coachId && profile.coachId !== coach.id}
                  onSelect={(id) => onCoachChange?.(id as CoachId)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity History */}
      {(() => {
        const events = buildActivityTimeline(profile, stationResults);
        if (events.length === 0) return null;
        return (
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">Aktivitaeten</h2>
            <div className="relative space-y-0">
              {events.map((event, idx) => {
                const dotColor = event.journeyType
                  ? JOURNEY_DOT[event.journeyType]
                  : 'bg-slate-500';
                const tagClass = event.journeyType
                  ? JOURNEY_BG[event.journeyType]
                  : 'bg-slate-500/10 border-slate-500/20 text-slate-400';
                const journeyLabel = event.journeyType
                  ? Object.values(getJourneysAsDefinitions()).find(
                      (j) => j.type === event.journeyType,
                    )?.title
                  : null;
                const isLast = idx === events.length - 1;

                return (
                  <div key={event.id} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${dotColor} mt-1.5 shrink-0`}
                      />
                      {!isLast && (
                        <div className="w-px flex-1 bg-slate-700/50" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-6 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-200">
                          {event.icon} {event.title}
                        </span>
                        {journeyLabel && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${tagClass}`}
                          >
                            {journeyLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex gap-4 justify-center pt-4">
        <button
          onClick={onBack}
          className="glass px-6 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={onSelectJourney}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
        >
          Nächste Reise starten
        </button>
      </div>
    </div>
  );
};
