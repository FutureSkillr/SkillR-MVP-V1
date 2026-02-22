import React from 'react';

interface QueueIndicatorProps {
  position: number;
  estimatedWaitMs: number;
}

function formatWait(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) return 'weniger als 1 Minute';
  return `ca. ${minutes} Minuten`;
}

export const QueueIndicator: React.FC<QueueIndicatorProps> = ({ position, estimatedWaitMs }) => {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
      {/* Animated position */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="absolute inset-0 w-14 h-14 animate-spin-slow" viewBox="0 0 56 56">
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            stroke="rgba(59,130,246,0.2)"
            strokeWidth="3"
          />
          <circle
            cx="28" cy="28" r="24"
            fill="none"
            stroke="rgba(59,130,246,0.8)"
            strokeWidth="3"
            strokeDasharray="151"
            strokeDashoffset="113"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-xl font-bold text-blue-400">#{position}</span>
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-white">
          Du bist an Position {position} in der Warteschlange
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Geschaetzte Wartezeit: {formatWait(estimatedWaitMs)}
        </p>
      </div>
    </div>
  );
};
