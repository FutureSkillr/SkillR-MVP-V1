import { useState, useRef, useCallback } from 'react';
import { blobToWavBase64 } from '../services/audioUtils';
import { geminiService } from '../services/gemini';

export function useSpeechRecognition(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggle = useCallback(async () => {
    if (!isSupported) return;

    if (isListening) {
      stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer WebM/Opus, fall back to mp4 (Safari)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop mic stream
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (blob.size < 100) return; // too short

        setIsProcessing(true);
        try {
          const wavBase64 = await blobToWavBase64(blob);
          const transcript = await geminiService.speechToText(wavBase64);
          if (transcript) {
            onResult(transcript);
          }
        } catch (error) {
          console.error('Speech-to-text error:', error);
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      setIsListening(false);
    }
  }, [isListening, isSupported, onResult, stopRecording]);

  return { isListening, isProcessing, isSupported, toggle };
}
