import { useState, useEffect } from 'react';
import { 
  Bell, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Loader2,
  ExternalLink,
  Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../shared/services/api/client';
import { toast } from 'sonner';
import { formatDate } from '../utils/helpers';

export default function AdminNotificationsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/admin/upgrade-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/admin/approve-upgrade/${id}`);
      toast.success('Request approved successfully!');
      fetchRequests();
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.post(`/admin/reject-upgrade/${id}`);
      toast.success('Request rejected.');
      fetchRequests();
    } catch (error) {
      console.error('Rejection error:', error);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 text-text-muted hover:text-gold-main hover:bg-bg-elevated rounded-xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Upgrade Notifications</h1>
            <p className="text-text-secondary mt-1">Review and manage premium membership applications.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-bg-secondary px-4 py-2 rounded-2xl border border-silver-muted/20">
          <Search size={18} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-text-primary w-48"
          />
        </div>
      </div>

      <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-text-muted">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p>Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-text-muted" size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-primary">No pending requests</h3>
            <p className="text-text-secondary mt-2">All upgrade requests have been processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-silver-muted/10">
            {filteredRequests.map((req) => (
              <div key={req._id} className="p-8 hover:bg-bg-elevated/50 transition-colors group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-gold-main/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <User className="text-gold-main" size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-text-primary">{req.userId?.name || 'Anonymous Researcher'}</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-silver-main/10 text-silver-main border border-silver-main/20 rounded-full uppercase tracking-widest font-bold">
                          {req.userId?.plan}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{req.userId?.email}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-text-muted font-medium">
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(req.createdAt)}</span>
                        {req.message && <span className="flex items-center gap-1 italic">"{req.message}"</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate(`/admin/chat/${req.userId?._id}`)}
                      className="p-3 bg-bg-elevated text-text-secondary hover:text-gold-main hover:bg-bg-secondary rounded-2xl border border-silver-muted/20 transition-all flex items-center gap-2 text-sm font-bold"
                    >
                      <MessageSquare size={18} />
                      Review & Chat
                    </button>
                    <button 
                      onClick={() => handleReject(req._id)}
                      className="p-3 bg-red-900/10 text-red-500 hover:bg-red-900/20 rounded-2xl border border-red-900/20 transition-all flex items-center gap-2 text-sm font-bold"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(req._id)}
                      className="p-3 bg-gold-main text-bg-main hover:bg-gold-hover rounded-2xl shadow-lg shadow-gold-main/20 transition-all flex items-center gap-2 text-sm font-bold"
                    >
                      <CheckCircle2 size={18} />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
