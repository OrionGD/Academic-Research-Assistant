import React from 'react';
import { BarChart3, TrendingUp, Users, FileText, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Analytics() {
  const stats = [
    { label: 'Total Users', value: '12,402', change: '+12%', icon: Users, color: 'bg-blue-500' },
    { label: 'Active Sessions', value: '1,204', change: '+5%', icon: Zap, iconColor: 'text-amber-500', color: 'bg-amber-500' },
    { label: 'Docs Processed', value: '45,829', change: '+28%', icon: FileText, color: 'bg-red-500' },
    { label: 'Total Revenue', value: '₹14.2L', change: '+18%', icon: TrendingUp, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-slate-500 mt-1">Real-time overview of system performance and growth.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -4 }}
            className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color} bg-opacity-10 text-slate-900`}>
                <stat.icon size={24} className={stat.iconColor || `text-${stat.color.split('-')[1]}-600`} />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-96 bg-white rounded-3xl border border-slate-100 shadow-xl p-8 flex items-center justify-center">
           <div className="text-slate-400 font-medium flex flex-col items-center gap-4">
             <BarChart3 size={48} />
             <span>Growth Chart Placeholder</span>
           </div>
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-100 shadow-xl p-8 flex items-center justify-center">
           <div className="text-slate-400 font-medium flex flex-col items-center gap-4">
             <TrendingUp size={48} />
             <span>Revenue Stream Placeholder</span>
           </div>
        </div>
      </div>
    </div>
  );
}
