import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useGeminiChat } from '../../hooks/useGeminiChat';
import { usePromptLogSession } from '../../hooks/usePromptLogSession';
import { getPrompts } from '../../services/contentResolver';
import { createLoggingGeminiService } from '../../services/geminiWithLogging';
import { trackChatSessionEnd } from '../../services/analytics';
import { ChatBubble } from '../shared/ChatBubble';
import { ChatInput } from '../shared/ChatInput';
import { TypingIndicator } from '../shared/TypingIndicator';
import { VucaDashboard } from './VucaDashboard';
import { VucaCourseView } from './VucaCourseView';
import { VucaBingo } from './VucaBingo';
import { completeModule, getModuleById } from '../../services/vuca';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import type { Station, StationResult } from '../../types/journey';
import type { ChatMessage } from '../../types/chat';
import type { VucaStationState, CourseContent } from '../../types/vuca';
import type { VoiceDialect } from '../../types/user';
import { createInitialVucaState, isVucaComplete } from '../../types/vuca';

interface VucaStationProps {
  station: Station;
  onComplete: (result: StationResult) => void;
  onBack: () => void;
  voiceEnabled?: boolean;
  voiceDialect?: VoiceDialect;
}

const VUCA_STORAGE_KEY = 'skillr-vuca-state';

