import { useState, useCallback, useRef } from "react";
import { chatService } from "../services/api/chatService";
import { ChatMessage } from "../../types/api";

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  isTyping: boolean;
  sendMessageStream: (content: string) => Promise<void>;
  clearHistory: () => void;
}

import { useAppStore } from "../../store/useAppStore";

export function useChat(documentId?: string): UseChatReturn {
  const { activeCollectionName } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessageStream = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;

    // Cancel any in-progress stream
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setLoading(true);

    const assistantId = `a_${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      citations: []
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      await chatService.sendMessageStream(
        content,
        documentId ? [documentId] : undefined,
        activeCollectionName || undefined,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        (citations) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, citations: citations } : m
            )
          );
        }
      );
    } catch (error: any) {
      const errMsg = error.message?.includes("abort")
        ? ""
        : `AI service error: ${error.message || "Unknown error"}`;
      if (errMsg) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + "\n\n" + errMsg } : m
          )
        );
      }
    } finally {
      setIsTyping(false);
      setLoading(false);
      abortRef.current = null;
    }
  }, [documentId, isTyping]);

  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsTyping(false);
    setLoading(false);
  }, []);

  return {
    messages,
    loading,
    isTyping,
    sendMessageStream,
    clearHistory,
  };
}
