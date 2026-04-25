import pathlib

# Write ChatPage.tsx
chatpage = r"""import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Sparkles, Zap, BookOpen, ArrowRight } from "lucide-react";
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
  const { selectedDocument, setSelectedDocument, setMobileDrawerOpen, addSession, setSettingsOpen } = useAppStore();
  const { messages, isTyping, sendMessageStream, clearHistory } = useChat(selectedDocument?.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const isDocMode = !!selectedDocument;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    if (!hasStarted) {
      setHasStarted(true);
      addSession({
        id: `sess_${Date.now()}`, title: text.slice(0, 40) + (text.length > 40 ? "..." : ""),
        documentId: selectedDocument?.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }
    await sendMessageStream(text);
  }, [hasStarted, isTyping, selectedDocument, addSession, sendMessageStream]);

  const handleSuggestion = useCallback((s: string) => handleSend(s), [handleSend]);
  const handleAttach = useCallback((file: File) => { toast.info(`Attached: ${file.name}`); }, []);

  return (
    <div className="flex flex-col h-full bg-bg-primary relative">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface/50 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileDrawerOpen(true)} className="md:hidden bb-btn-icon"><Menu size={18} /></button>
          {isDocMode ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center"><BookOpen size={14} className="text-accent-light" /></div>
              <div className="min-w-0"><p className="text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-sm">{selectedDocument?.title}</p><p className="text-[10px] text-text-muted">Document Q&amp;A mode</p></div>
              <button onClick={() => setSelectedDocument(null)} className="text-[10px] text-accent-light hover:text-accent underline ml-2">Clear</button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center"><Sparkles size={14} className="text-white" /></div>
              <div><p className="text-sm font-medium text-text-primary">ARAS AI</p><p className="text-[10px] text-text-muted">General assistant</p></div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasStarted && <button onClick={clearHistory} className="bb-btn-icon text-[11px] px-3" title="Clear chat">New</button>}
          <button onClick={() => setSettingsOpen(true)} className="bb-btn-icon"><Zap size={16} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {!hasStarted && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-6"><Sparkles size={28} className="text-accent-light" /></div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">{isDocMode ? `Ask about "${selectedDocument?.title?.slice(0, 30)}..."` : "What can I help you with?"}</h1>
              <p className="text-sm text-text-muted mb-8">{isDocMode ? "I have access to this document. Ask me anything about its contents." : "I can help with research, analysis, coding, and more."}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    onClick={() => handleSuggestion(s)} className="px-4 py-2 bg-bg-elevated border border-border-light rounded-xl text-xs text-text-secondary hover:text-text-primary hover:border-accent/30 hover:bg-accent/5 transition-all flex items-center gap-1.5">{s}<ArrowRight size={10} className="opacity-50" /></motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="py-6 space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={msg.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <MessageBubble message={msg} isLast={i === messages.length - 1} />
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className="px-4 py-3">
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border-light flex items-center justify-center shrink-0"><Sparkles size={14} className="text-accent-light" /></div>
                  <div className="bg-bg-elevated border border-border-light rounded-2xl rounded-tl-sm px-4 py-3"><TypingIndicator /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 bg-bg-primary border-t border-border">
        {isDocMode && (
          <div className="px-4 pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-lg"><BookOpen size={10} className="text-accent-light" /><span className="text-[10px] text-accent-light font-medium">Using document context</span></div>
        )}
        <ChatInput onSend={handleSend} onAttach={handleAttach} disabled={isTyping} placeholder={isDocMode ? "Ask about this document..." : "Ask anything..."} />
      </div>
  );
}
"""
pathlib.Path("frontend/src/pages/ChatPage.tsx").write_text(chatpage, encoding="utf-8")

