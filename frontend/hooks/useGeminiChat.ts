import { useState, useCallback, useRef, useMemo } from 'react';
import type { ChatMessage } from '../types/chat';
import { geminiService } from '../services/gemini';
import { createLoggingGeminiService } from '../services/geminiWithLogging';
import { trackChatMessage } from '../services/analytics';

interface UseGeminiChatOptions {
  systemPrompt: string;
  onMarkerDetected?: (marker: string, messages: ChatMessage[]) => void;
  onAssistantMessage?: (text: string) => void;
  onError?: (error: unknown) => void;
  markers?: string[];
  sessionId?: string;
  sessionType?: string;
}

function formatError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403') || msg.includes('key')) {
    return 'API-Key fehlt oder ist ungueltig. Bitte trage deinen Gemini API Key in frontend/.env.local ein (GEMINI_API_KEY=...) und starte den Dev-Server neu.';
  }
  if (msg.includes('404') || msg.includes('not found')) {
    return 'Modell nicht gefunden. Bitte pruefe den Modell-Namen in services/gemini.ts.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'API-Limit erreicht (zu viele Anfragen). Bitte warte 30 Sekunden und versuche es erneut — oder pruefe dein Gemini-Kontingent unter console.cloud.google.com.';
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
    return 'Netzwerkfehler — bitte pruefe deine Internetverbindung.';
  }
  return `Verbindungsfehler: ${msg}`;
}

export function useGeminiChat({
  systemPrompt,
  onMarkerDetected,
  onAssistantMessage,
  onError,
  markers = [],
  sessionId,
  sessionType,
}: UseGeminiChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  const service = useMemo(() => {
    if (sessionId && sessionType) {
      return createLoggingGeminiService(sessionId, sessionType);
    }
    return null;
  }, [sessionId, sessionType]);

  const chatFn = useCallback(
    async (systemInstruction: string, history: ChatMessage[], userMessage: string) => {
      if (service) {
        return service.chat(systemInstruction, history, userMessage);
      }
      const { text } = await geminiService.chat(systemInstruction, history, userMessage);
      return text;
    },
    [service]
  );

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messagesRef.current, userMsg];
      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);
      setIsLoading(true);

      trackChatMessage(updatedMessages.length - 1, userMessage.length, true, sessionType || 'unknown', sessionId);

      try {
        const response = await chatFn(
          systemPrompt,
          messagesRef.current.slice(0, -1),
          userMessage
        );

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        };

        const allMessages = [...updatedMessages, assistantMsg];
        messagesRef.current = allMessages;
        setMessages(allMessages);

        trackChatMessage(allMessages.length - 1, response.length, false, sessionType || 'unknown', sessionId);

        onAssistantMessage?.(response);

        for (const marker of markers) {
          if (response.includes(marker)) {
            onMarkerDetected?.(marker, allMessages);
            break;
          }
        }
      } catch (error) {
        console.error('Gemini chat error:', error);
        setHasError(true);
        onError?.(error);
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: formatError(error),
          timestamp: Date.now(),
        };
        const allMessages = [...updatedMessages, errorMsg];
        messagesRef.current = allMessages;
        setMessages(allMessages);
      } finally {
        setIsLoading(false);
      }
    },
    [systemPrompt, markers, onMarkerDetected, onAssistantMessage, isLoading, chatFn]
  );

  const startConversation = useCallback(
    async (initialPrompt: string) => {
      setIsLoading(true);
      messagesRef.current = [];
      setMessages([]);

      try {
        const response = await chatFn(
          systemPrompt,
          [],
          initialPrompt
        );

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        };

        messagesRef.current = [assistantMsg];
        setMessages([assistantMsg]);

        trackChatMessage(0, response.length, false, sessionType || 'unknown', sessionId);

        onAssistantMessage?.(response);
      } catch (error) {
        console.error('Gemini start error:', error);
        setHasError(true);
        onError?.(error);
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: formatError(error),
          timestamp: Date.now(),
        };
        messagesRef.current = [errorMsg];
        setMessages([errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [systemPrompt, chatFn]
  );

  const reset = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    hasError,
    sendMessage,
    startConversation,
    reset,
  };
}
