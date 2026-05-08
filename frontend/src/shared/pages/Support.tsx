import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
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
  X,
  Terminal,
  Shield,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import apiClient from '../../shared/services/api/client';
import { io, Socket } from 'socket.io-client';
import { cn, formatDate } from '../../utils/helpers';
import { useAppStore } from '../../store/useAppStore';
import LandingNavbar from '../components/LandingNavbar';
import { 
  FuturisticCard, 
  NeonBadge, 
  HolographicPanel, 
  FuturisticHeading 
} from '../components/FuturisticUI';
import { FuturisticBackground } from '../components/FuturisticBackground';

const faqs = [
  {
    question: 'What file formats are supported?',
    answer: 'Currently, we support PDF files up to 50MB. We are working on adding support for Word documents and LaTeX files in the near future.'
  },
  {
    question: 'How secure is my research data?',
    answer: 'Your data is encrypted both in transit and at rest. We use secure session-based architecture and ensure your documents stay in your local vault.'
  },
  {
    question: 'Can I share my library with colleagues?',
    answer: 'Yes, ScholarAI is designed for collaborative intelligence. You can export research insights or share local collection access.'
  },
  {
    question: 'What AI models do you use?',
    answer: 'We leverage Google Gemini 2.0 for advanced document analysis and Llama 3.1 for fast inference, combined with local vector indexing.'
  }
];

const GUEST_USER = {
  id: 'guest_user',
  name: 'Guest Researcher',
  email: 'guest@scholarai.com',
  role: 'ADMIN'
};

