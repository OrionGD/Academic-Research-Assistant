import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Sparkles, Zap, BookOpen, ChevronDown, X, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../store/useAppStore";
import { useChat } from "../shared/hooks/useChat";
import { useDocuments } from "../shared/hooks/useDocuments";
import ChatInput from "../shared/components/ChatInput";
import MessageBubble from "../shared/components/MessageBubble";
import TypingIndicator from "../shared/components/TypingIndicator";
import { cn } from "../utils/helpers";

const SUGGESTED_QUESTIONS = [
  "What is the main contribution of this paper?",
  "Explain the methodology used in this study.",
  "What are the key limitations?",
  "How do the results compare to prior work?",
  "What future research directions are suggested?",
];

export default function ChatPage() {
  const { selectedDocument, setSelectedDocument, setMobileDrawerOpen, addSession, setSettingsOpen } = useAppStore();
  const { messages, isTyping, sendMessageStream, clearHistory } = useChat(selectedDocument?.id);
  const { data: documents, actions } = useDocuments();

  useEffect(() => {
    actions.fetchDocuments(1, 50); // Fetch up to 50 documents for the switcher
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showDocSwitcher, setShowDocSwitcher] = useState(false);
  const isDocMode = !!selectedDocument;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    if (!hasStarted) {
      setHasStarted(true);
      addSession({ id: "sess_" + Date.now(), title: text.slice(0, 40), documentId: selectedDocument?.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await sendMessageStream(text);
  }, [hasStarted, isTyping, selectedDocument, addSession, sendMessageStream]);

  const handleSuggestedQuestion = (q: string) => {
    handleSend(q);
  };

  const lastAssistantMsg = messages.filter(m => m.role === 'assistant').pop();
  const showSuggestions = hasStarted && !isTyping && lastAssistantMsg && messages.length <= 3;

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface/50 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileDrawerOpen(true)} className="md:hidden bb-btn-icon">
            <Menu size={18} />
          </button>
          {isDocMode ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
                <BookOpen size={14} className="text-accent-light" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">{selectedDocument?.title}</p>
                <p className="text-[10px] text-text-muted">Document Q&amp;A</p>
              </div>
              <button onClick={() => setSelectedDocument(null)} className="text-[10px] text-accent-light underline ml-1">Clear</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">ScholarAI</p>
                <p className="text-[10px] text-text-muted">General assistant</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Document Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowDocSwitcher(!showDocSwitcher)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-light hover:border-accent/30 transition-colors text-xs text-text-secondary"
            >
              <BookOpen size={12} />
              <span className="max-w-[120px] truncate">{selectedDocument?.title || 'All Documents'}</span>
              <ChevronDown size={12} className={cn("transition-transform", showDocSwitcher && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showDocSwitcher && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDocSwitcher(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-bg-surface border border-border rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => { setSelectedDocument(null); setShowDocSwitcher(false); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                          !selectedDocument ? "bg-accent/15 text-accent-light" : "text-text-secondary hover:bg-bg-elevated"
                        )}
                      >
                        <MessageSquare size={12} />
                        General Chat (All Documents)
                      </button>
                      <div className="h-px bg-border my-1" />
                      {documents.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-text-dim italic">No documents uploaded yet</p>
                      ) : (
                        documents.map((doc: any) => (
                          <button
                            key={doc.id}
                            onClick={() => { setSelectedDocument(doc); setShowDocSwitcher(false); }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left",
                              selectedDocument?.id === doc.id ? "bg-accent/15 text-accent-light" : "text-text-secondary hover:bg-bg-elevated"
                            )}
                          >
                            <BookOpen size={12} />
                            <span className="truncate">{doc.title || 'Untitled'}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {hasStarted && (
            <button onClick={clearHistory} className="bb-btn-icon text-[11px] px-2">New</button>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={28} className="text-accent-light" />
              </div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">
                {isDocMode ? "Ask about this document..." : "What can I help you with?"}
              </h1>
              <p className="text-sm text-text-muted">
                {isDocMode ? "I have access to this document and can answer questions with citations." : "I can help with research analysis, literature review, and paper understanding."}
              </p>

              {/* Suggested Questions */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.slice(0, isDocMode ? 5 : 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="px-3 py-1.5 bg-bg-elevated border border-border-light rounded-lg text-xs text-text-secondary hover:border-accent/30 hover:text-text-primary transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="py-6 space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={msg.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <MessageBubble message={msg} />
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
              </div>
            )}

            {/* Inline Suggested Questions */}
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2"
              >
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2 px-1">Suggested follow-ups</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q)}
                      className="px-3 py-1.5 bg-bg-elevated border border-border-light rounded-lg text-xs text-text-secondary hover:border-accent/30 hover:text-text-primary transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-bg-primary border-t border-border">
        {isDocMode && (
          <div className="px-4 pt-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent/10 border border-accent/20 rounded-lg">
              <BookOpen size={10} className="text-accent-light" />
              <span className="text-[10px] text-accent-light font-medium">Using document context</span>
            </div>
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={isTyping} placeholder={isDocMode ? "Ask about document..." : "Ask anything..."} />
      </div>
    </div>
  );
}

