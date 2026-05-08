import pathlib

content = '''import { useState, useRef, useEffect, useCallback } from "react";
import {
  Menu,
  Sparkles,
  Zap,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { useChat } from "../shared/hooks/useChat";
import ChatInput from "../shared/components/ChatInput";
import MessageBubble from "../shared/components/MessageBubble";
import TypingIndicator from "../shared/components/TypingIndicator";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Summarize the key findings",
  "Explain the methodology used",
  "What are the limitations?",
  "Compare with related work",
];

export default function ChatPage() {
  const {
    selectedDocument,
    setSelectedDocument,
    setMobileDrawerOpen,
    addSession,
    setSettingsOpen,
  } = useAppStore();

  const {
    messages,
    isTyping,
    sendMessageStream,
    clearHistory,
  } = useChat(selectedDocument?.id);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const isDocMode = !!selectedDocument;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;
      if (!hasStarted) {
        setHasStarted(true);
        addSession({
          id: `sess_${Date.now()}`,
          title: text.slice(0, 40) + (text.length > 40 ? "..." : ""),
          documentId: selectedDocument?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      await sendMessageStream(text);
    },
    [hasStarted, isTyping, selectedDocument, addSession, sendMessageStream]
  );

  const handleSuggestion = useCallback((s: string) => handleSend(s), [handleSend]);
  const handleAttach = useCallback((file: File) => {
    toast.info(`Attached: ${file.name} (upload coming soon)`);
  }, []);

  return (
    <div className="flex flex-col h-full bg-bg-primary relative">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface/50 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileDrawerOpen(true)} className="md:hidden bb-btn-icon">
            <Menu size={18} />
          </button>

          {isDocMode ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
                <BookOpen size={14} className="text-accent-light" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-sm">
                  {selectedDocument?.title}
                </p>
                <p className="text-[10px] text-text-muted">Document Q&amp;A mode</p>
              </div>
              <button onClick={() => setSelectedDocument(null)}
                className="text-[10px] text-accent-light hover:text-accent underline ml-2">
                Clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">ARAS AI</p>
                <p className="text-[10px] text-text-muted">General assistant</p>
              </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasStarted && (
            <button onClick={clearHistory} className="bb-btn-icon text-[11px] px-3" title="Clear chat">
              New
            </button>
          )}
          <button onClick={() => setSettingsOpen(true)} className="bb-btn-icon">
            <Zap size={16} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {!hasStarted && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-md"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={28} className="text-accent-light" />
              </div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">
                {isDocMode ? `Ask about "${selectedDocument?.title?.slice(0, 30)}..."` : "What can I help you with?"}
              </h1>
              <p className="text-sm text-text-muted mb-8">
                {isDocMode
                  ? "I have access to this document. Ask me anything about its contents."
                  : "I can help with research, analysis, coding, and more."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleSuggestion(s)}
                    className="px-4 py-2 bg-bg-elevated border border-border-light rounded-xl text-xs text-text-secondary hover:text-text-primary hover:border-accent/30 hover:bg-accent/5 transition-all flex items-center gap-1.5"
                  >
                    {s}
                    <ArrowRight size={10} className="opacity-50" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="py-6 space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble message={msg} isLast={i === messages.length - 1} />
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <div className="px-4 py-3">
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border-light flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-accent-light" />
                  </div>
                  <div className="bg-bg-elevated border border-border-light rounded-2xl rounded-tl-sm px-4 py-3">
                    <TypingIndicator />
                  </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-bg-primary border-t border-border">
        {isDocMode && (
          <div className="px-4 pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-lg">
              <BookOpen size={10} className="text-accent-light" />
              <span className="text-[10px] text-accent-light font-medium">Using document context</span>
            </div>
        )}
        <ChatInput
          onSend={handleSend}
          onAttach={handleAttach}
          disabled={isTyping}
          placeholder={isDocMode ? "Ask about this document..." : "Ask anything..."}
        />
      </div>
  );
}
'''

path = pathlib.Path("frontend/src/pages/ChatPage.tsx")
path.write_text(content, encoding="utf-8")
print("ChatPage.tsx written successfully")
