import apiClient from './client';
import { ChatMessage, ChatResponse } from '../../../types/api';

const SESSION_STORAGE_KEY = 'scholarai_chat_session_id';

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
   * Stream a message via SSE.
   * Parses SSE lines like: data: {"chunk": "..."} or data: [DONE]
   */
  sendMessageStream: async (
    message: string,
    documentIds?: string[],
    onChunk?: (chunk: string) => void,
  ): Promise<void> => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:2022/api';
    const response = await fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      credentials: 'include',
      body: JSON.stringify({
        sessionId: getOrCreateSessionId(),
        query: message,
        documentIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from buffer
        const lines = buffer.split('\n');
        // Keep the last potentially-incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6).trim();

          if (dataStr === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk) {
              onChunk?.(parsed.chunk);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e: any) {
            // If it's not JSON, treat as raw text chunk
            if (!dataStr.startsWith('{')) {
              onChunk?.(dataStr);
            }
            // Otherwise rethrow real JSON parse errors
            else if (e.message !== 'Unexpected end of JSON input') {
              console.warn('SSE parse error:', e);
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr !== '[DONE]') {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) onChunk?.(parsed.chunk);
            } catch {
              onChunk?.(dataStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  getHistory: async (id: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/chat/history/${id}`);
    return response.data.chats || [];
  },

  clearHistory: async (sessionId?: string): Promise<void> => {
    const id = sessionId || getOrCreateSessionId();
    await apiClient.delete(`/chat/history/${id}`);
    resetSessionId();
  },

  query: async (message: string, documentId?: string): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat/query', {
      sessionId: getOrCreateSessionId(),
      query: message,
      document_id: documentId,
    });
    return response.data;
  }
};
