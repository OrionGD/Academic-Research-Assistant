import pathlib

content = '''import { useState, useCallback, useRef } from "react";
import { chatService } from "../shared/services/api/chatService";
import { ChatMessage } from "../../types/api";

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  isTyping: boolean;
  sendMessageStream: (content: string) => Promise<void>;
  clearHistory: () => void;
}

export function useChat(documentId?: string): UseChatReturn {
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
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      await chatService.sendMessageStream(
        content,
        documentId ? [documentId] : undefined,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      );
    } catch (error: any) {
      const errMsg = error.message?.includes("abort")
        ? ""
        : "AI service is temporarily unavailable.";
      if (errMsg) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: errMsg } : m
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
'''

path = pathlib.Path("frontend/src/shared/hooks/useChat.ts")
path.write_text(content, encoding="utf-8")
print("useChat.ts written successfully")
