import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Array<{ title: string; url?: string }>;
}

export const useChat = (sessionId: string = 'default') => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await apiClient.get(`/chat/history/${sessionId}`);
        // Backend now returns formattedMessages array directly
        setMessages(response.data || []);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user, sessionId]);

  const sendMessageStream = useCallback(async (content: string, documentId?: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId,
          message: content,
          documentId
        })
      });

      if (!response.ok) {
         throw new Error('AI service is temporarily unavailable.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let streamedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                streamedContent += data.text;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId ? { ...m, content: streamedContent } : m
                ));
              }
              if (data.citations) {
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId ? { ...m, citations: data.citations } : m
                ));
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e: any) {
              if (e.message.includes('AI service')) throw e;
              // otherwise likely partial JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Streaming error:', error);
      const errorMessage = error.message.includes('AI service') 
        ? error.message 
        : 'AI service is temporarily unavailable.';
        
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId ? { ...m, content: errorMessage } : m
      ));
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, isTyping]);

  const clearHistory = useCallback(async () => {
    try {
      await apiClient.delete(`/chat/history/${sessionId}`);
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, [sessionId]);

  return {
    data: messages,
    loading,
    isTyping,
    isConnected: false,
    actions: {
      sendMessageStream,
      sendMessage: sendMessageStream,
      clearHistory
    }
  };
};

