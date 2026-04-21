import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  HelpCircle, 
  FileQuestion, 
  Globe, 
  Clock, 
  Send, 
  User, 
  Bot, 
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/client';
import { io, Socket } from 'socket.io-client';
import { cn, formatDate } from '../utils/helpers';

const faqs = [
  {
    question: 'What file formats are supported?',
    answer: 'Currently, we support PDF files up to 50MB. We are working on adding support for Word documents and LaTeX files in the near future.'
  },
  {
    question: 'How secure is my research data?',
    answer: 'Your data is encrypted both in transit and at rest. We use Firebase for secure authentication and follow industry best practices for data isolation.'
  },
  {
    question: 'Can I share my library with colleagues?',
    answer: 'Yes, our Enterprise and Team plans allow for shared libraries and collaborative AI chat sessions.'
  },
  {
    question: 'What AI models do you use?',
    answer: 'We leverage Google Gemini models for document analysis and conversational AI, combined with our proprietary vector indexing technology.'
  }
];

export default function SupportPage() {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket and Load History
  useEffect(() => {
    if (showChat && user) {
      // Load History
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const res = await apiClient.get('/support/chat');
          setMessages(res.data);
        } catch (err) {
          console.error('Failed to load support history:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();

      // Setup Socket
      const socket = io(import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('token') }
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_room', user.id);
      });

      socket.on('receive_support_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [showChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    setSending(true);
    try {
      const res = await apiClient.post('/support/chat', { message: input });
      setMessages(prev => [...prev, res.data]);
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main font-sans text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary-80 backdrop-blur-md border-b border-silver-muted/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gold-main rounded-xl flex items-center justify-center text-[#0E0E10] shadow-lg shadow-gold-main/20 border border-gold-main/10 group-hover:scale-105 transition-transform">
              <GraduationCap size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-text-primary">ScholarAI</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-text-muted hover:text-gold-main font-bold transition-all uppercase tracking-widest text-xs">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 tracking-tight text-glow-gold">How can we help?</h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto font-medium">
              Our support team is here to help you get the most out of ScholarAI. Choose a contact method below or browse our FAQs.
            </p>
          </motion.div>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {[
            { title: 'Email Support', desc: 'Get a response within 24 hours.', icon: Mail, action: 'Email Us', link: 'mailto:godfrey.cs23@krct.ac.in', onClick: null },
            { title: 'Live Chat', desc: 'Chat with us directly on Google Chat with searched name as Godfrey.', icon: MessageCircle, action: 'Start Chat', link: 'https://chat.google.com/', onClick: null },
            { title: 'System Forum', desc: 'Join our researcher community.', icon: Globe, action: 'Join Forum', link: 'https://forms.office.com/r/YY7mZFw1q8', onClick: null },
          ].map((item, i) => (
            <div key={i} className="bg-bg-secondary p-10 rounded-[2.5rem] border border-silver-muted/20 shadow-lg text-center flex flex-col items-center hover:border-gold-main/30 transition-all group metallic-card">
              <div className="w-20 h-20 bg-gold-main/10 rounded-2xl flex items-center justify-center text-gold-main mb-8 border border-gold-main/20 group-hover:bg-gold-main/20 transition-colors shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <item.icon size={36} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-4 text-glow-gold">{item.title}</h3>
              <p className="text-text-muted mb-8 font-medium">{item.desc}</p>
              <a 
                href={item.link !== '#' ? item.link : undefined}
                onClick={item.onClick || undefined}
                className="w-full btn-gold py-4 h-[56px] flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:shadow-gold-main/50 active:scale-95 active:shadow-[0_0_40px_rgba(212,175,55,0.7)]"
                target={item.link.startsWith('http') ? '_blank' : undefined}
                rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {item.action}
              </a>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-12 justify-center">
            <div className="w-12 h-12 bg-gold-main/10 rounded-xl flex items-center justify-center text-gold-main border border-gold-main/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <HelpCircle size={28} />
            </div>
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-bg-secondary rounded-3xl p-8 border border-silver-muted/20 shadow-lg hover:border-gold-main/30 transition-all metallic-card group">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex gap-4">
                  <div className="w-10 h-10 bg-gold-main/10 rounded-lg flex items-center justify-center text-gold-main shrink-0 border border-gold-main/10 group-hover:bg-gold-main/20 transition-colors">
                    <FileQuestion size={24} />
                  </div>
                  <span className="mt-1.5">{faq.question}</span>
                </h3>
                <p className="text-text-muted leading-relaxed pl-14 font-medium">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Chat Overlay */}
        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-8 right-8 w-full max-w-[400px] h-[600px] bg-bg-secondary rounded-[2.5rem] border border-silver-muted/20 shadow-2xl flex flex-col z-[100] overflow-hidden metallic-card"
            >
              {/* Chat Header */}
              <div className="p-6 border-b border-silver-muted/10 flex items-center justify-between bg-bg-elevated/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-main rounded-xl flex items-center justify-center text-[#0E0E10] shadow-lg">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Scholar Support</h4>
                    <span className="text-[10px] text-gold-main font-bold uppercase tracking-wider">Live Support</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="p-2 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-main/30">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={24} className="animate-spin text-gold-main" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-bg-elevated rounded-full flex items-center justify-center mx-auto mb-4 text-gold-main border border-silver-muted/10 shadow-inner">
                      <Bot size={24} />
                    </div>
                    <p className="text-sm text-text-muted font-medium">Hi {(user?.name ?? user?.displayName ?? 'there').split(' ')[0]}! How can we help you today?</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.senderRole === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm",
                        msg.senderRole === 'admin' ? "bg-bg-elevated text-gold-main border-silver-muted/10" : "bg-gold-main text-[#0E0E10] border-gold-main/10"
                      )}>
                        {msg.senderRole === 'admin' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className={cn(
                        "p-3.5 rounded-2xl text-sm font-medium shadow-sm",
                        msg.senderRole === 'admin' ? "bg-bg-elevated border border-silver-muted/5 rounded-tl-none" : "bg-gold-main text-[#0E0E10] rounded-tr-none"
                      )}>
                        {msg.message}
                        <div className={cn(
                          "text-[9px] mt-1.5 opacity-40 font-bold uppercase tracking-tighter",
                          msg.senderRole === 'user' ? "text-[#0E0E10]" : "text-text-muted"
                        )}>
                          {formatDate(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={scrollRef} />
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-silver-muted/10 bg-bg-secondary">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-bg-elevated border border-silver-muted/10 rounded-2xl py-3.5 px-5 text-sm focus:outline-none focus:border-gold-main/50 transition-all font-medium"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="p-3.5 bg-gold-main text-[#0E0E10] rounded-2xl hover:bg-gold-hover transition-all disabled:opacity-50 shadow-lg shadow-gold-main/10"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Support Hours */}
        <div className="mt-32 bg-bg-secondary rounded-[2.5rem] p-12 border border-silver-muted/20 text-text-primary flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl metallic-card">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-bg-elevated rounded-2xl flex items-center justify-center text-gold-main border border-silver-muted/10 shadow-inner">
              <Clock size={40} />
            </div>
            <div>
              <h4 className="text-2xl font-bold mb-2 text-glow-gold">Support Hours</h4>
              <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Monday — Friday, 9:00 AM — 5:00 PM EST</p>
            </div>
          </div>
          <div className="text-text-muted font-bold text-sm uppercase tracking-[0.2em] bg-bg-elevated px-6 py-3 rounded-2xl border border-silver-muted/10">
            Current status: <span className="text-gold-main animate-pulse shadow-gold-main/50">All Systems Operational</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-bg-secondary border-t border-silver-muted/10 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-text-muted font-bold uppercase tracking-[0.3em] text-[10px]">© 2026 ScholarAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

