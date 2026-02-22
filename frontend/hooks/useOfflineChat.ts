import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '../types/chat';
import { OfflineChatEngine } from '../services/offlineChat';

const SIMULATED_DELAY_MS = 600;

interface UseOfflineChatOptions {
  coachName: string;
  onMarkerDetected?: (marker: string, messages: ChatMessage[]) => void;
  onAssistantMessage?: (text: string) => void;
  markers?: string[];
}

export function useOfflineChat({
  coachName,
  onMarkerDetected,
  onAssistantMessage,
  markers = [],
}: UseOfflineChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const engineRef = useRef<OfflineChatEngine>(new OfflineChatEngine(coachName));

  const appendAssistant = useCallback(
    (text: string, currentMessages: ChatMessage[]) => {
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      };
      const allMessages = [...currentMessages, assistantMsg];
      messagesRef.current = allMessages;
      setMessages(allMessages);

      onAssistantMessage?.(text);

      for (const marker of markers) {
        if (text.includes(marker)) {
          onMarkerDetected?.(marker, allMessages);
          break;
        }
      }
    },
    [markers, onMarkerDetected, onAssistantMessage]
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

      // Simulate network delay for natural feel
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

      const response = engineRef.current.reply(userMessage);
      appendAssistant(response, updatedMessages);
      setIsLoading(false);
    },
    [isLoading, appendAssistant]
  );

  const startConversation = useCallback(
    async (_initialPrompt: string) => {
      setIsLoading(true);
      messagesRef.current = [];
      setMessages([]);

      await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

      const response = engineRef.current.start();
      appendAssistant(response, []);
      setIsLoading(false);
    },
    [appendAssistant]
  );

  const startDemo = useCallback(
    async () => {
      setIsLoading(true);

      await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

      const response = engineRef.current.startDemo();
      appendAssistant(response, messagesRef.current);
      setIsLoading(false);
    },
    [appendAssistant]
  );

  const reset = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
    setIsLoading(false);
    engineRef.current = new OfflineChatEngine(coachName);
  }, [coachName]);

  return {
    messages,
    isLoading,
    hasError: false as const,
    errorCode: null as string | null,
    sendMessage,
    startConversation,
    startDemo,
    reset,
  };
}
