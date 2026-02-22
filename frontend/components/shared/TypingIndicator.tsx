import React from 'react';

interface TypingIndicatorProps {
  color?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  color = 'blue',
}) => (
  <div className="flex justify-start">
    <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
      <div
        className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`}
      />
      <div
        className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce [animation-delay:-0.15s]`}
      />
      <div
        className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce [animation-delay:-0.3s]`}
      />
    </div>
  </div>
);
