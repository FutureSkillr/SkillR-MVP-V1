import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useGeminiChat } from '../../hooks/useGeminiChat';
import { useOfflineChat } from '../../hooks/useOfflineChat';
import { useAiStatus } from '../../hooks/useAiStatus';
import { ChatBubble } from '../shared/ChatBubble';
import { ChatInput } from '../shared/ChatInput';
import { TypingIndicator } from '../shared/TypingIndicator';
import { AiStatusDiamond } from '../shared/AiStatusDiamond';
import { useSpeechSynthesis, unlockAudio } from '../../hooks/useSpeechSynthesis';
import { getDialectForCoach } from '../../types/user';
import { COACHES_BY_ID } from '../../constants/coaches';
import { buildSmalltalkPrompt, buildDemoPrompt, extractInterestsFromChat } from '../../services/introPrompts';
import { loadIntroState, updateIntroMessages, markSmalltalkComplete, markDemoComplete, markFastForward } from '../../services/introStorage';
import { trackIntroFastForward } from '../../services/analytics';
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
  const chatStartedRef = useRef(false);

  const speech = useSpeechSynthesis(getDialectForCoach(coachId));
  const { speak } = speech;
  const aiStatus = useAiStatus();

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

  const handleFastForward = useCallback(() => {
    const state = loadIntroState();
    const durationMs = state ? Date.now() - state.startedAt : 0;
    const msgCount = state?.messages?.length ?? 0;
    markFastForward();
    trackIntroFastForward(coachId, phase, msgCount, durationMs);
    onComplete();
  }, [coachId, phase, onComplete]);

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

  // Start smalltalk once AI status is known (wait for the first status check)
  useEffect(() => {
    if (chatStartedRef.current) return;

    if (aiStatus.status === 'connected') {
      // AI is available — start online chat
      chatStartedRef.current = true;
      smalltalkChat.startConversation(
        'Starte das Gespraech. Stell dich kurz vor und stelle deine erste Frage.'
      );
    } else if (aiStatus.status === 'error' || aiStatus.status === 'network_error') {
      // AI unavailable — start in offline mode directly
      chatStartedRef.current = true;
      offlineTriggeredRef.current = true;
      setOfflineMode(true);
      offlineSmalltalk.startConversation('start');
    }
    // 'unknown' → still checking, don't start yet
  }, [aiStatus.status, smalltalkChat.startConversation, offlineSmalltalk.startConversation]);

  // Safety timeout: if status is still 'unknown' after 5s, try online anyway
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!chatStartedRef.current) {
        chatStartedRef.current = true;
        smalltalkChat.startConversation(
          'Starte das Gespraech. Stell dich kurz vor und stelle deine erste Frage.'
        );
      }
    }, 5000);
    return () => clearTimeout(timer);
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-slate-500 hover:text-white text-sm transition-colors inline-flex items-center gap-1 min-h-[44px] min-w-[44px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Zurück
            </button>
            {!showCelebration && (
              <button
                onClick={handleFastForward}
                className="text-slate-500 hover:text-white text-sm transition-colors inline-flex items-center gap-1 min-h-[44px] min-w-[44px]"
              >
                Weiter
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            <span className="gradient-text animate-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Vorstellungsrunde
            </span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Erfahre wie wir gemeinsam lernen wollen...
          </p>
        </div>

        {/* Chat Dialog */}
        <div className="flex flex-col h-[70dvh] sm:h-[65vh] glass rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Chat Header */}
          <div className="bg-slate-900/50 p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-2xl">{coach.emoji}</span>
              <div>
                <h2 className={`font-bold ${coach.colorClass} flex items-center gap-1.5`}>
                  {coach.name}
                  <AiStatusDiamond
                    status={offlineMode ? 'network_error' : activeChat.hasError ? 'error' : aiStatus.status}
                    latencyMs={aiStatus.latencyMs}
                    size={14}
                  />
                </h2>
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
                speech={speech}
              />
            ))}
            {activeChat.isLoading && <TypingIndicator />}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          {!showCelebration && (
            <ChatInput
              onSend={(msg) => { unlockAudio(); activeChat.sendMessage(msg); }}
              disabled={activeChat.isLoading || transitioningRef.current}
              placeholder={phase === 'smalltalk' ? 'Erzähl mir von dir...' : 'Probier es aus...'}
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
                  Du hast gerade deine erste Fähigkeit entdeckt. Registriere dich, um deinen Fortschritt zu sichern.
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
                Zurück
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
