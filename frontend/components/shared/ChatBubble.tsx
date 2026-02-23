import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types/chat';
import type { SpeechControls } from '../../types/speech';

interface ChatBubbleProps {
  message: ChatMessage;
  accentColor?: string;
  speech?: SpeechControls;
  /** @deprecated Use speech prop instead */
  onSpeak?: (text: string) => void;
  /** @deprecated Use speech prop instead */
  isSpeaking?: boolean;
}

/** Speaker icon — shape varies by volume level */
function SpeakerIcon({ volume }: { volume: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {volume === 0 ? (
        <>
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </>
      ) : volume < 0.5 ? (
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  );
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  accentColor = 'blue',
  speech,
  onSpeak,
  isSpeaking: legacyIsSpeaking,
}) => {
  const isUser = message.role === 'user';
  const bgClass = isUser
    ? `bg-${accentColor}-600`
    : 'bg-slate-800 border border-white/5';
  const alignClass = isUser ? 'justify-end' : 'justify-start';
  const roundedClass = isUser ? 'rounded-tr-none' : 'rounded-tl-none';

  const displayContent = message.content
    .replace(/\[REISE_VORSCHLAG\]/g, '')
    .replace(/\[STATION_COMPLETE\]/g, '')
    .replace(/\[CHALLENGE_COMPLETE\]/g, '')
    .replace(/\[EXERCISE_COMPLETE\]/g, '')
    .trim();

  // Volume popup state
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Close volume popup on outside click
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showVolume]);

  const isThisBubbleActive = speech ? speech.activeText === displayContent : false;
  const thisBubbleSpeaking = isThisBubbleActive && speech?.isSpeaking;
  const thisBubblePaused = isThisBubbleActive && speech?.isPaused;
  const thisBubbleLoading = isThisBubbleActive && speech?.isLoading;

  const handlePlayPause = () => {
    if (!speech) return;
    if (thisBubbleLoading) {
      speech.stop();
    } else if (thisBubbleSpeaking) {
      speech.pause();
    } else if (thisBubblePaused) {
      speech.resume();
    } else {
      speech.speak(displayContent);
    }
  };

  // Legacy rendering for old onSpeak/isSpeaking props
  if (!speech && !isUser && onSpeak) {
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
          <button
            onClick={() => onSpeak(displayContent)}
            className={`mt-2 flex items-center gap-1 text-[10px] transition-colors ${
              legacyIsSpeaking
                ? 'text-emerald-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={legacyIsSpeaking ? 'Spricht...' : 'Vorlesen'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {legacyIsSpeaking ? (
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
        </div>
      </div>
    );
  }

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

        {/* Speech controls — assistant bubbles only */}
        {!isUser && speech && (
          <div className="mt-2 flex items-center gap-1.5">
            {/* Play / Pause / Resume button */}
            <button
              onClick={handlePlayPause}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
                thisBubbleSpeaking || thisBubblePaused
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : thisBubbleLoading
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-slate-500 hover:text-slate-300'
              }`}
              title={
                thisBubbleLoading ? 'Laden... (klicken zum Stoppen)'
                  : thisBubbleSpeaking ? 'Pause'
                  : thisBubblePaused ? 'Fortsetzen'
                  : 'Vorlesen'
              }
            >
              {thisBubbleLoading ? (
                /* Spinner */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
              ) : thisBubbleSpeaking ? (
                /* Pause icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                /* Play / Resume icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            {/* Volume button + popup */}
            <div className="relative" ref={volumeRef}>
              <button
                onClick={() => setShowVolume((v) => !v)}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
                  showVolume ? 'text-slate-300' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Lautstaerke"
              >
                <SpeakerIcon volume={speech.volume} />
              </button>

              {showVolume && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-700/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 z-20 flex items-center gap-2 min-w-[140px]">
                  <SpeakerIcon volume={0} />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={speech.volume}
                    onChange={(e) => speech.setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 accent-emerald-400 bg-slate-600 rounded-full cursor-pointer"
                  />
                  <SpeakerIcon volume={1} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