# Write Sidebar.tsx
sidebar = r"""import { useState } from "react";
import {
  Plus,
  Settings,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useDocuments } from "../hooks/useDocuments";
import { cn } from "../../utils/helpers";
import { toast } from "sonner";

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, selectedDocument, setSelectedDocument, setUploadModalOpen, setSettingsOpen } = useAppStore();
  const { data: documents, actions } = useDocuments();
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const handleNewChat = () => {
    setSelectedDocument(null);
  };

  const handleSelectDoc = (doc: any) => {
    setSelectedDocument(doc);
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await actions.deleteDocument(id);
    if (selectedDocument?.id === id) setSelectedDocument(null);
    setShowDelete(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          {sidebarOpen && <span className="font-semibold text-text-primary text-sm">ARAS</span>}
        </div>
        <button onClick={toggleSidebar} className="bb-btn-icon">
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className="p-3">
        <button onClick={handleNewChat} className="w-full bb-btn-primary flex items-center justify-center gap-2">
          <Plus size={16} /> {sidebarOpen && "New Chat"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-5 pb-4">
        {sidebarOpen && (
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-1">Documents</p>
            {documents.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <FileText size={24} className="mx-auto text-text-dim mb-2" />
                <p className="text-xs text-text-muted">No documents yet</p>
                <button onClick={() => setUploadModalOpen(true)} className="mt-2 text-[11px] text-accent-light hover:underline">Upload one</button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {documents.map((doc: any) => (
                  <button key={doc.id} onClick={() => handleSelectDoc(doc)} onMouseEnter={() => setShowDelete(doc.id)} onMouseLeave={() => setShowDelete(null)}
                    className={cn(
                      "bb-sidebar-item w-full text-left relative group",
                      selectedDocument?.id === doc.id && "bb-sidebar-item-active"
                    )}>
                    <BookOpen size={15} className="shrink-0" />
                    <span className="truncate flex-1 text-left text-xs">{doc.title || "Untitled"}</span>
                    {showDelete === doc.id && (
                      <span onClick={(e) => handleDeleteDoc(doc.id, e)} className="absolute right-1 p-1 rounded hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border space-y-1">
        <button onClick={() => setUploadModalOpen(true)} className="bb-sidebar-item w-full">
          <Upload size={15} /> {sidebarOpen && <span className="text-xs">Upload Document</span>}
        </button>
        <button onClick={() => setSettingsOpen(true)} className="bb-sidebar-item w-full">
          <Settings size={15} /> {sidebarOpen && <span className="text-xs">Settings</span>}
        </button>
      </div>
  );
}
"""
pathlib.Path("frontend/src/shared/components/Sidebar.tsx").write_text(sidebar, encoding="utf-8")

# Write CodeBlock.tsx
codeblock = r"""import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-code-border bg-code-bg">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-surface border-b border-code-border">
        <span className="text-[11px] font-mono text-text-muted uppercase">{language || "code"}</span>
        <button onClick={copyToClipboard} className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-bg-hover">
          {copied ? <><Check size={12} className="text-status-success" /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="text-sm font-mono leading-relaxed"><code>{value}</code></pre>
      </div>
  );
}
"""
pathlib.Path("frontend/src/shared/components/CodeBlock.tsx").write_text(codeblock, encoding="utf-8")

# Write MessageBubble.tsx
msgbubble = r"""import { useCallback } from "react";
import { User, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import MarkdownRenderer from "./MarkdownRenderer";
import type { Message } from "../hooks/useChat";

interface Props {
  message: Message;
  isLast?: boolean;
}

export default function MessageBubble({ message, isLast }: Props) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex px-4 py-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${isUser ? "bg-accent border-accent-dark" : "bg-bg-elevated border-border-light"}`}>
          {isUser ? <User size={14} className="text-white" /> : <Sparkles size={14} className="text-accent-light" />}
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? "bg-accent text-white rounded-tr-sm" : "bg-bg-elevated border border-border-light text-text-primary rounded-tl-sm"}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-light/50">
              <p className="text-[10px] font-medium text-text-muted mb-1.5">Sources</p>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md text-[10px] text-accent-light">
                    <Sparkles size={8} /> {c.title}
                  </span>
                ))}
              </div>
          )}
        </div>
    </motion.div>
  );
}
"""
pathlib.Path("frontend/src/shared/components/MessageBubble.tsx").write_text(msgbubble, encoding="utf-8")

