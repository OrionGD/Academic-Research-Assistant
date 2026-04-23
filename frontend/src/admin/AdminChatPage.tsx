import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Send, 
  ArrowLeft, 
  User as UserIcon, 
  ShieldCheck, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Circle,
  Clock,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';
import apiClient from '../shared/services/api/client';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { cn } from '../utils/helpers';

export default function AdminChatPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Load Support History & Handle Sockets
  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/support/chat?userId=${userId}`);
        setMessages(res.data || []);
        // Mark as read
        await apiClient.patch(`/support/admin/read/${userId}`);
      } catch (err) {
        console.error('Failed to load support history:', err);
        toast.error('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    const socket = io(import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000', {
       withCredentials: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_admin'); // Join the admin notification room
      socket.emit('join_room', userId); // Join the specific user's room to see their live messages
    });

    socket.on('receive_support_message', (msg) => {
      // Only append if it belongs to this conversation
      if (msg.senderId === userId || msg.receiverId === userId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    // We also listen for 'new_support_message' emitted by the backend to admins
    socket.on('new_support_message', (msg) => {
      if (msg.senderId === userId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Load Pending Upgrade Requests
  useEffect(() => {
    const fetchPendingRequest = async () => {
      try {
        const res = await apiClient.get('/admin/upgrade-requests');
        const userRequest = res.data.find((req: any) => req.userId?._id === userId && req.status === 'pending');
        setPendingRequest(userRequest || null);
      } catch (err) {
        console.error('Failed to check upgrade requests', err);
      }
    };
    if (userId) fetchPendingRequest();
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleApprove = async () => {
    if (!pendingRequest) return;
    setLoadingAction(true);
    try {
      await apiClient.post(`/admin/approve-upgrade/${pendingRequest._id}`);
      toast.success('User has been approved for PRO!');
      setPendingRequest(null);
    } catch (e) {
      toast.error('Failed to approve request.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async () => {
    if (!pendingRequest) return;
    setLoadingAction(true);
    try {
      await apiClient.post(`/admin/reject-upgrade/${pendingRequest._id}`);
      toast.success('Request rejected.');
      setPendingRequest(null);
    } catch (e) {
      toast.error('Failed to reject request.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    setSending(true);
    try {
      const res = await apiClient.post('/support/admin/reply', {
        userId,
        message: input
      });
      setMessages(prev => [...prev, res.data]);
      setInput('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-bg-secondary rounded-[32px] border border-silver-muted/20 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-6 bg-bg-elevated border-b border-silver-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-text-muted hover:text-gold-main hover:bg-bg-secondary rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative">
            <div className="w-12 h-12 bg-gold-main/20 rounded-2xl flex items-center justify-center">
              <UserIcon className="text-gold-main" size={24} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-4 border-bg-elevated bg-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              Support Thread
              <ShieldCheck size={16} className="text-gold-main" />
            </h3>
            <p className="text-xs text-text-secondary flex items-center gap-1.5 font-medium">
              User Outreach
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-text-muted hover:text-gold-main hover:bg-bg-secondary rounded-xl transition-all">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Upgrade Request Banner */}
      <AnimatePresence>
        {pendingRequest && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gold-main/10 border-b border-gold-main/20 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold-main/20 rounded-xl">
                <ShieldCheck className="text-gold-main" size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2 text-glow-gold">
                  Pending Premium Request
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  This user has applied for PRO tier. {pendingRequest.message ? `"${pendingRequest.message}"` : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={handleReject}
                disabled={loadingAction}
                className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Reject Request
              </button>
              <button 
                onClick={handleApprove}
                disabled={loadingAction}
                className="px-6 py-2 bg-gold-main text-bg-main hover:bg-gold-hover rounded-xl text-xs font-black transition-all shadow-lg shadow-gold-main/20 disabled:opacity-50 uppercase tracking-widest"
              >
                Approve to PRO
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-bg-main/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-gold-main" />
          </div>
        ) : (
          messages.map((msg: any, i: number) => {
            const isMe = msg.senderRole === 'admin';
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg._id || i} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] group`}>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed
                    ${isMe 
                      ? 'bg-gold-main text-bg-main rounded-tr-none shadow-gold-main/10' 
                      : 'bg-bg-elevated text-text-primary border border-silver-muted/10 rounded-tl-none'}
                  `}>
                    {msg.message}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-2 px-1 text-[10px] text-text-muted uppercase tracking-widest font-bold ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <Clock size={10} />
                     {formatDate(msg.createdAt)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-bg-elevated border-t border-silver-muted/20">
        <form onSubmit={handleSend} className="flex items-center gap-3 bg-bg-secondary p-2 pl-4 rounded-2xl border border-silver-muted/10 focus-within:border-gold-main/30 transition-all shadow-inner">
          <button type="button" className="p-2 text-text-muted hover:text-gold-main transition-colors">
            <Smile size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Reply to user..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm font-medium py-3"
            disabled={sending}
          />
          <button type="button" className="p-2 text-text-muted hover:text-gold-main transition-colors">
            <Paperclip size={20} />
          </button>
          <button 
            type="submit"
            disabled={!input.trim() || sending}
            className="p-3 bg-gold-main text-bg-main rounded-[14px] hover:bg-gold-hover disabled:opacity-50 transition-all shadow-lg shadow-gold-main/10"
          >
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}

