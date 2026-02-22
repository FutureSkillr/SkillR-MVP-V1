import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useGeminiChat } from '../../hooks/useGeminiChat';
import { useOfflineChat } from '../../hooks/useOfflineChat';
import { ChatBubble } from '../shared/ChatBubble';
import { ChatInput } from '../shared/ChatInput';
import { TypingIndicator } from '../shared/TypingIndicator';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { COACHES_BY_ID } from '../../constants/coaches';
import { buildSmalltalkPrompt, buildDemoPrompt, extractInterestsFromChat } from '../../services/introPrompts';
import { updateIntroMessages, markSmalltalkComplete, markDemoComplete } from '../../services/introStorage';
import type { CoachId } from '../../types/intro';

interface IntroChatProps {
  coachId: CoachId;
  onComplete: () => void;
  onBack: () => void;
}

type Phase = 'smalltalk' | 'demo';

export const IntroChat: React.FC<IntroChatProps> = ({ coachId, onComplete, onBack }) => {
  const coach = COACHES_BY_ID[coachId];
  const scrollRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>('smalltalk');
  const [phase, setPhase] = useState<Phase>('smalltalk');
  const [showCelebration, setShowCelebration] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const offlineTriggeredRef = useRef(false);
  const transitioningRef = useRef(false);

  const { isSpeaking, speak } = useSpeechSynthesis(
    coach.dialect.toLowerCase() === 'hochdeutsch' ? 'hochdeutsch' : 'hochdeutsch'
  );

  const smalltalkPrompt = useMemo(() => buildSmalltalkPrompt(coach), [coach]);

  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  const handleAssistantMessage = useCallback(
    (text: string) => {
      if (voiceEnabledRef.current) {
        setTimeout(() => speak(text), 1500);
      }
    },
    [speak]
  );

  const handleSmalltalkMarker = useCallback(
    (_marker: string, allMessages: { role: 'user' | 'assistant'; content: string; timestamp?: number }[]) => {
      if (transitioningRef.current) return;
      transitioningRef.current = true;

      const interests = extractInterestsFromChat(allMessages);
      markSmalltalkComplete(interests);

      phaseRef.current = 'demo';
      setPhase('demo');

      // Start demo conversation after a brief pause
      setTimeout(() => {
        if (offlineTriggeredRef.current) {
          offlineDemo.startDemo();
        } else {
          demoChat.startConversation(
            `Starte die Mini-Lern-Sequenz. Der User interessiert sich fuer: ${interests.join(', ')}. Fuehre eine kurze Uebung durch.`
          );
        }
        transitioningRef.current = false;
      }, 1000);
    },
    [coach]
  );

  const handleDemoMarker = useCallback(
    (_marker: string, _allMessages: { role: 'user' | 'assistant'; content: string; timestamp?: number }[]) => {
      markDemoComplete();
      setShowCelebration(true);
      setTimeout(() => onComplete(), 3000);
    },
    [onComplete]
  );

  const handleOnlineError = useCallback(() => {
    if (!offlineTriggeredRef.current) {
      offlineTriggeredRef.current = true;
      setOfflineMode(true);
    }
  }, []);

  const smalltalkChat = useGeminiChat({
    systemPrompt: smalltalkPrompt,
    markers: ['[SMALLTALK_DONE]'],
    onMarkerDetected: handleSmalltalkMarker,
    onAssistantMessage: handleAssistantMessage,
    onError: handleOnlineError,
  });

  const demoPromptStable = useMemo(
    () => buildDemoPrompt(coach, ['Kreativitaet']),
    [coach]
  );

  const demoChat = useGeminiChat({
    systemPrompt: demoPromptStable,
    markers: ['[DEMO_COMPLETE]'],
    onMarkerDetected: handleDemoMarker,
    onAssistantMessage: handleAssistantMessage,
    onError: handleOnlineError,
  });

  // Offline fallback hooks
  const offlineSmalltalk = useOfflineChat({
    coachName: coach.name,
    markers: ['[SMALLTALK_DONE]'],
    onMarkerDetected: handleSmalltalkMarker,
    onAssistantMessage: handleAssistantMessage,
  });

  const offlineDemo = useOfflineChat({
    coachName: coach.name,
    markers: ['[DEMO_COMPLETE]'],
    onMarkerDetected: handleDemoMarker,
    onAssistantMessage: handleAssistantMessage,
  });

  const activeChat = offlineMode
    ? (phase === 'smalltalk' ? offlineSmalltalk : offlineDemo)
    : (phase === 'smalltalk' ? smalltalkChat : demoChat);

  // Persist messages to localStorage
  useEffect(() => {
    updateIntroMessages(activeChat.messages);
  }, [activeChat.messages]);

  // Start smalltalk on mount
  useEffect(() => {
    smalltalkChat.startConversation(
      'Starte das Gespraech. Stell dich kurz vor und stelle deine erste Frage.'
    );
  }, [smalltalkChat.startConversation]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat.messages]);

  const activeSmalltalk = offlineMode ? offlineSmalltalk : smalltalkChat;
  const activeDemo = offlineMode ? offlineDemo : demoChat;

  const allMessages = phase === 'demo'
    ? [...activeSmalltalk.messages, ...activeDemo.messages]
    : activeSmalltalk.messages;

  const userMsgCount = allMessages.filter((m) => m.role === 'user').length;
  const progress = phase === 'smalltalk'
    ? Math.min(userMsgCount, 5)
    : 5 + Math.min(activeDemo.messages.filter((m) => m.role === 'user').length, 3);
  const progressMax = 8;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[100dvh] sm:h-[80vh] sm:my-4 glass sm:rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="bg-slate-900/50 p-3 sm:p-4 border-b border-white/5 flex items-center justify-between" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-2xl">{coach.emoji}</span>
          <div>
            <h2 className={`font-bold ${coach.colorClass}`}>{coach.name}</h2>
            <span className="text-[10px] text-slate-500">{coach.setting}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Progress bar on mobile, dots on desktop */}
          <div className="hidden sm:flex gap-1">
            {Array.from({ length: progressMax }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < progress ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-700'
                }`}
                style={i < progress ? { background: coach.color } : undefined}
              />
            ))}
          </div>
          <div className="sm:hidden w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(progress / progressMax) * 100}%`, background: coach.color }}
            />
          </div>
          {offlineMode && (
            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">
              Offline
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            {phase === 'smalltalk' ? 'Smalltalk' : 'Skill-Demo'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 scrollbar-thin scroll-pb-20">
        {allMessages.map((msg, idx) => (
          <ChatBubble
            key={idx}
            message={msg}
            accentColor={coach.color.replace('#', '')}
            onSpeak={speak}
            isSpeaking={isSpeaking}
          />
        ))}
        {activeChat.isLoading && <TypingIndicator />}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      {!showCelebration && (
        <ChatInput
          onSend={activeChat.sendMessage}
          disabled={activeChat.isLoading || transitioningRef.current}
          placeholder={phase === 'smalltalk' ? 'Erzaehl mir von dir...' : 'Probier es aus...'}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled((v) => !v)}
        />
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-10 px-4">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-4xl sm:text-6xl font-bold">+25 XP</div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${coach.color}, #a855f7)`, boxShadow: `0 0 40px ${coach.color}40` }}>
              <span className="text-3xl">&#11088;</span>
            </div>
            <h2 className="text-2xl font-bold">Erster Skill-Punkt!</h2>
            <p className="text-slate-400 text-sm">
              Du hast gerade deine erste Faehigkeit entdeckt. Registriere dich, um deinen Fortschritt zu sichern.
            </p>
          </div>
        </div>
      )}

      {/* Error fallback — offer offline mode or back */}
      {activeChat.hasError && !offlineMode && (
        <div className="p-3 bg-slate-900/80 border-t border-red-500/20 text-center space-x-4">
          <button
            onClick={() => {
              offlineTriggeredRef.current = true;
              setOfflineMode(true);
              offlineSmalltalk.startConversation('start');
            }}
            className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors min-h-[44px] px-3 inline-flex items-center"
          >
            Weiter im Offline-Modus
          </button>
          <button
            onClick={onBack}
            className="text-sm text-red-400 hover:text-red-300 underline transition-colors min-h-[44px] px-3 inline-flex items-center"
          >
            Zurueck
          </button>
        </div>
      )}
    </div>
  );
};
