import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, Send, Link, Plus, BookOpen, Clock, Trash2, Loader2, AlertCircle, Zap, Terminal, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/helpers';
import { useChat } from '../shared/hooks/useChat';
import { useDocuments } from '../shared/hooks/useDocuments';
import { FuturisticBackground } from '../shared/components/FuturisticBackground';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { messages, loading, isTyping, sendMessageStream, clearHistory } = useChat(selectedDocId);
  const { data: documents, actions } = useDocuments();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    actions.fetchDocuments();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || isTyping) return;
    const content = input;
    setInput('');
    await sendMessageStream(content);
  };

  const activeDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="h-full flex bg-background relative overflow-hidden flex-col lg:flex-row">
      <div className="opacity-10 pointer-events-none fixed inset-0 z-0">
        <FuturisticBackground />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar: Chat Context */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 w-80 border-r border-accent/10 flex flex-col p-6 space-y-8 bg-background/95 lg:bg-accent/[0.02] backdrop-blur-xl z-[101] lg:z-10 lg:relative lg:translate-x-0 transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between lg:hidden mb-4">
           <span className="text-[10px] font-bold text-accent uppercase tracking-widest font-mono">Chat_Navigator</span>
           <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-text-muted hover:text-accent">
              <X size={20} />
           </button>
        </div>

        <button 
          onClick={() => { clearHistory(); setIsSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-3 py-4 bg-accent/10 text-accent border border-accent/30 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent hover:text-primary-foreground transition-all shadow-[0_0_15px_var(--color-accent-glow)]"
        >
           <Plus size={16} />
           New Session
        </button>

        <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
           <div className="space-y-6">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] px-2">Active Context</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => { setSelectedDocId(undefined); setIsSidebarOpen(false); }}
                  className={cn(
                    "w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group",
                    !selectedDocId ? "bg-accent/10 border-accent/30 text-accent shadow-[0_0_15px_var(--color-accent-glow)]" : "bg-accent/[0.02] border-accent/5 text-text-secondary hover:border-accent/20"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all", !selectedDocId ? "bg-accent/20 border-accent/20" : "bg-accent/5 border-accent/10 group-hover:border-accent/30")}>
                    <Terminal size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate uppercase tracking-wider">Global Base</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] mt-1 opacity-60 font-mono">Synchronized</p>
                  </div>
                </button>

                {documents.filter(d => d.status === 'completed').map(doc => (
                  <button 
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group",
                      selectedDocId === doc.id ? "bg-accent/10 border-accent/30 text-accent shadow-[0_0_15px_var(--color-accent-glow)]" : "bg-accent/[0.02] border-accent/5 text-text-secondary hover:border-accent/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all", selectedDocId === doc.id ? "bg-accent/20 border-accent/20" : "bg-accent/5 border-accent/10 group-hover:border-accent/30")}>
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate uppercase tracking-wider">{doc.title}</p>
                      <p className="text-[9px] uppercase tracking-[0.2em] mt-1 opacity-60 font-mono">Document</p>
                    </div>
                  </button>
                ))}
              </div>
           </div>

           {messages.length > 0 && (
              <div className="space-y-6">
                 <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] px-2">Metrics</h3>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl">
                       <p className="text-[8px] text-text-muted uppercase font-bold tracking-widest">Tokens</p>
                       <p className="text-sm font-bold text-text-primary mt-2">~1.2k</p>
                    </div>
                    <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl">
                       <p className="text-[8px] text-text-muted uppercase font-bold tracking-widest">Latency</p>
                       <p className="text-sm font-bold text-text-primary mt-2">45ms</p>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </motion.aside>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col relative z-10 w-full min-w-0">
        {/* Chat Header */}
        <div className="h-20 lg:h-24 border-b border-accent/10 flex items-center justify-between px-4 lg:px-10 bg-background/50 backdrop-blur-xl shrink-0">
           <div className="flex items-center gap-3 lg:gap-5">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-text-muted hover:text-accent transition-colors"
              >
                <Menu size={24} />
              </button>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-[0_0_20px_var(--color-accent-glow)]">
                 <Sparkles size={20} className="lg:hidden" />
                 <Sparkles size={24} className="hidden lg:block" />
              </div>
              <div className="min-w-0">
                 <h2 className="text-sm lg:text-lg font-bold text-text-primary tracking-tighter uppercase tracking-widest truncate">Reasoning Agent</h2>
                 <div className="flex items-center gap-2 mt-0.5 lg:mt-1.5">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[8px] lg:text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] truncate">
                      {selectedDocId ? activeDoc?.title || 'Segment' : 'Global_Base'}
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2 lg:gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-accent/5 border border-accent/10">
                <Zap size={14} className="text-accent" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Live</span>
              </div>
              <button 
                onClick={clearHistory}
                className="p-2 lg:p-3 text-text-muted hover:text-rose-500 transition-all"
              >
                 <Trash2 size={18} className="lg:hidden" />
                 <Trash2 size={20} className="hidden lg:block" />
              </button>
           </div>
        </div>

        {/* Message List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8 lg:space-y-12 custom-scrollbar pb-40 lg:pb-48">
           {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 lg:space-y-8">
                <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-[1.5rem] lg:rounded-[2rem] bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner">
                  <MessageSquare size={32} className="lg:hidden opacity-40" />
                  <MessageSquare size={44} className="hidden lg:block opacity-40" />
                </div>
                <div className="max-w-md px-6 space-y-3 lg:space-y-4">
                  <h3 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight uppercase tracking-wider">Initialize Reasoning</h3>
                  <p className="text-xs lg:text-sm text-text-secondary leading-relaxed font-medium">
                    Ask a specific question about your research. The neural engine will retrieve verified context.
                  </p>
                </div>
              </div>
           ) : (
             <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12">
               {messages.map((msg, i) => (
                  <motion.div 
                    key={msg.id || i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3 lg:gap-8",
                      msg.role === 'assistant' ? "items-start" : "items-start flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl flex items-center justify-center shrink-0 border transition-all",
                      msg.role === 'assistant' ? "bg-accent/10 border-accent/20 text-accent shadow-[0_0_15px_var(--color-accent-glow)]" : "bg-accent text-primary-foreground border-accent shadow-lg shadow-accent/20"
                    )}>
                        {msg.role === 'assistant' ? (
                          <>
                            <Sparkles size={16} className="lg:hidden" />
                            <Sparkles size={24} className="hidden lg:block" />
                          </>
                        ) : (
                          <div className="font-bold text-sm lg:text-lg">U</div>
                        )}
                    </div>
                    <div className={cn("space-y-3 lg:space-y-4 max-w-[85%]", msg.role === 'user' && "flex flex-col items-end")}>
                        <div className={cn(
                          "p-4 lg:p-8 rounded-2xl lg:rounded-[2rem] text-xs lg:text-sm leading-relaxed whitespace-pre-wrap shadow-xl border",
                          msg.role === 'assistant' ? "bg-accent/[0.03] text-text-primary border-accent/10" : "bg-accent/10 text-text-primary border-accent/30 font-medium"
                        )}>
                          {msg.content || (isTyping && i === messages.length - 1 ? (
                            <div className="flex gap-1.5 lg:gap-2 py-1">
                              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-accent animate-bounce" />
                              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                            </div>
                          ) : '')}
                        </div>
                        {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                              {msg.citations.map((cite, ci) => (
                                <div key={ci} className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1 lg:py-1.5 bg-accent/5 border border-accent/10 rounded-full text-[8px] lg:text-[9px] font-bold text-text-muted hover:text-accent transition-all uppercase tracking-widest font-mono">
                                    <Link size={10} />
                                    S{cite.index} {cite.pageNumber && `| P.${cite.pageNumber}`}
                                </div>
                              ))}
                          </div>
                        )}
                    </div>
                  </motion.div>
               ))}
               
               {isTyping && messages[messages.length-1].role === 'user' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 lg:gap-8">
                    <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
                       <Loader2 size={16} className="lg:hidden animate-spin" />
                       <Loader2 size={24} className="hidden lg:block animate-spin" />
                    </div>
                    <div className="p-4 lg:p-8 rounded-2xl lg:rounded-[2rem] bg-accent/[0.03] border border-accent/10 flex gap-2 lg:gap-3 items-center">
                       <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-accent animate-pulse" />
                       <span className="text-[8px] lg:text-[10px] text-accent font-bold uppercase tracking-widest font-mono">REASONING...</span>
                    </div>
                 </motion.div>
               )}
             </div>
           )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-4 lg:bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 lg:px-10">
           <form onSubmit={handleSend} className="relative group">
              <div className="absolute inset-0 bg-accent/20 blur-2xl lg:blur-3xl opacity-0 group-focus-within:opacity-40 transition-opacity rounded-[2rem]" />
              <div className="relative flex items-center gap-2 lg:gap-4">
                 <input 
                   type="text" 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   disabled={loading || isTyping}
                   placeholder={selectedDocId ? "Query context..." : "Research query..."} 
                   className="w-full bg-background/90 lg:bg-background/80 border border-accent/20 rounded-[1.5rem] lg:rounded-[2rem] py-4 lg:py-7 pl-6 lg:pl-10 pr-16 lg:pr-20 text-xs lg:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-background transition-all shadow-2xl backdrop-blur-3xl disabled:opacity-50"
                 />
                 <button 
                  type="submit"
                  disabled={!input.trim() || loading || isTyping}
                  className="absolute right-2 lg:right-5 top-1/2 -translate-y-1/2 p-3 lg:p-4 bg-accent hover:bg-accent-light text-primary-foreground rounded-xl lg:rounded-2xl transition-all shadow-xl shadow-accent/20 active:scale-95 disabled:opacity-50"
                 >
                    <Send size={18} className="lg:hidden" />
                     <Send size={22} className="hidden lg:block" />
                 </button>
              </div>
           </form>
           <div className="hidden sm:flex items-center justify-center gap-4 lg:gap-6 mt-4 lg:mt-6">
              <div className="flex items-center gap-2">
                 <Shield size={12} className="text-emerald-500" />
                 <span className="text-[8px] lg:text-[9px] text-text-muted uppercase tracking-widest font-bold">SECURE_VAULT</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-accent/20" />
              <div className="flex items-center gap-2">
                 <Zap size={12} className="text-amber-500" />
                 <span className="text-[8px] lg:text-[9px] text-text-muted uppercase tracking-widest font-bold">NEURAL_SYNC</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

