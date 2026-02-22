import { useState, useCallback, useRef } from 'react';
import { pcmToWavBlob } from '../services/audioUtils';
import { geminiService } from '../services/gemini';
import type { VoiceDialect } from '../types/user';

/** Fallback: use browser speechSynthesis when Gemini TTS is unavailable */
function browserSpeak(text: string): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const germanVoice = voices.find((v) => v.lang.startsWith('de')) || null;
  if (germanVoice) utterance.voice = germanVoice;
  window.speechSynthesis.speak(utterance);
}

export function useSpeechSynthesis(dialect: VoiceDialect = 'hochdeutsch') {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  // Generation counter: incremented on every speak/stop call.
  // Stale in-flight TTS requests check this to bail out before playing.
  const generationRef = useRef(0);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    generationRef.current++;
    cleanup();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanup]);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Cancel any previous in-flight or playing audio
      const gen = ++generationRef.current;
      cleanup();
      window.speechSynthesis?.cancel();
      setIsLoading(true);

      try {
        const pcmBase64 = await geminiService.textToSpeech(text, dialect);

        // Another speak/stop was called while we were waiting — discard this result
        if (gen !== generationRef.current) return;

        const wavBlob = pcmToWavBlob(pcmBase64);
        const url = URL.createObjectURL(wavBlob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          if (gen !== generationRef.current) { audio.pause(); return; }
          setIsSpeaking(true);
          setIsLoading(false);
        };
        audio.onended = () => {
          if (gen !== generationRef.current) return;
          setIsSpeaking(false);
          cleanup();
        };
        audio.onerror = () => {
          if (gen !== generationRef.current) return;
          setIsSpeaking(false);
          setIsLoading(false);
          cleanup();
        };

        // Final check before play
        if (gen !== generationRef.current) {
          URL.revokeObjectURL(url);
          return;
        }

        await audio.play();
      } catch (error) {
        if (gen !== generationRef.current) return;
        console.warn('[TTS] Gemini TTS failed, falling back to browser speech:', error);
        setIsLoading(false);
        // Fallback to browser speech synthesis
        setIsSpeaking(true);
        browserSpeak(text);
        // Estimate duration: ~80ms per character for German speech
        const estimatedMs = Math.max(2000, text.length * 80);
        setTimeout(() => {
          if (gen !== generationRef.current) return;
          setIsSpeaking(false);
        }, estimatedMs);
      }
    },
    [dialect, cleanup]
  );

  return { isSpeaking, isLoading, speak, stop };
}
