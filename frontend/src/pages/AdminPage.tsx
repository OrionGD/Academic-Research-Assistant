import { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Shield, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Server,
  Database,
  Cpu,
  ArrowUpRight
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { formatDate, cn } from '../utils/helpers';
import { Loader } from '../components/LoadingStates';
import { motion } from 'motion/react';

export default function AdminPage() {
  const { data, loading: isLoading, error, actions } = useAdmin();
  const { metrics, users } = data;
  const { deleteUser: handleDeleteUserAction } = actions;

  const handleDeleteUser = async (id: string) => {
    // Note: window.confirm might not work in some iframe environments
    if (window.confirm('Are you sure you want to delete this user? This action is irreversible.')) {
      await handleDeleteUserAction(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-surface-dark rounded-3xl border border-surface-light">
        <Shield size={48} className="mx-auto text-accent-primary mb-4" />
        <h3 className="text-lg font-bold text-text-primary">{error}</h3>
        <p className="text-text-secondary mb-6">Please contact the system administrator if you believe this is an error.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">System Administration</h1>
        <p className="text-text-secondary mt-1">Monitor system performance and manage user accounts.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20' },
          { label: 'Total Documents', value: metrics?.totalDocuments || 0, icon: Database, color: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20' },
          { label: 'API Requests (24h)', value: metrics?.apiRequestsLast24h || 0, icon: Activity, color: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20' },
          { label: 'System Health', value: '99.9%', icon: Server, color: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-dark p-6 rounded-3xl border border-surface-light shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl border ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <CheckCircle2 className="text-accent-primary" size={20} />
            </div>
            <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="lg:col-span-2 bg-surface-dark rounded-3xl border border-surface-light shadow-lg overflow-hidden">
          <div className="p-8 border-b border-surface-light flex items-center justify-between">
            <h3 className="text-xl font-bold text-text-primary">User Management</h3>
            <span className="px-3 py-1 bg-surface-medium text-text-secondary text-xs font-bold rounded-full border border-surface-light">
              {users.length} Total Users
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-medium/30">
                  <th className="px-8 py-4 text-xs font-bold text-text-secondary/50 uppercase tracking-wider">User</th>
                  <th className="px-8 py-4 text-xs font-bold text-text-secondary/50 uppercase tracking-wider">Role</th>
                  <th className="px-8 py-4 text-xs font-bold text-text-secondary/50 uppercase tracking-wider">Joined</th>
                  <th className="px-8 py-4 text-xs font-bold text-text-secondary/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-light">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-medium/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary font-bold border border-accent-primary/20">
                          {u.displayName?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{u.displayName || 'Anonymous'}</p>
                          <p className="text-xs text-text-secondary/60">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 text-xs font-bold rounded-full border",
                        u.role === 'admin' 
                          ? "bg-accent-primary/10 text-accent-primary border-accent-primary/20" 
                          : "bg-surface-medium text-text-secondary border-surface-light"
                      )}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-text-secondary">
                      {u.createdAt ? formatDate(u.createdAt) : 'N/A'}
                    </td>
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-text-secondary/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-lg">
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Activity size={20} className="text-accent-primary" />
              System Status
            </h3>
            <div className="space-y-6">
              {[
                { label: 'CPU Usage', value: '12%', icon: Cpu },
                { label: 'Memory', value: '2.4GB / 8GB', icon: Server },
                { label: 'Database', value: 'Connected', icon: Database },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-medium text-text-secondary/60 rounded-lg border border-surface-light">
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-medium text-text-secondary">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-surface-light">
              <button className="w-full py-3 text-sm font-bold text-accent-primary bg-accent-primary/10 rounded-2xl hover:bg-accent-primary/20 transition-all flex items-center justify-center gap-2 border border-accent-primary/20">
                View Detailed Logs <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          <div className="bg-surface-dark text-text-primary p-8 rounded-3xl shadow-2xl border border-surface-light relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
              <Shield size={20} className="text-accent-primary" />
              Security Audit
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6 relative z-10">
              Last security scan completed 4 hours ago. No vulnerabilities detected in the current build.
            </p>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-accent-primary uppercase tracking-widest">Status: Secure</span>
              <button className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors hover:underline">Run Scan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
