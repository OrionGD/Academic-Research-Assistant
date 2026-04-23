import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Users, 
  Database,
  ArrowUpRight,
  MessageSquare,
  FileSearch,
  Zap,
  HardDrive
} from 'lucide-react';
import { SystemMetrics } from '../../../types/api';

interface AdminAnalyticsTabProps {
  metrics: SystemMetrics | null;
}

const COLORS = ['#D4AF37', '#8F8F8F', '#2A2B2F', '#1A1A1D'];

export default function AdminAnalyticsTab({ metrics }: AdminAnalyticsTabProps) {
  const chartData = metrics?.requestsByDay || [];
  const stats = metrics?.platformStats;

  const distributionData = stats?.userDistribution.map(d => ({
    name: d._id,
    value: d.count
  })) || [];

  const mainMetrics = [
    { 
      label: 'Platform Users', 
      value: stats?.totalUsers || 0, 
      sub: `${stats?.activeUsersToday || 0} active today`, 
      icon: Users,
      color: 'text-gold-main' 
    },
    { 
      label: 'System Capacity', 
      value: stats?.totalStorage ? (stats.totalStorage / (1024 * 1024)).toFixed(1) + ' MB' : '0 MB', 
      sub: 'Total Storage used', 
      icon: HardDrive,
      color: 'text-blue-400'
    },
    { 
      label: 'AI Interpretations', 
      value: stats?.totalAnalyses || 0, 
      sub: 'Completed analyses', 
      icon: FileSearch,
      color: 'text-purple-400'
    },
    { 
      label: 'Node Traffic', 
      value: stats?.totalMessages || 0, 
      sub: 'Total chat messages', 
      icon: MessageSquare,
      color: 'text-green-400'
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Interpretation Banner */}
      <div className="bg-gradient-to-r from-gold-main/20 via-gold-main/5 to-transparent p-6 rounded-[32px] border border-gold-main/20 flex items-center gap-6">
        <div className="p-4 bg-gold-main rounded-2xl text-bg-main shadow-lg shadow-gold-main/20">
          <Zap size={32} fill="currentColor" />
        </div>
        <div>
          <h3 className="text-xl font-black text-text-primary tracking-tight italic uppercase italic">System Intelligence <span className="text-gold-main underline underline-offset-4 decoration-2">Interpreted</span></h3>
          <p className="text-text-secondary text-sm mt-1 max-w-2xl font-medium">
            Platform health is <span className="text-gold-main font-bold">Optimal</span>. User engagement has stabilized with a <span className="text-gold-main">{(stats?.activeUsersToday || 0) > 0 ? 'Positive' : 'Neutral'}</span> growth trend. Storage utilization is well within projected limits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainMetrics.map((m, i) => (
          <div key={i} className="bg-bg-secondary p-6 rounded-[28px] border border-silver-muted/20 shadow-lg metallic-card group transition-all hover:border-gold-main/20">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-bg-elevated rounded-2xl ${m.color} group-hover:scale-110 transition-transform`}>
                <m.icon size={20} />
              </div>
              <ArrowUpRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">{m.label}</p>
            <p className="text-2xl font-black text-text-primary mt-1 tracking-tighter">{m.value}</p>
            <p className="text-[10px] text-text-muted mt-1 font-medium italic">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-bg-secondary p-8 rounded-[32px] border border-silver-muted/20 shadow-xl metallic-card h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <TrendingUp size={20} className="text-gold-main" />
              Ingestion Velocity
            </h4>
            <div className="px-3 py-1 bg-gold-main/10 border border-gold-main/20 rounded-lg text-[10px] font-black text-gold-main uppercase tracking-widest">
              Live Feed
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E0E10', border: '1px solid #ffffff10', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-secondary p-8 rounded-[32px] border border-silver-muted/20 shadow-xl metallic-card flex flex-col items-center justify-center text-center">
            <h4 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-6 w-full text-left">
              Tier Distribution
            </h4>
            <div className="flex-1 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-gold-main">{stats?.totalUsers || 0}</span>
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {distributionData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-text-secondary uppercase">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}
