import React, { useState, useEffect, useRef } from 'react';

interface SessionTimerProps {
  /** Timer starts when component mounts. */
  className?: string;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ className = '' }) => {
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isLong = minutes >= 5;

  return (
    <div className={`flex items-center gap-1.5 text-[10px] tabular-nums ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isLong ? 'bg-yellow-400' : 'bg-emerald-400'} animate-pulse`} />
      <span className={isLong ? 'text-yellow-400' : 'text-slate-500'}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};