export default function SupportPage() {
  const { darkMode } = useAppStore();
  const user = GUEST_USER;
  const [showChat, setShowChat] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (showChat && user) {
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

      const socket = io(import.meta.env.VITE_API_ORIGIN || 'http://localhost:2022', {
        withCredentials: true
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
    <div className="landing-page-root min-h-screen bg-bg-primary transition-colors duration-700 font-sans selection:bg-accent/20" data-theme={darkMode ? 'dark' : 'light'}>
      <FuturisticBackground />
      <LandingNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 lg:pt-32 pb-24 lg:pb-32 relative z-10">
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to="/" className="inline-flex items-center gap-3 text-text-muted hover:text-accent transition-all mb-12 font-mono text-[10px] font-bold uppercase tracking-[0.3em] group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> // RETURN_TO_COMMAND_HOME
            </Link>
            <FuturisticHeading subtitle="Communication Deck">
              How can we <span className="text-accent">help?</span>
            </FuturisticHeading>
            <p className="text-base lg:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mt-4 lg:mt-8">
              Our engineering team is here to help you get the most out of ScholarAI. Choose a secure uplink below or browse the archives.
            </p>
          </motion.div>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 mb-24 lg:mb-32">
          {[
            { title: 'Protocol Uplink', desc: 'Secure direct email for technical inquiries.', icon: Mail, action: 'Email Engineers', link: 'mailto:godfrey.cs23@krct.ac.in' },
            { title: 'Neural Chat', desc: 'Real-time assistance via digital terminal.', icon: MessageCircle, action: 'Initialize Chat', link: '#', onClick: () => setShowChat(true) },
            { title: 'Research Forum', desc: 'Global community and feature requests.', icon: Globe, action: 'Join Community', link: 'https://forms.office.com/r/YY7mZFw1q8' },
          ].map((item, i) => (
            <FuturisticCard key={i} delay={i * 0.1} className="p-8 lg:p-12 text-center flex flex-col items-center group cursor-pointer hover:border-accent/40">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6 lg:mb-10 border border-accent/20 shadow-[0_0_20px_var(--color-accent-glow)] group-hover:scale-110 transition-transform">
                <item.icon size={28} className="lg:hidden" />
                <item.icon size={36} className="hidden lg:block" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-text-primary mb-3 lg:mb-4 tracking-tight uppercase tracking-wider">{item.title}</h3>
              <p className="text-sm lg:text-base text-text-secondary mb-8 lg:mb-10 leading-relaxed font-medium">{item.desc}</p>
              <a 
                href={item.link !== '#' ? item.link : undefined}
                onClick={item.onClick || undefined}
                className="w-full bg-accent/10 border border-accent/30 text-accent py-4 lg:py-5 rounded-2xl font-bold text-[10px] lg:text-xs uppercase tracking-[0.2em] hover:bg-accent hover:text-primary-foreground transition-all shadow-[0_0_20px_var(--color-accent-glow)]"
                target={item.link.startsWith('http') ? '_blank' : undefined}
                rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {item.action}
              </a>
            </FuturisticCard>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-4xl mx-auto">
          <FuturisticHeading subtitle="Archives" align="center">
            Frequently Asked <span className="text-accent">Questions</span>
          </FuturisticHeading>
          
          <div className="grid grid-cols-1 gap-6 lg:gap-8 mt-12 lg:mt-20">
            {faqs.map((faq, i) => (
              <HolographicPanel key={i} title={`FAQ_0${i+1}`} className="p-6 lg:p-10 group hover:border-accent/30 transition-colors">
                <div className="flex flex-col sm:flex-row gap-6 lg:gap-8">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-accent/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-accent shrink-0 border border-accent/20 group-hover:shadow-[0_0_15px_var(--color-accent-glow)] transition-all">
                    <FileQuestion size={20} className="lg:hidden" />
                    <FileQuestion size={24} className="hidden lg:block" />
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold text-text-primary mb-3 lg:mb-4 tracking-tight uppercase tracking-widest">{faq.question}</h3>
                    <p className="text-sm lg:text-lg text-text-secondary leading-relaxed opacity-80">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </HolographicPanel>
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
              className="fixed bottom-0 right-0 left-0 lg:bottom-12 lg:right-12 lg:left-auto w-full lg:max-w-[450px] h-[90vh] lg:h-[650px] bg-bg-primary lg:bg-bg-primary/90 backdrop-blur-3xl rounded-t-[2.5rem] lg:rounded-[3rem] border-t lg:border border-accent/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col z-[100] overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-8 border-b border-accent/10 flex items-center justify-between bg-accent/5 backdrop-blur-xl">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-primary-foreground shadow-[0_0_20px_var(--color-accent-glow)]">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary tracking-tight">Neural Support</h4>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] text-accent font-bold uppercase tracking-widest">Protocol Active</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="p-3 text-text-muted hover:text-accent transition-colors bg-accent/10 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 size={32} className="animate-spin text-accent" />
                    <span className="text-[10px] font-mono text-accent uppercase tracking-widest">Retrieving History...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent border border-accent/20 shadow-inner">
                      <Bot size={32} />
                    </div>
                    <p className="text-sm text-text-secondary font-bold uppercase tracking-widest leading-relaxed">Hi {(user?.name ?? 'there').split(' ')[0]}!<br/>Initialize mission assistance?</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                      "flex gap-4 max-w-[90%]",
                      msg.senderRole === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                        msg.senderRole === 'admin' 
                          ? "bg-accent/10 text-accent border-accent/20 shadow-[0_0_10px_rgba(0,242,255,0.1)]" 
                          : "bg-accent text-primary-foreground border-accent"
                      )}>
                        {msg.senderRole === 'admin' ? <Bot size={20} /> : <User size={20} />}
                      </div>
                      <div className={cn(
                        "p-5 rounded-2xl text-sm leading-relaxed shadow-sm",
                        msg.senderRole === 'admin' 
                          ? "bg-accent/5 border border-accent/10 text-text-primary rounded-tl-none" 
                          : "bg-accent/10 border border-accent/30 text-text-primary rounded-tr-none"
                      )}>
                        {msg.message}
                        <div className="text-[9px] mt-2 opacity-40 font-mono font-bold uppercase tracking-tighter">
                          {formatDate(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={scrollRef} />
              </div>

              {/* Chat Input */}
              <div className="p-8 border-t border-accent/10 bg-accent/5 backdrop-blur-2xl">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter command..."
                    className="flex-1 bg-black/20 border border-accent/20 rounded-2xl py-4 px-6 text-sm text-text-primary focus:outline-none focus:border-accent transition-all font-mono placeholder:text-text-muted"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="p-4 bg-accent text-primary-foreground rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_var(--color-accent-glow)]"
                  >
                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Support Hours */}
        <FuturisticCard className="mt-32 p-12 flex flex-col md:flex-row items-center justify-between gap-8 group">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center text-accent border border-accent/20 shadow-[0_0_30px_var(--color-accent-glow)] group-hover:scale-110 transition-transform">
              <Clock size={40} />
            </div>
            <div>
              <h4 className="text-3xl font-bold mb-2 text-text-primary tracking-tight">Support Window</h4>
              <p className="text-text-secondary font-bold uppercase tracking-[0.2em] text-xs">Mon — Fri // 09:00 — 17:00 EST</p>
            </div>
          </div>
          <div className="text-accent font-mono font-bold text-[10px] uppercase tracking-[0.3em] bg-accent/5 px-8 py-4 rounded-2xl border border-accent/20 flex items-center gap-4">
            <Activity size={16} className="animate-pulse" />
            Node_Status: <span className="text-emerald-500">All_Systems_Stable</span>
          </div>
        </FuturisticCard>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-accent/10 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
             <div className="w-8 h-8 rounded-lg bg-accent shadow-[0_0_15px_var(--accent)] flex items-center justify-center">
                <Terminal size={18} className="text-primary-foreground" />
             </div>
             <span className="text-xl font-bold tracking-tighter text-text-primary uppercase">ScholarAI</span>
          </div>
          <p className="text-text-muted font-mono font-bold uppercase tracking-[0.4em] text-[10px]">© 2026 SCHOLAR_AI // ALL_RIGHTS_RESERVED</p>
        </div>
      </footer>
    </div>
  );
}

