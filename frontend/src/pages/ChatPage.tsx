import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, Send, Link, Plus, BookOpen, Clock, Trash2, Loader2, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/helpers';
import { useChat } from '../shared/hooks/useChat';
import { useDocuments } from '../shared/hooks/useDocuments';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);
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
    <div className="h-full flex bg-background">
      {/* Sidebar: Chat Context */}
      <div className="w-80 border-r border-border flex flex-col p-6 space-y-8 bg-card/50">
        <button 
          onClick={clearHistory}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent/10 text-accent border border-accent/20 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-accent/20 transition-all"
        >
           <Plus size={16} />
           New Session
        </button>

        <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
           <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest px-2">Active Context</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedDocId(undefined)}
                  className={cn(
                    "w-full p-3 rounded-xl border transition-all flex items-center gap-3 text-left",
                    !selectedDocId ? "bg-accent/15 border-accent/30 text-accent" : "bg-white/5 border-white/5 text-text-dim hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", !selectedDocId ? "bg-accent/20 border-accent/20" : "bg-white/5 border-white/10")}>
                    <Sparkles size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">Global Research Base</p>
                    <p className="text-[9px] uppercase tracking-widest mt-0.5 opacity-60">All Synchronized Sources</p>
                  </div>
                </button>

                {documents.filter(d => d.status === 'completed').map(doc => (
                  <button 
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={cn(
                      "w-full p-3 rounded-xl border transition-all flex items-center gap-3 text-left",
                      selectedDocId === doc.id ? "bg-accent/15 border-accent/30 text-accent" : "bg-white/5 border-white/5 text-text-dim hover:bg-white/10"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", selectedDocId === doc.id ? "bg-accent/20 border-accent/20" : "bg-white/5 border-white/10")}>
                      <BookOpen size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate">{doc.title}</p>
                      <p className="text-[9px] uppercase tracking-widest mt-0.5 opacity-60">Specific Document</p>
                    </div>
                  </button>
                ))}
              </div>
           </div>

           {messages.length > 0 && (
              <div className="space-y-4">
                 <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest px-2">Session Metrics</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                       <p className="text-[8px] text-text-dim uppercase font-bold">Tokens</p>
                       <p className="text-sm font-bold text-text-primary mt-1">~1.2k</p>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                       <p className="text-[8px] text-text-dim uppercase font-bold">Latency</p>
                       <p className="text-sm font-bold text-text-primary mt-1">45ms</p>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="h-20 border-b border-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-md">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                 <Sparkles size={20} />
              </div>
              <div>
                 <h2 className="text-sm font-bold text-text-primary tracking-tight">RAG Reasoning Agent</h2>
                 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                   {selectedDocId ? `Focusing on: ${activeDoc?.title || 'Single Document'}` : 'Grounded in all Synchronized Knowledge'}
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">AI Streaming Active</span>
              </div>
              <button 
                onClick={clearHistory}
                className="p-2.5 text-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                 <Trash2 size={18} />
              </button>
           </div>
        </div>

        {/* Message List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-40">
           {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-text-dim border border-white/5">
                  <MessageSquare size={36} />
                </div>
                <div className="max-w-xs space-y-2">
                  <h3 className="text-lg font-bold text-text-primary">Initialize Reasoning</h3>
                  <p className="text-xs text-text-dim leading-relaxed font-medium">
                    Ask a specific question about your documents. The AI will retrieve relevant context before generating a response.
                  </p>
                </div>
              </div>
           ) : (
             <div className="max-w-4xl mx-auto space-y-10">
               {messages.map((msg, i) => (
                  <motion.div 
                    key={msg.id || i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-6",
                      msg.role === 'assistant' ? "items-start" : "items-start flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                      msg.role === 'assistant' ? "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/5" : "bg-accent/10 border-accent/20 text-accent"
                    )}>
                        {msg.role === 'assistant' ? <Sparkles size={20} /> : <div className="font-bold text-sm">U</div>}
                    </div>
                    <div className={cn("space-y-4 max-w-[85%]", msg.role === 'user' && "flex flex-col items-end")}>
                        <div className={cn(
                          "p-6 rounded-[24px] text-sm leading-relaxed whitespace-pre-wrap shadow-xl",
                          msg.role === 'assistant' ? "bg-white/[0.03] text-text-primary border border-white/[0.05]" : "bg-accent text-white font-medium"
                        )}>
                          {msg.content || (isTyping && i === messages.length - 1 ? (
                            <div className="flex gap-1.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-text-dim animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-text-dim animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-text-dim animate-bounce [animation-delay:0.4s]" />
                            </div>
                          ) : '')}
                        </div>
                        {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                              {msg.citations.map((cite, ci) => (
                                <div key={ci} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-text-dim hover:text-accent cursor-pointer transition-all uppercase tracking-widest">
                                    <Link size={10} />
                                    Source {cite.index} {cite.pageNumber && `| p.${cite.pageNumber}`}
                                </div>
                              ))}
                          </div>
                        )}
                    </div>
                  </motion.div>
               ))}
               
               {isTyping && messages[messages.length-1].role === 'user' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                       <Loader2 size={18} className="animate-spin" />
                    </div>
                    <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/[0.05] flex gap-1.5 items-center">
                       <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                       <span className="text-xs text-text-dim font-bold uppercase tracking-widest">AI is reasoning...</span>
                    </div>
                 </motion.div>
               )}
             </div>
           )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8">
           <form onSubmit={handleSend} className="relative group">
              <div className="absolute inset-0 bg-accent/10 blur-3xl opacity-0 group-focus-within:opacity-40 transition-opacity" />
              <div className="relative flex items-center gap-3">
                 <input 
                   type="text" 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   disabled={loading || isTyping}
                   placeholder={selectedDocId ? "Ask about this specific document..." : "Ask a question across all research sources..."} 
                   className="w-full bg-card/90 border border-border rounded-3xl py-6 pl-8 pr-16 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:bg-card transition-all shadow-2xl backdrop-blur-xl disabled:opacity-50"
                 />
                 <button 
                  type="submit"
                  disabled={!input.trim() || loading || isTyping}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-accent hover:bg-accent-light text-white rounded-2xl transition-all shadow-xl shadow-accent/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
                 >
                    {loading || isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                 </button>
              </div>
           </form>
           <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                 <Shield size={10} className="text-emerald-400" />
                 <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Privacy Guard Active</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <div className="flex items-center gap-1.5">
                 <Zap size={10} className="text-amber-400" />
                 <span className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Vectorized Retrieval</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function Shield({ size, className }: { size: number; className?: string }) {
  return <div className={className}><AlertCircle size={size} /></div>;
}
