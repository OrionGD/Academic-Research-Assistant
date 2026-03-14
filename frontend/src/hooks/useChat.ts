import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/api/chatService';
import { ChatMessage } from '../types/api';
import { toast } from 'sonner';
import { auth } from '../services/firebase';

export function useChat() {
  const [data, setData] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(data));
  }, [data]);

  const sendMessage = async (content: string, documentIds?: string[]) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setData(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await chatService.sendMessage(content, documentIds);
      setData(prev => [...prev, response.message]);
      return response;
    } catch (err) {
      setError('Failed to send message');
      return null;
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessageStream = async (content: string, documentIds?: string[]) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setData(prev => [...prev, userMsg]);
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };

    setData(prev => [...prev, assistantMsg]);

    try {
      let fullContent = '';
      await chatService.sendMessageStream(content, documentIds, (chunk) => {
        fullContent += chunk;
        setData(prev => prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
        ));
      });
    } catch (err) {
      setError('Streaming failed');
    } finally {
      setIsTyping(false);
    }
  };

  return {
    data,
    loading,
    error,
    isTyping,
    actions: {
      sendMessage,
      sendMessageStream,
      clearHistory: async (sessionId?: string) => {
        try {
          await chatService.clearHistory(sessionId);
          setData([]);
        } catch (err) {
          setData([]); // Fallback to local clear
        }
      }
    }
  };
}
