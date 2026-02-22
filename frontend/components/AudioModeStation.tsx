/**
 * Audio Mode Station (FR-032: Transit Audio Mode / Reise-Podcast)
 *
 * Simplified station interface for commute use: TTS reads content,
 * user responds with large tap buttons. Minimal visual, maximum audio.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import type { Station, StationResult, JourneyType } from '../types/journey';
import type { VoiceDialect } from '../types/user';
import { geminiService } from '../services/gemini';
import { getPrompts } from '../services/contentResolver';
import type { ChatMessage } from '../types/chat';

interface AudioModeStationProps {
  station: Station;
  voiceDialect: VoiceDialect;
  onComplete: (result: StationResult) => void;
  onBack: () => void;
  onExitAudioMode: () => void;
}

interface AudioStep {
  narration: string;
  options?: [string, string]; // [optionA, optionB]
}

export const AudioModeStation: React.FC<AudioModeStationProps> = ({
  station,
  voiceDialect,
  onComplete,
  onBack,
  onExitAudioMode,
}) => {
  const { isSpeaking, isLoading, speak, stop } = useSpeechSynthesis(voiceDialect);
  const [steps, setSteps] = useState<AudioStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [generating, setGenerating] = useState(true);
  const [complete, setComplete] = useState(false);
  const chatHistory = useRef<ChatMessage[]>([]);
  const systemPromptRef = useRef('');

  // Generate the first audio step from the station setting
  useEffect(() => {
    generateIntro();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generateIntro() {
    setGenerating(true);
    const prompts = getPrompts();
    systemPromptRef.current = `${prompts.vucaStation}

AUDIO MODE: Du sprichst jetzt im Audio-Modus. Halte deine Antworten KURZ (2-3 Saetze).
Nach jeder Erzaehlung stelle EINE Frage mit genau ZWEI Antwortmoeglichkeiten.
Format deine Antwort so:
ERZAEHLUNG: [kurze Erzaehlung des Szenarios]
OPTION_A: [erste Antwortmoeglichkeit, 2-4 Woerter]
OPTION_B: [zweite Antwortmoeglichkeit, 2-4 Woerter]`;

    const userMessage = `Station: ${station.title}. Setting: ${station.setting}. Starte die Audio-Station mit einer kurzen Einfuehrung.`;

    try {
      chatHistory.current = [];

      const { text } = await geminiService.chat(systemPromptRef.current, chatHistory.current, userMessage);
      chatHistory.current.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: text },
      );
      const parsed = parseAudioResponse(text);
      setSteps([parsed]);
      setGenerating(false);
      speak(parsed.narration);
    } catch (error) {
      console.error('[AudioMode] Failed to generate intro:', error);
      setSteps([{ narration: station.setting, options: ['Weiter', 'Zurueck'] }]);
      setGenerating(false);
      speak(station.setting);
    }
  }

  function parseAudioResponse(response: string): AudioStep {
    const narrationMatch = response.match(/ERZAEHLUNG:\s*(.+?)(?=OPTION_A:|$)/s);
    const optionAMatch = response.match(/OPTION_A:\s*(.+?)(?=OPTION_B:|$)/s);
    const optionBMatch = response.match(/OPTION_B:\s*(.+)/s);

    const narration = narrationMatch?.[1]?.trim() || response.replace(/OPTION_[AB]:.*/gs, '').trim();
    const optionA = optionAMatch?.[1]?.trim() || 'Ja';
    const optionB = optionBMatch?.[1]?.trim() || 'Nein';

    return { narration, options: [optionA, optionB] };
  }

  const handleResponse = useCallback(async (choice: string) => {
    stop();
    const newResponses = [...responses, choice];
    setResponses(newResponses);

    // After 4 interactions, complete the station
    if (newResponses.length >= 4) {
      setComplete(true);
      const summary = `Audio-Station abgeschlossen. ${newResponses.length} Entscheidungen getroffen.`;
      speak('Gut gemacht! Die Station ist abgeschlossen.');
      setTimeout(() => {
        onComplete({
          stationId: station.id,
          journeyType: station.journeyType as JourneyType,
          dimensionScores: Object.fromEntries(
            station.dimensions.map((dim) => [dim, 50 + Math.round(Math.random() * 30)])
          ),
          summary,
          completedAt: Date.now(),
        });
      }, 3000);
      return;
    }

    // Generate next step
    setGenerating(true);
    try {
      const userMsg = `Ich waehle: ${choice}`;
      const { text } = await geminiService.chat(systemPromptRef.current, chatHistory.current, userMsg);
      chatHistory.current.push(
        { role: 'user', content: userMsg },
        { role: 'assistant', content: text },
      );
      const parsed = parseAudioResponse(text);
      setSteps((prev) => [...prev, parsed]);
      setCurrentStep(newResponses.length);
      setGenerating(false);
      speak(parsed.narration);
    } catch (error) {
      console.error('[AudioMode] Failed to generate next step:', error);
      setGenerating(false);
    }
  }, [responses, station, speak, stop, onComplete]);

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-between p-6 z-40">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between">
        <button onClick={onBack} className="text-slate-500 hover:text-white text-sm">
          &#x2190; Zurueck
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[10px] text-slate-500">Audio-Modus</span>
        </div>
        <button onClick={onExitAudioMode} className="text-xs text-slate-500 hover:text-white">
          Normaler Modus
        </button>
      </div>

      {/* Center: spoken text / ambient */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center space-y-6">
        {/* Progress dots */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < responses.length
                  ? 'bg-emerald-500'
                  : i === responses.length
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Speaking indicator */}
        {(isSpeaking || isLoading) && (
          <div className="flex gap-1 items-end h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 bg-blue-400 rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Subtitle of what's being spoken */}
        {step && (
          <p className="text-slate-300 text-lg leading-relaxed">
            {step.narration.length > 120 ? step.narration.slice(0, 120) + '...' : step.narration}
          </p>
        )}

        {generating && !step && (
          <p className="text-slate-500 animate-pulse">Erzaehlung wird vorbereitet...</p>
        )}

        {complete && (
          <p className="text-emerald-400 text-xl font-bold">Station abgeschlossen!</p>
        )}
      </div>

      {/* Bottom: large tap buttons */}
      {step?.options && !generating && !complete && !isSpeaking && !isLoading && (
        <div className="w-full max-w-md flex gap-4">
          <button
            onClick={() => handleResponse(step.options![0])}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-2xl text-lg shadow-lg transition-all active:scale-95"
          >
            {step.options[0]}
          </button>
          <button
            onClick={() => handleResponse(step.options![1])}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-6 rounded-2xl text-lg shadow-lg transition-all active:scale-95"
          >
            {step.options[1]}
          </button>
        </div>
      )}

      {/* Waiting states */}
      {(generating || isSpeaking || isLoading) && !complete && (
        <div className="w-full max-w-md flex gap-4">
          <div className="flex-1 bg-slate-800/50 text-slate-600 font-bold py-6 rounded-2xl text-lg text-center">
            {isLoading ? 'Laedt...' : isSpeaking ? 'Zuhoeren...' : 'Vorbereiten...'}
          </div>
        </div>
      )}

      {complete && (
        <div className="w-full max-w-md" />
      )}
    </div>
  );
};
