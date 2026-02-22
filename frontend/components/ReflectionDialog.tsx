/**
 * Level 2 Reflection Dialog (FR-020)
 *
 * Shows a reflection question after station completion.
 * Captures the student's text response and measures response time.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ReflectionQuestion, ReflectionResult } from '../services/reflection';
import { scoreReflectionResponse } from '../services/reflection';

interface ReflectionDialogProps {
  question: ReflectionQuestion;
  onComplete: (result: ReflectionResult) => void;
  onSkip: () => void;
}

export const ReflectionDialog: React.FC<ReflectionDialogProps> = ({
  question,
  onComplete,
  onSkip,
}) => {
  const [response, setResponse] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState('');
  const startTime = useRef(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    startTime.current = Date.now();
    textareaRef.current?.focus();
  }, [question.id]);

  const handleSubmit = useCallback(() => {
    const responseTime = Date.now() - startTime.current;
    const fullResponse = showFollowUp
      ? `${response} ${followUpResponse}`
      : response;

    const capabilityScores = scoreReflectionResponse(question, fullResponse, responseTime);

    onComplete({
      questionId: question.id,
      response: fullResponse,
      responseTime,
      capabilityScores,
    });
  }, [response, followUpResponse, showFollowUp, question, onComplete]);

  const handleContinue = useCallback(() => {
    if (question.followUp && !showFollowUp) {
      setShowFollowUp(true);
      startTime.current = Date.now(); // Reset timer for follow-up
    } else {
      handleSubmit();
    }
  }, [question.followUp, showFollowUp, handleSubmit]);

  const canSubmit = response.trim().length >= 3;

  return (
    <div className="max-w-2xl mx-auto text-center py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          <span className="text-indigo-400 text-xs font-medium">Level 2 Reflexion</span>
          <span className="text-[10px] text-slate-500">{question.dimensionLabel}</span>
        </div>
        <h2 className="text-xl font-bold text-white">Moment der Reflexion</h2>
      </div>

      {/* Question */}
      <div className="glass rounded-2xl p-6 space-y-4 text-left">
        <p className="text-slate-200 text-lg leading-relaxed">
          {showFollowUp ? question.followUp : question.question}
        </p>

        <textarea
          ref={textareaRef}
          value={showFollowUp ? followUpResponse : response}
          onChange={(e) =>
            showFollowUp
              ? setFollowUpResponse(e.target.value)
              : setResponse(e.target.value)
          }
          placeholder="Schreib deine Gedanken hier..."
          rows={4}
          className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500/50 transition-colors resize-y"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Ueberspringen
          </button>
          <button
            onClick={handleContinue}
            disabled={!canSubmit}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
              canSubmit
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {question.followUp && !showFollowUp ? 'Weiter' : 'Fertig'}
          </button>
        </div>
      </div>

      {/* Encouragement */}
      <p className="text-xs text-slate-500">
        Deine Antwort hilft uns, dein Profil genauer zu machen. Es gibt keine falschen Antworten.
      </p>
    </div>
  );
};
