import React from 'react';
import { getJourneysAsDefinitions, getStationsAsRecord } from '../services/contentResolver';
import type { JourneyType } from '../types/journey';
import type { OnboardingInsights } from '../types/user';

interface JourneySelectorProps {
  insights: OnboardingInsights | null;
  completedJourneys: JourneyType[];
  onSelect: (journey: JourneyType) => void;
  onViewProfile: () => void;
}

export const JourneySelector: React.FC<JourneySelectorProps> = ({
  insights,
  completedJourneys,
  onSelect,
  onViewProfile,
}) => {
  const JOURNEYS = getJourneysAsDefinitions();
  const FIRST_STATIONS = getStationsAsRecord();
  const journeyList = Object.values(JOURNEYS);
  const recommended = insights?.recommendedJourney || 'vuca';

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Summary */}
      {insights && (
        <div className="glass rounded-2xl p-6 space-y-3 text-center">
          <h2 className="text-xl font-bold">Dein Profil-Zwischenergebnis</h2>
          <p className="text-slate-300 text-sm">{insights.summary}</p>
          {insights.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {insights.interests.map((interest, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Journey Selection */}
      <h2 className="text-2xl font-bold text-center">Waehle deine Reise</h2>

      <div className="grid gap-6">
        {journeyList.map((journey) => {
          const isRecommended = journey.type === recommended;
          const isCompleted = completedJourneys.includes(journey.type);
          const station = FIRST_STATIONS[journey.type];

          return (
            <button
              key={journey.type}
              onClick={() => onSelect(journey.type)}
              className={`glass rounded-2xl p-6 text-left transition-all hover:scale-[1.01] ${
                isRecommended ? journey.glowClass : ''
              } ${isCompleted ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 ${journey.gradientClass} rounded-xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0`}
                >
                  {journey.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-bold ${journey.colorClass}`}>
                      {journey.title}
                    </h3>
                    {isRecommended && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                        Empfohlen
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 font-medium">
                        Abgeschlossen
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{journey.description}</p>
                  {station && (
                    <div className={`mt-3 p-3 rounded-lg ${journey.bgClass}`}>
                      <p className={`text-xs font-medium ${journey.colorClass}`}>
                        Erste Station: {station.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {station.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Profile Button */}
      {completedJourneys.length > 0 && (
        <div className="text-center pt-4">
          <button
            onClick={onViewProfile}
            className="glass px-6 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Mein Profil ansehen
          </button>
        </div>
      )}
    </div>
  );
};
