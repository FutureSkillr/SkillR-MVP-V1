import React, { useRef } from 'react';
import { COACHES } from '../../constants/coaches';
import { CoachCard } from './CoachCard';
import { WaitingSection } from './WaitingSection';
import { useCapacityPolling } from '../../hooks/useCapacityPolling';
import { trackVisitorWaiting } from '../../services/analytics';
import type { CoachId } from '../../types/intro';

interface CoachSelectPageProps {
  onSelect: (coachId: CoachId, waitTimeMs?: number) => void;
  onBack: () => void;
}

export const CoachSelectPage: React.FC<CoachSelectPageProps> = ({ onSelect, onBack }) => {
  const { capacity } = useCapacityPolling(true);
  const waitStartRef = useRef<number>(Date.now());

  const isQueueActive = capacity?.queueEnabled && !capacity.available;

  // FR-063: Track waiting when queue is active
  React.useEffect(() => {
    if (isQueueActive && capacity) {
      trackVisitorWaiting(capacity.queue.position);
    }
  }, [isQueueActive, capacity]);

  // Auto-redirect when slot becomes available (if user already picked a coach via queue)

  const handleSelect = (coachId: CoachId) => {
    // If queue is active and no slot available, don't allow through
    if (isQueueActive) return;
    const waitTimeMs = Date.now() - waitStartRef.current;
    onSelect(coachId, waitTimeMs);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-white text-sm transition-colors mb-4 inline-flex items-center gap-1 min-h-[44px] min-w-[44px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Zurück
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            Wähle Deinen{' '}
            <span className="gradient-text animate-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Coach
            </span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Jeder Coach hat seinen eigenen Stil. Such dir jemanden aus, der zu dir passt.
          </p>
        </div>

        {/* Main layout: side-by-side when queue active, full-width when not */}
        <div className={`${isQueueActive ? 'grid grid-cols-1 lg:grid-cols-5 gap-8' : ''}`}>
          {/* Waiting section — emphasized when queue is active */}
          {capacity && capacity.queueEnabled && (
            <div className={`${isQueueActive ? 'lg:col-span-2 order-first' : 'max-w-md mx-auto mb-6'}`}>
              <WaitingSection capacity={capacity} emphasized={!!isQueueActive} />
            </div>
          )}

          {/* Coach Grid */}
          <div className={isQueueActive ? 'lg:col-span-3' : ''}>
            <div className="border border-slate-700/50 rounded-2xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {COACHES.map((coach) => (
                  <div
                    key={coach.id}
                    className={`h-full ${isQueueActive ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <CoachCard coach={coach} onSelect={handleSelect} />
                  </div>
                ))}
              </div>
            </div>

            {isQueueActive && (
              <p className="text-center text-xs text-amber-400/80 mt-4">
                Geduld! Sobald ein Platz frei wird, kannst du deinen Coach wählen.
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Du kannst später jederzeit einen anderen Coach wählen.
        </p>
      </div>
    </div>
  );
};
