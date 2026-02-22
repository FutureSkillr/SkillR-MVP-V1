import React from 'react';
import type { EngagementState } from '../types/engagement';
import { getXPForNextLevel } from '../services/engagement';

interface EngagementBarProps {
  engagement: EngagementState;
}

export const EngagementBar: React.FC<EngagementBarProps> = ({ engagement }) => {
  const { progress } = getXPForNextLevel(engagement.totalXP);

  return (
    <div className="flex items-center gap-4 text-xs">
      {/* Streak */}
      <div className="flex items-center gap-1" title={`${engagement.currentStreak} Tage Reisekette`}>
        <span className={`text-base ${engagement.currentStreak > 0 ? 'animate-pulse' : 'opacity-40'}`}>
          &#x1F525;
        </span>
        <span className={`font-bold tabular-nums ${engagement.currentStreak > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
          {engagement.currentStreak}
        </span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1" title={`${engagement.totalXP} XP gesamt`}>
        <span className="text-yellow-400 font-bold">XP</span>
        <span className="text-slate-300 font-mono tabular-nums">{engagement.totalXP}</span>
      </div>

      {/* Level with progress */}
      <div className="flex items-center gap-2" title={`Level ${engagement.level}: ${engagement.levelTitle}`}>
        <span className="text-purple-400 font-medium">Lv.{engagement.level}</span>
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
