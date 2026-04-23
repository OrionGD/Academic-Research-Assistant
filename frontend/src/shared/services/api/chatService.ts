import apiClient from './client';
import { ChatMessage, ChatResponse } from '../../../types/api';

/**
 * Chat API Service
 *
 * Backend expects:  { sessionId: string, query: string, documentIds?: string[] }
 * We persist a session ID in localStorage so the same conversation is resumed
 * across page reloads. A new ID is generated the first time (or after clearHistory).
 */

const SESSION_STORAGE_KEY = 'aras_chat_session_id';

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

function resetSessionId(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export const chatService = {
  sendMessage: async (message: string, documentIds?: string[]): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', {
      sessionId: getOrCreateSessionId(),
      query: message,
      documentIds,
    });
    return response.data;
  },

  /**
   * Stream a message via SSE to the AI Research Assistant.
   * Uses a raw fetch so we can read the response body as a stream.
   */
  sendMessageStream: async (
    message: string,
    documentIds?: string[],
    onChunk?: (chunk: string) => void,
  ): Promise<void> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Crucial for session cookies with fetch
      body: JSON.stringify({
        sessionId: getOrCreateSessionId(),
        query: message,
        documentIds,
      }),
    });

    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);

      if (chunk.includes('[DONE]')) {
        const cleanChunk = chunk.replace('[DONE]', '');
        if (cleanChunk) onChunk?.(cleanChunk);
        break;
      }

      onChunk?.(chunk);
    }
  },

  clearHistory: async (sessionId?: string): Promise<void> => {
    const id = sessionId || getOrCreateSessionId();
    await apiClient.delete(`/chat/history/${id}`);
    // Reset local session so the next message starts a fresh conversation.
    resetSessionId();
  },
};
