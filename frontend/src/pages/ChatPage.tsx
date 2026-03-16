import { useState, useRef, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn, formatDate } from '../utils/helpers';
import { Loader } from '../components/LoadingStates';

export default function ChatPage() {
  const [input, setInput] = useState('');
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
    await sendStreamingMessage(currentInput);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-surface-dark rounded-3xl border border-surface-light shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-8 py-4 border-b border-surface-light flex items-center justify-between bg-surface-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-bg-dark shadow-lg shadow-accent-primary/20">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary">ScholarAI Assistant</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-highlight rounded-full animate-pulse"></span>
              <span className="text-xs text-text-secondary font-medium">Online & Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => clearConversation('default')}
            className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-all"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
          <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-medium rounded-lg transition-all">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-bg-dark/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={40} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-surface-medium text-accent-primary rounded-2xl flex items-center justify-center mb-6 border border-surface-light shadow-inner">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Start your research journey</h3>
            <p className="text-text-secondary">Ask questions about your uploaded papers, request summaries, or compare findings across different documents.</p>
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
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'assistant' ? "bg-accent-primary text-bg-dark" : "bg-surface-medium text-text-primary border border-surface-light"
              )}>
                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="space-y-3">
                <div className={cn(
                  "p-6 rounded-3xl shadow-lg border",
                  msg.role === 'assistant' 
                    ? "bg-surface-medium border-surface-light rounded-tl-none" 
                    : "bg-accent-primary text-bg-dark border-accent-highlight rounded-tr-none font-medium"
                )}>
                  <div className={cn(
                    "prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-bg-dark/50",
                    msg.role === 'user' ? "text-bg-dark prose-headings:text-bg-dark prose-p:text-bg-dark" : "text-text-secondary prose-headings:text-text-primary"
                  )}>
                    {msg.role === 'assistant' && !msg.content ? (
                      <div className="flex gap-1 items-center py-2">
                        <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"></div>
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
                            className="flex items-center gap-2 px-3 py-1.5 bg-surface-medium border border-surface-light rounded-full text-[10px] font-bold text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-all shadow-sm"
                          >
                            <GraduationCap size={12} />
                            {cite.title}
                            <ChevronRight size={12} />
                          </button>
                        ))}
                  </div>
                )}
                <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest px-2">
                  {formatDate(msg.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex gap-4 max-w-4xl">
            <div className="w-10 h-10 bg-accent-primary text-bg-dark rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={20} />
            </div>
            <div className="bg-surface-medium p-6 rounded-3xl rounded-tl-none shadow-lg border border-surface-light flex items-center gap-2">
              <Loader2 size={18} className="animate-spin text-accent-primary" />
              <span className="text-sm font-medium text-text-secondary">ScholarAI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-surface-dark border-t border-surface-light">
        <form onSubmit={handleSend} className="relative flex items-center gap-4">
          <button type="button" className="p-3 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded-2xl transition-all">
            <Paperclip size={24} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your research..."
              className="w-full pl-6 pr-14 py-4 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-light transition-all text-text-primary font-medium placeholder:text-text-secondary/50"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-accent-primary text-bg-dark rounded-xl hover:bg-accent-highlight transition-all disabled:opacity-50 shadow-lg shadow-accent-primary/20"
            >
              {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
          <button type="button" className="p-3 bg-surface-medium text-accent-primary border border-surface-light rounded-2xl hover:bg-surface-light transition-all flex items-center gap-2 font-bold text-sm shadow-inner">
            <Sparkles size={20} />
            <span className="hidden sm:inline">Deep Analysis</span>
          </button>
        </form>
        <p className="text-center text-[10px] text-text-secondary/40 mt-4 font-medium uppercase tracking-widest">
          ScholarAI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
