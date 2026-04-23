import { 
  FileText, 
  Upload as UploadIcon, 
  Search as SearchIcon, 
  TrendingUp, 
  ArrowUpRight,
  MoreVertical,
  AlertCircle,
  Loader2,
  Crown,
  Zap
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { useDashboard } from '../shared/hooks/useDashboard';
import { formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { CardSkeleton, TableRowSkeleton } from '../shared/components/LoadingStates';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import UpgradeModal from '../shared/components/UpgradeModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading: isLoading, error, actions } = useDashboard();
  const { metrics, recentDocuments } = data;
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const isPremium = user?.plan === 'premium';

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg p-8">
        <AlertCircle size={48} className="text-gold-main mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Failed to load dashboard</h2>
        <p className="text-text-secondary mt-2">Please check your connection and try again.</p>
        <button
          onClick={actions.refresh}
          className="btn-gold mt-6"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight flex items-center gap-3">
            Research Dashboard
            {isPremium && (
              <span className="text-[10px] px-2 py-0.5 bg-gold-main/20 text-gold-main border border-gold-main/30 rounded-full flex items-center gap-1 uppercase tracking-widest font-black">
                <Crown size={10} /> {user.role === 'admin' ? 'Master Admin' : 'Premium'}
              </span>
            )}
          </h1>
          <p className="text-text-secondary mt-1">Welcome back, {user?.name || 'Researcher'}! {user?.role === 'admin' && 'You are currently in Researcher Mode.'} Here's your research overview.</p>
        </div>
        
        {!isPremium && (
          <button 
            onClick={() => setIsUpgradeModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-main to-gold-hover text-bg-main font-bold rounded-xl shadow-lg shadow-gold-main/20 hover:scale-105 transition-all"
          >
            <Zap size={18} fill="currentColor" />
            Upgrade to Premium
          </button>
        )}
      </div>

      {/* Upgrade Banner for Free Users */}
      {!isPremium && (
        <div className="relative overflow-hidden p-6 bg-gradient-to-br from-bg-secondary to-bg-elevated rounded-3xl border border-gold-main/20 shadow-xl group">
          <div className="absolute -right-4 -top-4 text-gold-main/5 group-hover:text-gold-main/10 transition-colors">
            <Crown size={180} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-gold-main/10 rounded-2xl border border-gold-main/20">
              <Zap size={32} className="text-gold-main" fill="currentColor" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-text-primary">Unlock Advanced AI Insights</h3>
              <p className="text-text-secondary mt-1">Free users are limited to 20 queries/day. Upgrade to get unlimited research power, advanced paper comparisons, and PDF exports.</p>
            </div>
            <button 
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-8 py-3 bg-text-primary text-bg-main font-bold rounded-2xl hover:bg-gold-main hover:text-white transition-all shadow-xl"
            >
              Get Premium for ₹150/mo
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          [
            { label: 'Total Papers', value: metrics?.totalDocuments || 0, icon: FileText, color: 'bg-bg-elevated text-silver-main' },
            { label: 'Recent Uploads', value: recentDocuments.length, icon: UploadIcon, color: 'bg-bg-elevated text-gold-main' },
            { label: 'AI Analyses', value: metrics?.totalDocuments || 0, icon: TrendingUp, color: 'bg-bg-elevated text-gold-hover' },
            { label: 'API Queries', value: `${metrics?.apiRequestsLast24h || 0}${!isPremium ? '/20' : ''}`, icon: SearchIcon, color: 'bg-bg-elevated text-silver-soft' },
          ].map((stat, i) => (
            <div key={i} className="metallic-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-xs font-bold text-gold-main bg-gold-main/10 px-2 py-1 rounded-lg border border-gold-main/20">+12%</span>
              </div>
              <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-text-primary mt-1">{stat.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-text-primary">Research Activity</h3>
            <div className="flex gap-2">
              <select className="bg-bg-elevated border border-silver-muted/30 text-text-primary rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-gold-main transition-colors">
                <option>Last 7 Days</option>
              </select>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
            {isLoading ? (
              <div className="w-full h-full bg-bg-elevated rounded-2xl animate-pulse" />
            ) : (metrics?.requestsByDay?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={metrics?.requestsByDay || []}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2B2F" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#8F8F8F', fontSize: 12}} dy={10} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#8F8F8F', fontSize: 12}} dy={10} hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#8F8F8F', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1D', borderRadius: '16px', border: '1px solid #8F8F8F', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#D4AF37' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary">
                <p>No research activity data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Insights / Profile Overview */}
        <div className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-lg relative overflow-hidden">
          {!isPremium && user?.role !== 'admin' && (
            <div className="absolute inset-0 bg-bg-secondary/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="p-4 bg-bg-elevated rounded-full mb-4">
                <Crown className="text-gold-main" size={32} />
              </div>
              <h4 className="text-lg font-bold text-text-primary">Advanced Insights Locked</h4>
              <p className="text-sm text-text-secondary mt-2">Personalized knowledge graphs and advanced research summaries are only for Premium members.</p>
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="btn-gold mt-6 w-full"
              >
                Unlock Now
              </button>
            </div>
          )}
          
          <h3 className="text-xl font-bold text-text-primary mb-6">Research Summary</h3>
          <div className="space-y-6">
            {recentDocuments.slice(0, 3).map((doc, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="mt-1 text-gold-main group-hover:scale-110 transition-transform">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Key Insight from "{doc.title.substring(0, 20)}..."</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed italic">
                    "This paper suggests a significant correlation between the variables discussed..."
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/chat" className="block w-full mt-8 py-3 text-center text-sm font-bold text-text-primary bg-bg-elevated rounded-2xl hover:bg-bg-secondary transition-all border border-silver-muted/20">
            Ask AI about your library
          </Link>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />
    </div>
  );
}
