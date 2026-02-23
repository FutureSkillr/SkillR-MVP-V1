import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useGeminiChat } from '../../hooks/useGeminiChat';
import { usePromptLogSession } from '../../hooks/usePromptLogSession';
import { getPrompts } from '../../services/contentResolver';
import { createLoggingGeminiService } from '../../services/geminiWithLogging';
import { geminiService } from '../../services/gemini';
import { trackChatSessionEnd } from '../../services/analytics';
import { ChatBubble } from '../shared/ChatBubble';
import { ChatInput } from '../shared/ChatInput';
import { TypingIndicator } from '../shared/TypingIndicator';
import { AiStatusDiamond } from '../shared/AiStatusDiamond';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useAiStatus } from '../../hooks/useAiStatus';
import { COACHES_BY_ID } from '../../constants/coaches';
import type { Station, StationResult } from '../../types/journey';
import type { ChatMessage } from '../../types/chat';
import type { VoiceDialect } from '../../types/user';
import type { CoachId } from '../../types/intro';

interface SelfLearningStationProps {
  station: Station;
  onComplete: (result: StationResult) => void;
  onBack: () => void;
  voiceEnabled?: boolean;
  voiceDialect?: VoiceDialect;
  coachId?: CoachId;
}

export const SelfLearningStation: React.FC<SelfLearningStationProps> = ({
  station,
  onComplete,
  onBack,
  voiceEnabled = false,
  voiceDialect = 'hochdeutsch',
  coachId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const completingRef = useRef(false);
  const chatStartTime = useRef(Date.now());
  const speech = useSpeechSynthesis(voiceDialect);
  const { speak } = speech;
  const aiStatus = useAiStatus();
  const coach = coachId ? COACHES_BY_ID[coachId] : null;

  const { sessionId, sessionType } = usePromptLogSession({
    sessionType: 'self-learning-station',
    stationId: station.id,
    journeyType: 'self-learning',
  });

  const systemPrompt = useMemo(() => getPrompts().selfLearningStation, []);

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
        'self-learning-station',
        sessionId,
      );

      try {
        const loggingService = createLoggingGeminiService(sessionId, sessionType);
        const result = await loggingService.extractStationResult(
          'self-learning',
          station.id,
          allMessages
        );
        setTimeout(() => onComplete(result), 2000);
      } catch (error) {
        console.error('Failed to extract station result:', error);
        try {
          const { data } = await geminiService.extractStationResult('self-learning', station.id, allMessages);
          setTimeout(() => onComplete(data), 2000);
        } catch {
          onComplete({
            stationId: station.id,
            journeyType: 'self-learning',
            dimensionScores: { metacognition: 55, transfer: 50, curiosity: 60, persistence: 45, 'self-direction': 50 },
            summary: 'Uebung abgeschlossen.',
            completedAt: Date.now(),
          });
        }
      }
    },
    [station.id, onComplete, sessionId, sessionType]
  );

  const handleAssistantMessage = useCallback(
    (text: string) => {
      if (voiceEnabled) {
        setTimeout(() => speak(text), 1500);
      }
    },
    [voiceEnabled, speak]
  );

  const { messages, isLoading, sendMessage, startConversation } =
    useGeminiChat({
      systemPrompt,
      markers: ['[EXERCISE_COMPLETE]'],
      onMarkerDetected: handleMarker,
      onAssistantMessage: handleAssistantMessage,
      sessionId,
      sessionType,
    });

  useEffect(() => {
    const prompt = `Starte die Lern-Station.
Setting: ${station.setting}
Technik: ${station.technique || 'Eine Lerntechnik zum Ausprobieren.'}
Begruesse den Nutzer und erklaere die Technik kurz und anschaulich.`;
    startConversation(prompt);
  }, [station, startConversation]);

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
        'self-learning-station',
        sessionId,
      );
    }
    onBack();
  }, [messages, onBack, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[75vh] glass rounded-2xl overflow-hidden shadow-2xl glow-purple">
      {/* Header */}
      <div className="bg-slate-900/50 p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h2 className={`font-bold ${coach?.colorClass || 'text-purple-400'} flex items-center gap-2`}>
                {coach && <span className="text-lg">{coach.emoji}</span>}
                {coach ? coach.name : station.title}
                <AiStatusDiamond status={aiStatus.status} latencyMs={aiStatus.latencyMs} size={14} />
              </h2>
              <p className="text-[10px] text-slate-500">{station.title} — {station.description}</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">LERN-LABOR</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg} accentColor="purple" speech={speech} />
        ))}
        {isLoading && <TypingIndicator color="purple" />}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder="Deine Antwort..."
        accentColor="purple"
      />
    </div>
  );
};
