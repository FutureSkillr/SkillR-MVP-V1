import React from 'react';
import type { VucaProgress } from '../../types/vuca';
import { VUCA_THRESHOLD, VUCA_LABELS } from '../../types/vuca';

interface VucaBingoProps {
  progress: VucaProgress;
}

const COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  V: { bg: 'bg-red-500/10', bar: 'bg-red-500', text: 'text-red-400' },
  U: { bg: 'bg-yellow-500/10', bar: 'bg-yellow-500', text: 'text-yellow-400' },
  C: { bg: 'bg-blue-500/10', bar: 'bg-blue-500', text: 'text-blue-400' },
  A: { bg: 'bg-purple-500/10', bar: 'bg-purple-500', text: 'text-purple-400' },
};

export const VucaBingo: React.FC<VucaBingoProps> = ({ progress }) => {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="font-bold text-sm text-slate-300 mb-2">VUCA Bingo</h3>
      <div className="grid grid-cols-2 gap-3">
        {(['V', 'U', 'C', 'A'] as const).map((dim) => {
          const pct = progress[dim];
          const met = pct >= VUCA_THRESHOLD;
          const color = COLORS[dim];
          return (
            <div
              key={dim}
              className={`rounded-lg p-3 border ${met ? 'border-green-500/30' : 'border-white/5'} ${color.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-sm ${color.text}`}>
                  {dim} — {VUCA_LABELS[dim]}
                </span>
                {met && <span className="text-green-400 text-xs font-mono">&#10003;</span>}
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1 text-right">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
