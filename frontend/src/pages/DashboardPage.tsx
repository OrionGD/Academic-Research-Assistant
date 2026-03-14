import { 
  FileText, 
  Upload as UploadIcon, 
  Search as SearchIcon, 
  MessageSquare, 
  TrendingUp, 
  ArrowUpRight,
  MoreVertical,
  AlertCircle,
  Loader2
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
import { useDashboard } from '../hooks/useDashboard';
import { formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { CardSkeleton, TableRowSkeleton } from '../components/LoadingStates';

export default function DashboardPage() {
  const { data, loading: isLoading, error } = useDashboard();
  const { metrics, recentDocuments } = data;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-surface-dark rounded-3xl border border-surface-light shadow-lg p-8">
        <AlertCircle size={48} className="text-accent-primary mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Failed to load dashboard</h2>
        <p className="text-text-secondary mt-2">Please check your connection and try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-accent-primary text-bg-dark rounded-xl font-bold hover:bg-accent-highlight transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Research Dashboard</h1>
        <p className="text-text-secondary mt-1">Welcome back! Here's what's happening in your research library.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          [
            { label: 'Total Papers', value: metrics?.totalDocuments || 0, icon: FileText, color: 'bg-surface-medium text-accent-primary' },
            { label: 'Recent Uploads', value: recentDocuments.length, icon: UploadIcon, color: 'bg-surface-medium text-accent-highlight' },
            { label: 'AI Analyses', value: metrics?.totalDocuments || 0, icon: TrendingUp, color: 'bg-surface-medium text-accent-glow' },
            { label: 'Search Queries', value: metrics?.apiRequestsLast24h || 0, icon: SearchIcon, color: 'bg-surface-medium text-accent-primary' },
          ].map((stat, i) => (
            <div key={i} className="bg-surface-dark p-6 rounded-3xl border border-surface-light shadow-lg hover:border-accent-primary/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-xs font-bold text-accent-highlight bg-accent-primary/10 px-2 py-1 rounded-lg border border-accent-primary/20">+12%</span>
              </div>
              <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-text-primary mt-1">{stat.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-text-primary">Research Activity</h3>
            <select className="bg-surface-medium border border-surface-light text-text-primary rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-accent-primary transition-colors">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="w-full h-full bg-surface-medium rounded-2xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.requestsByDay || [
                  { date: 'Mon', count: 20 },
                  { date: 'Tue', count: 45 },
                  { date: 'Wed', count: 30 },
                  { date: 'Thu', count: 70 },
                  { date: 'Fri', count: 55 },
                  { date: 'Sat', count: 25 },
                  { date: 'Sun', count: 15 },
                ]}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#123420" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#86efac', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#86efac', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b2416', borderRadius: '16px', border: '1px solid #123420', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#4ade80' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#4ade80" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-lg">
          <h3 className="text-xl font-bold text-text-primary mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-surface-medium rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-surface-medium rounded animate-pulse" />
                    <div className="w-20 h-3 bg-surface-medium/50 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : (
              recentDocuments.length > 0 ? (
                recentDocuments.map((doc, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="mt-1 text-accent-primary group-hover:scale-110 transition-transform">
                      <UploadIcon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Uploaded "{doc.title}"</p>
                      <p className="text-xs text-text-secondary mt-0.5">{formatDate(doc.uploadDate)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-secondary italic">No recent activity found.</p>
              )
            )}
          </div>
          <Link to="/library" className="block w-full mt-8 py-3 text-center text-sm font-bold text-text-primary bg-surface-medium rounded-2xl hover:bg-surface-light transition-all border border-surface-light">
            View All Activity
          </Link>
        </div>
      </div>

      {/* Recent Papers Table */}
      <div className="bg-surface-dark rounded-3xl border border-surface-light shadow-lg overflow-hidden">
        <div className="p-8 border-b border-surface-light flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-primary">Recently Uploaded Papers</h3>
          <Link to="/library" className="text-sm font-bold text-accent-primary hover:text-accent-highlight flex items-center gap-1 transition-colors">
            View Library <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-medium/50">
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Paper Title</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Authors</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Year</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Upload Date</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
              ) : (
                recentDocuments.map((paper) => (
                  <tr key={paper.id} className="hover:bg-surface-medium/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-medium text-accent-primary rounded-lg group-hover:scale-110 transition-transform">
                          <FileText size={18} />
                        </div>
                        <span className="font-semibold text-text-primary">{paper.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-text-secondary">{paper.authors.join(', ')}</td>
                    <td className="px-8 py-5 text-sm text-text-secondary">{paper.year}</td>
                    <td className="px-8 py-5 text-sm text-text-secondary">{formatDate(paper.uploadDate)}</td>
                    <td className="px-8 py-5">
                      {paper.status === 'processing' ? (
                        <span className="px-3 py-1 bg-accent-primary/10 text-accent-primary text-xs font-bold rounded-full flex items-center gap-1 w-fit border border-accent-primary/20">
                          <Loader2 size={12} className="animate-spin" />
                          Processing
                        </span>
                      ) : paper.status === 'error' ? (
                        <span className="px-3 py-1 bg-red-900/20 text-red-400 text-xs font-bold rounded-full flex items-center gap-1 w-fit border border-red-900/50">
                          <AlertCircle size={12} />
                          Error
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-accent-primary/10 text-accent-highlight text-xs font-bold rounded-full border border-accent-primary/20">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-medium rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
