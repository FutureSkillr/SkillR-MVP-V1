import React from 'react';
import type { ChatMessage } from '../../types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  accentColor?: string;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  accentColor = 'blue',
  onSpeak,
  isSpeaking,
}) => {
  const isUser = message.role === 'user';
  const bgClass = isUser
    ? `bg-${accentColor}-600`
    : 'bg-slate-800 border border-white/5';
  const alignClass = isUser ? 'justify-end' : 'justify-start';
  const roundedClass = isUser ? 'rounded-tr-none' : 'rounded-tl-none';

  // Strip markers from display
  const displayContent = message.content
    .replace(/\[REISE_VORSCHLAG\]/g, '')
    .replace(/\[STATION_COMPLETE\]/g, '')
    .replace(/\[CHALLENGE_COMPLETE\]/g, '')
    .replace(/\[EXERCISE_COMPLETE\]/g, '')
    .trim();

  return (
    <div className={`flex ${alignClass}`}>
      <div
        className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${bgClass} ${roundedClass} ${
          isUser ? 'text-white' : 'text-slate-200'
        }`}
      >
        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </p>
        {!isUser && onSpeak && (
          <button
            onClick={() => onSpeak(displayContent)}
            className={`mt-2 flex items-center gap-1 text-[10px] transition-colors ${
              isSpeaking
                ? 'text-emerald-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={isSpeaking ? 'Spricht...' : 'Vorlesen'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isSpeaking ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
