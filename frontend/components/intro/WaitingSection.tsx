import React, { useState } from 'react';
import { COACHES } from '../../constants/coaches';
import { QueueIndicator } from './QueueIndicator';
import { EmailBookingForm } from './EmailBookingForm';
import { useBrand } from '../../contexts/BrandContext';
import type { CapacityStatus } from '../../services/capacity';

interface WaitingSectionProps {
  capacity: CapacityStatus;
  emphasized: boolean;
}

const ENTERTAINMENT_ITEMS = [
  {
    type: 'tip' as const,
    emoji: '\u{1F4A1}',
    title: 'Wusstest du?',
    text: 'Die VUCA-Welt steht fuer Volatility, Uncertainty, Complexity und Ambiguity — genau die Faehigkeiten, die du auf deiner Reise entdecken wirst.',
  },
  {
    type: 'tip' as const,
    emoji: '\u{1F30D}',
    title: 'Deine Reise',
    text: 'Jeder Coach hat seinen eigenen Stil. Manche sind locker, andere fordern dich heraus. Probier verschiedene aus!',
  },
  {
    type: 'tip' as const,
    emoji: '\u{1F3AF}',
    title: 'Kein Test',
    text: 'Es gibt hier keine falschen Antworten. Wir entdecken, was dich begeistert — nicht was du "kannst".',
  },
  {
    type: 'tip' as const,
    emoji: '\u{1F680}',
    title: 'Skill-Punkte',
    text: 'Du sammelst XP fuer jede Interaktion. Je mehr du entdeckst, desto mehr Punkte bekommst du!',
  },
];

export const WaitingSection: React.FC<WaitingSectionProps> = ({ capacity, emphasized }) => {
  const { brand } = useBrand();
  const [activeCoachIdx, setActiveCoachIdx] = useState(0);
  const [activeTipIdx, setActiveTipIdx] = useState(0);

  const isQueued = !capacity.available && capacity.queue.position > 0;
  const coach = COACHES[activeCoachIdx];
  const tip = ENTERTAINMENT_ITEMS[activeTipIdx];

  const nextCoach = () => setActiveCoachIdx((i) => (i + 1) % COACHES.length);
  const prevCoach = () => setActiveCoachIdx((i) => (i - 1 + COACHES.length) % COACHES.length);
  const nextTip = () => setActiveTipIdx((i) => (i + 1) % ENTERTAINMENT_ITEMS.length);

  return (
    <div className={`space-y-6 transition-all duration-500 ${emphasized ? 'opacity-100' : 'opacity-70'}`}>
      {/* Queue indicator */}
      {isQueued && (
        <QueueIndicator
          position={capacity.queue.position}
          estimatedWaitMs={capacity.queue.estimatedWaitMs}
        />
      )}

      {/* Coach preview carousel */}
      <div className="glass rounded-2xl p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-300">Lerne die Coaches kennen</h3>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={prevCoach}
            className="text-slate-500 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Vorheriger Coach"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="flex-1 text-center space-y-2">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-lg"
              style={{ background: `linear-gradient(135deg, ${coach.color}40, ${coach.color}20)`, border: `2px solid ${coach.color}40` }}
            >
              {coach.emoji}
            </div>
            <h4 className="font-bold" style={{ color: coach.color }}>{coach.name}</h4>
            <p className="text-xs text-slate-400">{coach.setting}</p>
            <p className="text-xs text-slate-500 italic">"{coach.tagline}"</p>
          </div>

          <button
            onClick={nextCoach}
            className="text-slate-500 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Naechster Coach"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Coach dots */}
        <div className="flex justify-center gap-1">
          {COACHES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveCoachIdx(i)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <div className={`w-2 h-2 rounded-full transition-colors ${i === activeCoachIdx ? 'bg-blue-500' : 'bg-slate-700'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Tips / entertainment */}
      <button
        onClick={nextTip}
        className="w-full glass rounded-2xl p-5 text-left space-y-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{tip.emoji}</span>
          <h3 className="text-sm font-bold text-slate-300">{tip.title}</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{tip.text}</p>
        <p className="text-[10px] text-slate-600 text-right">Tippe fuer mehr →</p>
      </button>

      {/* Email booking (only when queued) */}
      {isQueued && capacity.queue.ticketId && (
        <div className="glass rounded-2xl p-5">
          <EmailBookingForm ticketId={capacity.queue.ticketId} />
        </div>
      )}
    </div>
  );
};
