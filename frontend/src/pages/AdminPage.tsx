import { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Shield, 
  Database,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShieldCheck,
  FolderKanban
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { Loader } from '../components/LoadingStates';
import { motion, AnimatePresence } from 'motion/react';

// Tab Components
import AdminAnalyticsTab from '../components/admin/AdminAnalyticsTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminProjectsTab from '../components/admin/AdminProjectsTab';
import AdminSecurityTab from '../components/admin/AdminSecurityTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';

type AdminTab = 'analytics' | 'users' | 'projects' | 'security' | 'settings';

export default function AdminPage() {
  const { data, loading: isLoading, error, actions } = useAdmin();
  const { metrics, users } = data;
  const { deleteUser, fetchUsers, fetchSystemMetrics } = actions;
  
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (isLoading && activeTab === 'analytics') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-bg-secondary rounded-3xl border border-silver-muted/20">
        <Shield size={48} className="mx-auto text-gold-main mb-4" />
        <h3 className="text-lg font-bold text-text-primary">{error}</h3>
        <p className="text-text-muted mb-6">Error loading administration data. Check your permissions.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gold-main text-bg-main rounded-xl font-bold uppercase tracking-widest text-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2.5 bg-gold-main text-bg-main rounded-2xl shadow-lg shadow-gold-main/20">
                <ShieldCheck size={24} />
             </div>
             <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase italic">Control <span className="text-gold-main">Center</span></h1>
          </div>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-[0.3em] opacity-60 ml-2">Platform Orchestration & Intelligence Hub</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-bg-secondary p-1.5 rounded-2xl border border-silver-muted/20 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-gold-main text-bg-main shadow-lg shadow-gold-main/30' 
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'analytics' && <AdminAnalyticsTab metrics={metrics} />}
            {activeTab === 'users' && (
              <AdminUsersTab 
                users={users} 
                onDelete={deleteUser} 
                onRefresh={fetchUsers} 
              />
            )}
            {activeTab === 'projects' && <AdminProjectsTab />}
            {activeTab === 'security' && <AdminSecurityTab />}
            {activeTab === 'settings' && <AdminSettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
