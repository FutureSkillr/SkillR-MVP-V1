import React from 'react';
import type { VucaModule, VucaProgress } from '../../types/vuca';
import { VucaBingo } from './VucaBingo';

interface VucaDashboardProps {
  goal: string;
  modules: VucaModule[];
  progress: VucaProgress;
  onSelectModule: (moduleId: string) => void;
  onBack: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  V: 'border-red-500/30 hover:border-red-500/60',
  U: 'border-yellow-500/30 hover:border-yellow-500/60',
  C: 'border-blue-500/30 hover:border-blue-500/60',
  A: 'border-purple-500/30 hover:border-purple-500/60',
};

const CATEGORY_BADGES: Record<string, string> = {
  V: 'bg-red-500/20 text-red-400',
  U: 'bg-yellow-500/20 text-yellow-400',
  C: 'bg-blue-500/20 text-blue-400',
  A: 'bg-purple-500/20 text-purple-400',
};

export const VucaDashboard: React.FC<VucaDashboardProps> = ({
  goal,
  modules,
  progress,
  onSelectModule,
  onBack,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Dein VUCA-Lehrplan</h2>
          <p className="text-sm text-slate-400 mt-1">Berufsziel: {goal}</p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white transition-colors glass px-4 py-2 rounded-lg"
        >
          Zurueck
        </button>
      </div>

      {/* VUCA Bingo */}
      <VucaBingo progress={progress} />

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => !mod.completed && onSelectModule(mod.id)}
            disabled={mod.completed}
            className={`text-left glass rounded-xl p-4 border transition-all ${
              mod.completed
                ? 'opacity-60 border-green-500/30 cursor-default'
                : CATEGORY_COLORS[mod.category]
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${CATEGORY_BADGES[mod.category]}`}>
                {mod.category}
              </span>
              {mod.completed && (
                <span className="text-green-400 text-xs font-mono">&#10003; Fertig</span>
              )}
            </div>
            <h3 className="font-bold text-sm text-white mb-1">{mod.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{mod.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
