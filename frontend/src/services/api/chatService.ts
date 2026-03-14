import apiClient from './client';
import { ChatMessage, ChatResponse } from '../../types/api';
import { auth } from '../firebase';

/**
 * Chat API Service
 */
export const chatService = {
  sendMessage: async (message: string, documentIds?: string[]): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', { 
      message,
      documentIds 
    });
    return response.data;
  },

  /**
   * Stream a message to the AI Research Assistant
   */
  sendMessageStream: async (message: string, documentIds?: string[], onChunk?: (chunk: string) => void): Promise<void> => {
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message, documentIds }),
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
    await apiClient.delete(`/chat/history${sessionId ? `/${sessionId}` : ''}`);
  }
};
