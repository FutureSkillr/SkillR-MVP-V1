import React, { useState, useCallback } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  accentColor?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Schreibe oder sprich...',
  accentColor = 'blue',
}) => {
  const [input, setInput] = useState('');

  const handleSpeechResult = useCallback((transcript: string) => {
    setInput(transcript);
  }, []);

  const { isListening, isProcessing, isSupported, toggle } =
    useSpeechRecognition(handleSpeechResult);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const isInputDisabled = disabled || isProcessing;

  return (
    <div className="p-4 bg-slate-900/50 border-t border-white/5">
      <div className="flex gap-2 items-center">
        {isSupported && (
          <button
            onClick={toggle}
            disabled={isProcessing}
            className={`p-3 rounded-xl transition-all flex items-center justify-center border ${
              isListening
                ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                : isProcessing
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500 cursor-wait'
                  : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
            title={
              isProcessing
                ? 'Wird transkribiert...'
                : isListening
                  ? 'Stoppe Aufnahme'
                  : 'Spracheingabe starten'
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            isProcessing
              ? 'Wird transkribiert...'
              : isListening
                ? 'Ich hoere zu...'
                : placeholder
          }
          disabled={isInputDisabled}
          className={`flex-1 bg-slate-950 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
            isListening
              ? 'border-red-500/50 focus:ring-red-500/20'
              : isProcessing
                ? 'border-yellow-500/50 focus:ring-yellow-500/20'
                : `border-white/10 focus:ring-${accentColor}-500/50`
          }`}
        />

        <button
          onClick={handleSend}
          disabled={isInputDisabled || !input.trim()}
          className={`bg-${accentColor}-600 hover:bg-${accentColor}-500 disabled:opacity-50 text-white rounded-xl px-6 py-3 font-bold transition-all flex items-center justify-center shadow-lg hover:shadow-${accentColor}-600/20`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      {isListening && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-red-500 font-mono uppercase tracking-widest animate-pulse">
            Sprachaufnahme aktiv
          </span>
        </div>
      )}
      {isProcessing && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-yellow-500 font-mono uppercase tracking-widest animate-pulse">
            Wird transkribiert...
          </span>
        </div>
      )}
    </div>
  );
};
