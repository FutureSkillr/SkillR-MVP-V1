import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { usePromptLogSession } from '../hooks/usePromptLogSession';
import { getPrompts } from '../services/contentResolver';
import { createLoggingGeminiService } from '../services/geminiWithLogging';
import { geminiService } from '../services/gemini';
import { trackChatSessionEnd } from '../services/analytics';
import { ChatBubble } from './shared/ChatBubble';
import { ChatInput } from './shared/ChatInput';
import { TypingIndicator } from './shared/TypingIndicator';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import type { OnboardingInsights, VoiceDialect } from '../types/user';
import type { ChatMessage } from '../types/chat';

interface OnboardingChatProps {
  onComplete: (insights: OnboardingInsights) => void;
  onBack: () => void;
  voiceEnabled?: boolean;
  voiceDialect?: VoiceDialect;
}

export const OnboardingChat: React.FC<OnboardingChatProps> = ({
  onComplete,
  onBack,
  voiceEnabled = false,
  voiceDialect = 'hochdeutsch',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const completingRef = useRef(false);
  const chatStartTime = useRef(Date.now());
  const { isSpeaking, speak } = useSpeechSynthesis(voiceDialect);

  const { sessionId, sessionType } = usePromptLogSession({
    sessionType: 'onboarding',
  });

  const systemPrompt = useMemo(() => getPrompts().onboarding, []);

  const handleMarker = useCallback(
    async (_marker: string, allMessages: ChatMessage[]) => {
      if (completingRef.current) return;
      completingRef.current = true;

      const userMsgs = allMessages.filter((m) => m.role === 'user');
      const totalLen = allMessages.reduce((s, m) => s + m.content.length, 0);
      trackChatSessionEnd(
        allMessages.length,
        userMsgs.length,
        allMessages.length > 0 ? totalLen / allMessages.length : 0,
        Date.now() - chatStartTime.current,
        'completed',
        'onboarding',
        sessionId,
      );

      try {
        const loggingService = createLoggingGeminiService(sessionId, sessionType);
        const insights = await loggingService.extractInsights(allMessages);
        setTimeout(() => onComplete(insights), 1500);
      } catch (error) {
        console.error('Failed to extract insights:', error);
        try {
          const { data } = await geminiService.extractInsights(allMessages);
          setTimeout(() => onComplete(data), 1500);
        } catch {
          onComplete({
            interests: [],
            strengths: [],
            preferredStyle: 'hands-on',
            recommendedJourney: 'vuca',
            summary: 'Profil wird erstellt...',
          });
        }
      }
    },
    [onComplete, sessionId, sessionType]
  );

  const handleAssistantMessage = useCallback(
    (text: string) => {
      if (voiceEnabled) {
        // Delay TTS to avoid stacking Gemini API calls (rate limit)
        setTimeout(() => speak(text), 1500);
      }
    },
    [voiceEnabled, speak]
  );

  const { messages, isLoading, hasError, sendMessage, startConversation } =
    useGeminiChat({
      systemPrompt,
      markers: ['[REISE_VORSCHLAG]'],
      onMarkerDetected: handleMarker,
      onAssistantMessage: handleAssistantMessage,
      sessionId,
      sessionType,
    });

  const handleBack = useCallback(() => {
    const userMsgs = messages.filter((m) => m.role === 'user');
    const totalLen = messages.reduce((s, m) => s + m.content.length, 0);
    if (messages.length > 0) {
      trackChatSessionEnd(
        messages.length,
        userMsgs.length,
        totalLen / messages.length,
        Date.now() - chatStartTime.current,
        'aborted',
        'onboarding',
        sessionId,
      );
    }
    onBack();
  }, [messages, onBack, sessionId]);

  useEffect(() => {
    startConversation(
      'Starte das Onboarding. Begruesse mich kurz und frage nach meinen Interessen.'
    );
  }, [startConversation]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[75vh] glass rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-slate-900/50 p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="font-bold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${hasError ? 'bg-red-500' : 'bg-green-500'}`} />
            Dein Coach
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Schritt 1 von 3
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg} accentColor="blue" onSpeak={speak} isSpeaking={isSpeaking} />
        ))}
        {isLoading && <TypingIndicator color="blue" />}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder="Erzaehl mir von dir..."
        accentColor="blue"
      />

      {/* Error fallback */}
      {hasError && (
        <div className="p-3 bg-slate-900/80 border-t border-red-500/20 text-center">
          <button
            onClick={handleBack}
            className="text-sm text-red-400 hover:text-red-300 underline transition-colors"
          >
            Zurueck zur Hauptseite
          </button>
        </div>
      )}
    </div>
  );
};