# Write SettingsModal.tsx
settings = r"""import { useState, useEffect } from "react";
import { X, Moon, Globe, Monitor, LayoutTemplate } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { useLanguage } from "../../context/LanguageContext";
import { cn } from "../../utils/helpers";
import { toast } from "sonner";

const PREFS_KEY = "aras_preferences";

interface Preferences {
  darkMode: boolean;
  language: string;
  compactView: boolean;
  autoAnalyze: boolean;
}

const defaultPreferences: Preferences = {
  darkMode: true,
  language: "English (US)",
  compactView: false,
  autoAnalyze: true,
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultPreferences };
}

function savePreferences(prefs: Preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, toggleDarkMode, darkMode } = useAppStore();
  const { language, setLanguage } = useLanguage();
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);

  useEffect(() => {
    const p = loadPreferences();
    setPrefs(p);
  }, [settingsOpen]);

  const update = (key: keyof Preferences, value: any) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePreferences(next);
    if (key === "darkMode") {
      if (value) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      if (value !== darkMode) toggleDarkMode();
    }
    if (key === "language") setLanguage(value as any);
    if (key === "compactView") {
      if (value) document.documentElement.setAttribute("data-compact", "true");
      else document.documentElement.removeAttribute("data-compact");
    }
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={cn("w-10 h-5 rounded-full relative transition-all", on ? "bg-accent" : "bg-bg-hover")}>
      <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", on ? "right-0.5" : "left-0.5")} />
    </button>
  );

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSettingsOpen(false)} className="fixed inset-0 bg-black/50 z-40" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <div className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">Settings</h2>
                <button onClick={() => setSettingsOpen(false)} className="bb-btn-icon"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-bg-hover rounded-lg"><Moon size={16} className="text-accent-light" /></div>
                    <div><p className="text-sm font-medium text-text-primary">Dark Mode</p><p className="text-[10px] text-text-muted">Use dark theme</p></div>
                  <Toggle on={prefs.darkMode} onToggle={() => update("darkMode", !prefs.darkMode)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-bg-hover rounded-lg"><LayoutTemplate size={16} className="text-accent-light" /></div>
                    <div><p className="text-sm font-medium text-text-primary">Compact View</p><p className="text-[10px] text-text-muted">Denser layout</p></div>
                  <Toggle on={prefs.compactView} onToggle={() => update("compactView", !prefs.compactView)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-bg-hover rounded-lg"><Monitor size={16} className="text-accent-light" /></div>
                    <div><p className="text-sm font-medium text-text-primary">Auto-Analyze</p><p className="text-[10px] text-text-muted">Analyze on upload</p></div>
                  <Toggle on={prefs.autoAnalyze} onToggle={() => update("autoAnalyze", !prefs.autoAnalyze)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-bg-hover rounded-lg"><Globe size={16} className="text-accent-light" /></div>
                    <div><p className="text-sm font-medium text-text-primary">Language</p></div>
                  <select value={prefs.language} onChange={(e) => update("language", e.target.value)} className="bg-bg-hover border border-border-light text-text-primary rounded-lg px-3 py-1.5 text-xs outline-none">
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Hindi</option>
                  </select>
                </div>
              <div className="px-5 py-3 border-t border-border bg-bg-elevated/50">
                <button onClick={() => { setSettingsOpen(false); toast.success("Settings saved"); }} className="w-full bb-btn-primary">Done</button>
              </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
"""
pathlib.Path("frontend/src/shared/components/SettingsModal.tsx").write_text(settings, encoding="utf-8")

print("All 4 files written successfully")
