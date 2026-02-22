import React, { useState } from 'react';
import type { CourseContent } from '../../types/vuca';

interface VucaCourseViewProps {
  course: CourseContent;
  onComplete: () => void;
  onBack: () => void;
}

export const VucaCourseView: React.FC<VucaCourseViewProps> = ({
  course,
  onComplete,
  onBack,
}) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const quiz = course.quiz || [];
  const question = quiz[currentQ];

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === question.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < quiz.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setQuizDone(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{course.title}</h2>
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white transition-colors glass px-4 py-2 rounded-lg"
        >
          Zurueck
        </button>
      </div>

      {!showQuiz ? (
        <>
          {/* Course Content */}
          {course.sections.map((section, idx) => (
            <div key={idx} className="glass rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-blue-400">{section.heading}</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{section.content}</p>
            </div>
          ))}

          {/* Start Quiz Button */}
          {quiz.length > 0 && (
            <button
              onClick={() => setShowQuiz(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
            >
              Quiz starten ({quiz.length} Fragen)
            </button>
          )}

          {quiz.length === 0 && (
            <button
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
            >
              Modul abschliessen
            </button>
          )}
        </>
      ) : quizDone ? (
        /* Quiz Complete */
        <div className="glass rounded-xl p-8 text-center space-y-4">
          <div className="text-5xl mb-4">{correctCount === quiz.length ? '🎉' : '📝'}</div>
          <h3 className="text-xl font-bold text-white">
            Quiz abgeschlossen!
          </h3>
          <p className="text-slate-400">
            {correctCount} von {quiz.length} Fragen richtig beantwortet.
          </p>
          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
          >
            Modul abschliessen
          </button>
        </div>
      ) : (
        /* Quiz Question */
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="text-xs text-slate-500 font-mono">
            Frage {currentQ + 1} / {quiz.length}
          </div>
          <h3 className="font-bold text-white text-lg">{question.question}</h3>
          <div className="space-y-2">
            {question.options.map((opt, idx) => {
              let style = 'border-white/10 hover:border-white/30';
              if (showResult) {
                if (idx === question.correctIndex) {
                  style = 'border-green-500 bg-green-500/10';
                } else if (idx === selected && idx !== question.correctIndex) {
                  style = 'border-red-500 bg-red-500/10';
                } else {
                  style = 'border-white/5 opacity-50';
                }
              } else if (idx === selected) {
                style = 'border-blue-500 bg-blue-500/10';
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${style}`}
                >
                  <span className="text-slate-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                  <span className="text-slate-200">{opt}</span>
                </button>
              );
            })}
          </div>
          {showResult && (
            <div className={`p-3 rounded-lg text-sm ${selected === question.correctIndex ? 'bg-green-950/50 text-green-300' : 'bg-red-950/50 text-red-300'}`}>
              {question.explanation}
            </div>
          )}
          {showResult && (
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              {currentQ < quiz.length - 1 ? 'Naechste Frage' : 'Ergebnis anzeigen'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