function loadVucaState(): VucaStationState {
  try {
    const stored = localStorage.getItem(VUCA_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return createInitialVucaState();
}

function saveVucaState(state: VucaStationState): void {
  try {
    localStorage.setItem(VUCA_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export const VucaStation: React.FC<VucaStationProps> = ({
  station,
  onComplete,
  onBack,
  voiceEnabled = false,
  voiceDialect = 'hochdeutsch',
}) => {
  const [vucaState, setVucaState] = useState<VucaStationState>(loadVucaState);
  const [courseLoading, setCourseLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const goalExtractedRef = useRef(false);
  const chatStartTime = useRef(Date.now());
  const { isSpeaking, speak } = useSpeechSynthesis(voiceDialect);

  const { sessionId, sessionType } = usePromptLogSession({
    sessionType: 'vuca-station',
    stationId: station.id,
    journeyType: 'vuca',
  });

  const loggingService = React.useMemo(
    () => createLoggingGeminiService(sessionId, sessionType),
    [sessionId, sessionType]
  );

  // Persist vuca state on change
  useEffect(() => {
    saveVucaState(vucaState);
  }, [vucaState]);

  // Onboarding chat: discover career goal
  const handleGoalDetected = useCallback(
    async (_marker: string, allMessages: ChatMessage[]) => {
      if (goalExtractedRef.current) return;
      goalExtractedRef.current = true;

      const userMsgs = allMessages.filter((m) => m.role === 'user');
      const totalLen = allMessages.reduce((s, m) => s + m.content.length, 0);
      trackChatSessionEnd(
        allMessages.length,
        userMsgs.length,
        allMessages.length > 0 ? totalLen / allMessages.length : 0,
        Date.now() - chatStartTime.current,
        'completed',
        'vuca-station',
        sessionId,
      );

      // Extract goal from the last few messages
      const lastMessages = allMessages.slice(-4);
      const goalText = lastMessages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join(' ')
        .trim() || 'Allgemeines Berufsziel';

      setVucaState((prev) => ({ ...prev, view: 'loading-curriculum', goal: goalText }));

      try {
        const curriculum = await loggingService.generateCurriculum(goalText);
        setVucaState((prev) => ({
          ...prev,
          view: 'dashboard',
          curriculum,
        }));
      } catch (error) {
        console.error('Failed to generate curriculum:', error);
        setVucaState((prev) => ({ ...prev, view: 'onboarding' }));
        goalExtractedRef.current = false;
      }
    },
    [loggingService]
  );

  const ONBOARDING_PROMPT = `Du bist ein freundlicher Berufsberater fuer Jugendliche (14+). Fuehre ein kurzes Gespraech (3-5 Nachrichten), um ein Berufsziel oder Interessengebiet herauszufinden. Frage nach Interessen, Hobbys und Traeumen. Wenn du genug weisst, fasse das Berufsziel zusammen und beende mit [REISE_VORSCHLAG].`;

  const handleAssistantMessage = useCallback(
    (text: string) => {
      if (voiceEnabled) {
        setTimeout(() => speak(text), 1500);
      }
    },
    [voiceEnabled, speak]
  );

  const { messages, isLoading, sendMessage, startConversation } = useGeminiChat({
    systemPrompt: ONBOARDING_PROMPT,
    markers: ['[REISE_VORSCHLAG]'],
    onMarkerDetected: handleGoalDetected,
    onAssistantMessage: handleAssistantMessage,
    sessionId,
    sessionType,
  });

  useEffect(() => {
    if (vucaState.view === 'onboarding' && messages.length === 0) {
      startConversation(
        'Starte das VUCA-Onboarding. Begruesse mich und frage mich, welches Berufsziel oder welche Interessen ich habe.'
      );
    }
  }, [vucaState.view, messages.length, startConversation]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle module selection
  const handleSelectModule = useCallback(
    async (moduleId: string) => {
      const mod = getModuleById(vucaState, moduleId);
      if (!mod || mod.completed) return;

      setCourseLoading(true);
      setVucaState((prev) => ({ ...prev, activeModuleId: moduleId }));

      try {
        const course = await loggingService.generateCourse(
          { title: mod.title, description: mod.description, category: mod.category },
          vucaState.goal || ''
        );
        setVucaState((prev) => ({ ...prev, view: 'course', activeCourse: course }));
      } catch (error) {
        console.error('Failed to generate course:', error);
        setVucaState((prev) => ({ ...prev, activeModuleId: null }));
      } finally {
        setCourseLoading(false);
      }
    },
    [vucaState, loggingService]
  );

  // Handle module completion (after quiz)
  const handleModuleComplete = useCallback(() => {
    if (!vucaState.activeModuleId) return;
    const newState = completeModule(vucaState, vucaState.activeModuleId);

    if (isVucaComplete(newState.progress)) {
      // Build station result from VUCA progress
      const result: StationResult = {
        stationId: station.id,
        journeyType: 'vuca',
        dimensionScores: {
          change: newState.progress.V,
          uncertainty: newState.progress.U,
          complexity: newState.progress.C,
          ambiguity: newState.progress.A,
        },
        summary: `VUCA-Reise abgeschlossen! Berufsziel: ${vucaState.goal}. Alle 4 Dimensionen erreicht.`,
        completedAt: Date.now(),
      };
      // Clear persisted state
      localStorage.removeItem(VUCA_STORAGE_KEY);
      setVucaState(newState);
      setTimeout(() => onComplete(result), 1500);
    } else {
      setVucaState(newState);
    }
  }, [vucaState, station.id, onComplete]);

  const handleBackToDashboard = useCallback(() => {
    setVucaState((prev) => ({
      ...prev,
      view: 'dashboard',
      activeModuleId: null,
      activeCourse: null,
    }));
  }, []);

  // Render based on current view
  if (vucaState.view === 'complete') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-8">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(59,130,246,0.4)]">
          <span className="text-6xl">🌍</span>
        </div>
        <h1 className="text-3xl font-bold">VUCA-Reise abgeschlossen!</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Du hast alle 4 VUCA-Dimensionen gemeistert. Dein Berufsziel: {vucaState.goal}
        </p>
        <VucaBingo progress={vucaState.progress} />
      </div>
    );
  }

  if (vucaState.view === 'dashboard' && vucaState.curriculum) {
    return (
      <>
        {courseLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80">
            <div className="text-center space-y-4">
              <TypingIndicator color="blue" />
              <p className="text-slate-400 text-sm">Kurs wird generiert...</p>
            </div>
          </div>
        )}
        <VucaDashboard
          goal={vucaState.curriculum.goal}
          modules={vucaState.curriculum.modules}
          progress={vucaState.progress}
          onSelectModule={handleSelectModule}
          onBack={onBack}
        />
      </>
    );
  }

  if (vucaState.view === 'course' && vucaState.activeCourse) {
    return (
      <VucaCourseView
        course={vucaState.activeCourse}
        onComplete={handleModuleComplete}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (vucaState.view === 'loading-curriculum') {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 space-y-6">
        <TypingIndicator color="blue" />
        <h2 className="text-xl font-bold text-white">Lehrplan wird erstellt...</h2>
        <p className="text-slate-400 text-sm">
          Basierend auf deinem Berufsziel: {vucaState.goal}
        </p>
      </div>
    );
  }

  const handleChatBack = useCallback(() => {
    const userMsgs = messages.filter((m) => m.role === 'user');
    const totalLen = messages.reduce((s, m) => s + m.content.length, 0);
    if (messages.length > 0) {
      trackChatSessionEnd(
        messages.length,
        userMsgs.length,
        totalLen / messages.length,
        Date.now() - chatStartTime.current,
        'aborted',
        'vuca-station',
        sessionId,
      );
    }
    onBack();
  }, [messages, onBack, sessionId]);

  // Default: Onboarding chat
  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[75vh] glass rounded-2xl overflow-hidden shadow-2xl glow-blue">
      {/* Header */}
      <div className="bg-slate-900/50 p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleChatBack}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h2 className="font-bold text-blue-400 flex items-center gap-2">
                <span className="text-lg">🌍</span> {station.title}
              </h2>
              <p className="text-[10px] text-slate-500">Erzaehl uns von deinem Berufsziel</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">VUCA</span>
        </div>
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
        placeholder="Erzaehl mir von deinem Berufsziel..."
        accentColor="blue"
      />
    </div>
  );
};
