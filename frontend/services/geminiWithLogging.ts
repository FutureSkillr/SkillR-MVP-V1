import { backendChatService, geminiService, MODEL_NAME } from './gemini';
import type { RetryInfo } from './gemini';
import { insertPromptLog } from './db';
import type { ChatMessage } from '../types/chat';
import type { OnboardingInsights } from '../types/user';
import type { StationResult } from '../types/journey';
import type { VucaCurriculum, CourseContent } from '../types/vuca';
import type { PromptLogEntry } from '../types/promptlog';

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function logEntry(entry: PromptLogEntry): Promise<void> {
  try {
    await insertPromptLog(entry);
  } catch (e) {
    console.warn('Failed to log prompt:', e);
  }
}

export function createLoggingGeminiService(sessionId: string, sessionType: string) {
  return {
    async chat(
      systemInstruction: string,
      history: ChatMessage[],
      userMessage: string
    ): Promise<string> {
      const requestId = uuid();
      const requestTimestamp = Date.now();
      let retryCount = 0;

      try {
        const { text, retryCount: finalRetries } = await backendChatService.chat(
          systemInstruction, history, userMessage
        );
        retryCount = finalRetries;
        const responseTimestamp = Date.now();
        const totalText = systemInstruction + userMessage + text + JSON.stringify(history);

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'chat',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: systemInstruction,
          user_message: userMessage,
          chat_history: JSON.stringify(history),
          raw_response: text,
          structured_response: '',
          status: 'success',
          error_message: null,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: estimateTokens(totalText),
        });

        return text;
      } catch (error) {
        const responseTimestamp = Date.now();
        const errMsg = error instanceof Error ? error.message : String(error);

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'chat',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: systemInstruction,
          user_message: userMessage,
          chat_history: JSON.stringify(history),
          raw_response: '',
          structured_response: '',
          status: 'error',
          error_message: errMsg,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: 0,
        });

        throw error;
      }
    },

    async extractInsights(chatHistory: ChatMessage[]): Promise<OnboardingInsights> {
      const requestId = uuid();
      const requestTimestamp = Date.now();
      let retryCount = 0;

      const onRetry = (info: RetryInfo) => {
        retryCount = info.attempt;
      };

      try {
        const { data, retryCount: finalRetries, rawText } =
          await geminiService.extractInsights(chatHistory, onRetry);
        retryCount = finalRetries;
        const responseTimestamp = Date.now();

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'extractInsights',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: 'extractInsights system prompt',
          user_message: chatHistory.map(m => `${m.role}: ${m.content}`).join('\n').slice(0, 500),
          chat_history: JSON.stringify(chatHistory),
          raw_response: rawText,
          structured_response: JSON.stringify(data),
          status: 'success',
          error_message: null,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: estimateTokens(rawText + JSON.stringify(chatHistory)),
        });

        return data;
      } catch (error) {
        const responseTimestamp = Date.now();
        const errMsg = error instanceof Error ? error.message : String(error);

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'extractInsights',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: 'extractInsights system prompt',
          user_message: '',
          chat_history: JSON.stringify(chatHistory),
          raw_response: '',
          structured_response: '',
          status: 'error',
          error_message: errMsg,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: 0,
        });

        throw error;
      }
    },

    async extractStationResult(
      journeyType: string,
      stationId: string,
      chatHistory: ChatMessage[]
    ): Promise<StationResult> {
      const requestId = uuid();
      const requestTimestamp = Date.now();
      let retryCount = 0;

      const onRetry = (info: RetryInfo) => {
        retryCount = info.attempt;
      };

      try {
        const { data, retryCount: finalRetries, rawText } =
          await geminiService.extractStationResult(journeyType, stationId, chatHistory, onRetry);
        retryCount = finalRetries;
        const responseTimestamp = Date.now();

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'extractStationResult',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: 'extractStationResult system prompt',
          user_message: `${journeyType}/${stationId}`,
          chat_history: JSON.stringify(chatHistory),
          raw_response: rawText,
          structured_response: JSON.stringify(data),
          status: 'success',
          error_message: null,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: estimateTokens(rawText + JSON.stringify(chatHistory)),
        });

        return data;
      } catch (error) {
        const responseTimestamp = Date.now();
        const errMsg = error instanceof Error ? error.message : String(error);

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'extractStationResult',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: 'extractStationResult system prompt',
          user_message: `${journeyType}/${stationId}`,
          chat_history: JSON.stringify(chatHistory),
          raw_response: '',
          structured_response: '',
          status: 'error',
          error_message: errMsg,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: 0,
        });

        throw error;
      }
    },

    async generateCurriculum(goal: string): Promise<VucaCurriculum> {
      const requestId = uuid();
      const requestTimestamp = Date.now();
      let retryCount = 0;

      const onRetry = (info: RetryInfo) => {
        retryCount = info.attempt;
      };

      try {
        const { data, retryCount: finalRetries, rawText } =
          await backendChatService.generateCurriculum(goal, onRetry);
        retryCount = finalRetries;
        const responseTimestamp = Date.now();

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'generateCurriculum',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: 'generateCurriculum system prompt',
          user_message: goal,
          chat_history: '[]',
          raw_response: rawText,
          structured_response: JSON.stringify(data),
          status: 'success',
          error_message: null,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: estimateTokens(rawText + goal),
        });

        return data;
      } catch (error) {
        const responseTimestamp = Date.now();
        const errMsg = error instanceof Error ? error.message : String(error);

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'generateCurriculum',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: 'generateCurriculum system prompt',
          user_message: goal,
          chat_history: '[]',
          raw_response: '',
          structured_response: '',
          status: 'error',
          error_message: errMsg,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: 0,
        });

        throw error;
      }
    },

    async generateCourse(
      module: { title: string; description: string; category: string },
      goal: string
    ): Promise<CourseContent> {
      const requestId = uuid();
      const requestTimestamp = Date.now();
      let retryCount = 0;

      const onRetry = (info: RetryInfo) => {
        retryCount = info.attempt;
      };

      try {
        const { data, retryCount: finalRetries, rawText } =
          await backendChatService.generateCourse(module, goal, onRetry);
        retryCount = finalRetries;
        const responseTimestamp = Date.now();

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'generateCourse',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: 'generateCourse system prompt',
          user_message: `${module.title} (${module.category}) - ${goal}`,
          chat_history: '[]',
          raw_response: rawText,
          structured_response: JSON.stringify(data),
          status: 'success',
          error_message: null,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: estimateTokens(rawText + module.title + goal),
        });

        return data;
      } catch (error) {
        const responseTimestamp = Date.now();
        const errMsg = error instanceof Error ? error.message : String(error);

        await logEntry({
          request_id: requestId,
          session_id: sessionId,
          method: 'generateCourse',
          session_type: sessionType,
          model_name: MODEL_NAME,
          system_prompt: 'generateCourse system prompt',
          user_message: `${module.title} (${module.category}) - ${goal}`,
          chat_history: '[]',
          raw_response: '',
          structured_response: '',
          status: 'error',
          error_message: errMsg,
          latency_ms: responseTimestamp - requestTimestamp,
          retry_count: retryCount,
          request_timestamp: requestTimestamp,
          response_timestamp: responseTimestamp,
          token_count_estimate: 0,
        });

        throw error;
      }
    },
  };
}
