export interface SpeechControls {
  isSpeaking: boolean;
  isPaused: boolean;
  isLoading: boolean;
  volume: number;
  activeText: string | null;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
}
