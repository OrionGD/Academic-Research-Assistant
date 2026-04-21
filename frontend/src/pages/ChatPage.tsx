import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Send, 
  Bot, 
  User, 
  Paperclip, 
  Sparkles, 
  Trash2, 
  MoreHorizontal,
  GraduationCap,
  Loader2,
  ChevronRight,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn, formatDate } from '../utils/helpers';
import { Loader } from '../components/LoadingStates';

export default function ChatPage() {
  const location = useLocation();
  const [input, setInput] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(location.state?.documentId || null);
  
  const { data: messages, loading: isLoading, isTyping, actions } = useChat();
  const { sendMessageStream: sendStreamingMessage, clearHistory: clearConversation } = actions;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const currentInput = input;
    setInput('');
    await sendStreamingMessage(currentInput, documentId || undefined);
  };


  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-8 py-4 border-b border-silver-muted/10 flex items-center justify-between bg-bg-secondary/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gold-main rounded-xl flex items-center justify-center text-[#0E0E10] shadow-lg shadow-gold-main/20 border border-gold-main/20">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary">ScholarAI Assistant</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-silver-main rounded-full animate-pulse shadow-[0_0_8px_rgba(192,192,192,0.5)]"></span>
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Online & Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => clearConversation()}
            className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
          <button className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-all border border-transparent hover:border-silver-muted/20">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-bg-main/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={40} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-bg-elevated text-gold-main rounded-2xl flex items-center justify-center mb-6 border border-silver-muted/20 shadow-inner">
              <Sparkles size={32} className="text-glow-gold" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2 text-glow-gold">Start your research journey</h3>
            <p className="text-text-muted">Ask questions about your uploaded papers, request summaries, or compare findings across different documents.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex gap-4 max-w-4xl",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
                msg.role === 'assistant' 
                  ? "bg-bg-elevated text-gold-main border-silver-muted/20" 
                  : "bg-gold-main text-[#0E0E10] border-gold-main/20"
              )}>
                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="space-y-3">
                <div className={cn(
                  "p-6 rounded-3xl shadow-lg border",
                  msg.role === 'assistant' 
                    ? "bg-bg-elevated border-silver-muted/10 rounded-tl-none" 
                    : "bg-gold-main text-[#0E0E10] border-gold-main/20 rounded-tr-none font-semibold shadow-gold-main/10"
                )}>
                  <div className={cn(
                    "prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-bg-dark/50",
                    msg.role === 'user' ? "text-white prose-headings:text-white prose-p:text-white" : "text-text-secondary prose-headings:text-text-primary"
                  )}>
                    {msg.role === 'assistant' && !msg.content ? (
                      <div className="flex gap-1.5 items-center py-2 px-1">
                        <div className="w-2 h-2 bg-gold-main rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_5px_rgba(212,175,55,0.5)]"></div>
                        <div className="w-2 h-2 bg-gold-main rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_5px_rgba(212,175,55,0.5)]"></div>
                        <div className="w-2 h-2 bg-gold-main rounded-full animate-bounce shadow-[0_0_5px_rgba(212,175,55,0.5)]"></div>
                      </div>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cite, i) => (
                          <button 
                            key={i} 
                            className="flex items-center gap-2 px-3 py-1.5 bg-bg-elevated border border-silver-muted/10 rounded-full text-[10px] font-bold text-text-muted hover:border-gold-main/50 hover:text-gold-main hover:bg-gold-main/5 transition-all shadow-sm"
                          >
                            <GraduationCap size={12} className="text-gold-main" />
                            {cite.title}
                            <ChevronRight size={12} className="text-text-muted/40" />
                          </button>
                        ))}
                  </div>
                )}
                <span className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest px-2">
                  {formatDate(msg.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex gap-4 max-w-4xl">
            <div className="w-10 h-10 bg-bg-elevated text-gold-main rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-silver-muted/20">
              <Bot size={20} />
            </div>
            <div className="bg-bg-elevated p-6 rounded-3xl rounded-tl-none shadow-lg border border-silver-muted/10 flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-gold-main" />
              <span className="text-sm font-medium text-text-muted">ScholarAI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-bg-secondary border-t border-silver-muted/10">
        <form onSubmit={handleSend} className="relative flex items-center gap-4">
          <button type="button" className="p-3 text-text-muted hover:text-gold-main hover:bg-gold-main/10 rounded-2xl transition-all border border-transparent hover:border-gold-main/20">
            <Paperclip size={24} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your research..."
              className="input-field w-full pl-6 pr-14 py-4"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gold-main text-[#0E0E10] rounded-xl hover:bg-gold-hover transition-all disabled:opacity-50 shadow-lg shadow-gold-main/20 border border-gold-main/10"
            >
              {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
          <button type="button" className="p-3 bg-bg-elevated text-gold-main border border-silver-muted/20 rounded-2xl hover:bg-bg-secondary transition-all flex items-center gap-2 font-bold text-sm shadow-sm group">
            <Sparkles size={20} className="group-hover:text-glow-gold transition-all" />
            <span className="hidden sm:inline">Deep Analysis</span>
          </button>
        </form>
        <p className="text-center text-[10px] text-text-muted/40 mt-4 font-bold uppercase tracking-widest">
          ScholarAI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
