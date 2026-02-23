import { useState, useCallback, useRef } from 'react';
import { backendChatService } from '../services/gemini';
import type { VoiceDialect } from '../types/user';

const VOLUME_STORAGE_KEY = 'skillr-tts-volume';

function loadVolume(): number {
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored !== null) {
      const v = parseFloat(stored);
      if (!isNaN(v) && v >= 0 && v <= 1) return v;
    }
  } catch { /* ignore */ }
  return 0.8;
}

function persistVolume(v: number): void {
  try { localStorage.setItem(VOLUME_STORAGE_KEY, String(v)); } catch { /* ignore */ }
}

/** Fallback: use browser speechSynthesis when Gemini TTS is unavailable */
function browserSpeak(text: string, volume: number, onEnd: () => void): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = 0.95;
  utterance.volume = volume;
  const voices = window.speechSynthesis.getVoices();
  const germanVoice = voices.find((v) => v.lang.startsWith('de')) || null;
  if (germanVoice) utterance.voice = germanVoice;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

// ── Web Audio API singleton ─────────────────────────────────────────
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext({ sampleRate: 24000 });
  }
  return audioCtx;
}

/**
 * Unlock the AudioContext by calling resume() — MUST be invoked from a
 * user-gesture handler (click, keydown, touchstart). After unlocking,
 * all subsequent programmatic playback works without gesture context.
 */
export async function unlockAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/** Decode base64 PCM (16-bit signed LE, mono, 24 kHz) into an AudioBuffer. */
function decodeBase64Pcm(base64Pcm: string): AudioBuffer {
  const ctx = getAudioContext();
  const raw = atob(base64Pcm);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }

  const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
  audioBuffer.getChannelData(0).set(float32);
  return audioBuffer;
}

export function useSpeechSynthesis(dialect: VoiceDialect = 'hochdeutsch') {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(loadVolume);
  const [activeText, setActiveText] = useState<string | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const generationRef = useRef(0);
  const volumeRef = useRef(volume);
  const browserFallbackRef = useRef(false);

  const cleanup = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch { /* already stopped */ }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    browserFallbackRef.current = false;
  }, []);

  const stop = useCallback(() => {
    generationRef.current++;
    cleanup();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
    setIsPaused(false);
    setActiveText(null);
  }, [cleanup]);

  const pause = useCallback(() => {
    if (browserFallbackRef.current) {
      window.speechSynthesis?.pause();
    } else {
      try { getAudioContext().suspend(); } catch { /* ignore */ }
    }
    setIsSpeaking(false);
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (browserFallbackRef.current) {
      window.speechSynthesis?.resume();
    } else {
      try { getAudioContext().resume(); } catch { /* ignore */ }
    }
    setIsPaused(false);
    setIsSpeaking(true);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    persistVolume(clamped);
    if (gainRef.current) {
      gainRef.current.gain.value = clamped;
    }
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const gen = ++generationRef.current;
      cleanup();
      window.speechSynthesis?.cancel();
      browserFallbackRef.current = false;
      setIsLoading(true);
      setIsPaused(false);
      setActiveText(text);

      try {
        const pcmBase64 = await backendChatService.textToSpeech(text, dialect);

        if (gen !== generationRef.current) return;

        const ctx = getAudioContext();
        await ctx.resume(); // no-op if already running

        const audioBuffer = decodeBase64Pcm(pcmBase64);

        if (gen !== generationRef.current) return;

        const gain = ctx.createGain();
        gain.gain.value = volumeRef.current;
        gain.connect(ctx.destination);
        gainRef.current = gain;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gain);
        sourceRef.current = source;

        source.onended = () => {
          if (gen !== generationRef.current) return;
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveText(null);
          cleanup();
        };

        source.start();
        setIsSpeaking(true);
        setIsLoading(false);
      } catch (error) {
        if (gen !== generationRef.current) return;
        console.warn('[TTS] Gemini TTS failed, falling back to browser speech:', error);
        setIsLoading(false);
        setIsSpeaking(true);
        browserFallbackRef.current = true;
        browserSpeak(text, volumeRef.current, () => {
          if (gen !== generationRef.current) return;
          setIsSpeaking(false);
          setIsPaused(false);
          setActiveText(null);
          browserFallbackRef.current = false;
        });
      }
    },
    [dialect, cleanup]
  );

  return { isSpeaking, isPaused, isLoading, volume, activeText, speak, pause, resume, stop, setVolume };
}
