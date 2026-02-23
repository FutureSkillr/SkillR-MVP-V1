import React from 'react';
import type { CoachPersona } from '../../types/intro';
import { CoachAvatar } from './CoachAvatar';

interface CoachCardProps {
  coach: CoachPersona;
  selected?: boolean;
  /** When true, card is greyed out (non-selected in profile view). On hover it briefly shows in color. */
  dimmed?: boolean;
  onSelect: (coachId: CoachPersona['id']) => void;
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, selected, dimmed, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(coach.id)}
      className={`glass rounded-2xl p-3 sm:p-5 text-left space-y-2 sm:space-y-3 hover:scale-[1.03] active:scale-95 transition-all border group h-full flex flex-col ${
        selected
          ? `border-2 ${coach.borderClass.replace('/30', '/60')} shadow-lg`
          : dimmed
            ? 'border-slate-700/30 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
            : `${coach.borderClass} hover:border-opacity-60`
      }`}
      style={selected ? { boxShadow: `0 0 24px ${coach.color}25` } : undefined}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <CoachAvatar coach={coach} size="sm" />
        <div className="min-w-0">
          <h3 className={`font-bold text-sm sm:text-lg ${coach.colorClass} truncate`}>{coach.name}</h3>
          <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full ${coach.bgClass} ${coach.colorClass}`}>
            {coach.dialect}
          </span>
        </div>
        {selected && (
          <svg className={`ml-auto shrink-0 ${coach.colorClass}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2" style={{ minHeight: '2lh' }}>{coach.tagline}</p>
      <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">{coach.setting}</p>
      {!selected && (
        <div className={`text-xs font-semibold ${coach.colorClass} sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-auto`}>
          Wählen
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </button>
  );
};
