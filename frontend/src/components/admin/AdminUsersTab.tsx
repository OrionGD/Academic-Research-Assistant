import React, { useState } from 'react';
import { 
  Trash2, 
  Shield, 
  User as UserIcon, 
  CheckCircle2, 
  ChevronDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { User } from '../../types/api';
import { formatDate } from '../../utils/helpers';
import { adminEnterpriseService } from '../../services/api/adminEnterpriseService';
import { toast } from 'sonner';

interface AdminUsersTabProps {
  users: User[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function AdminUsersTab({ users, onDelete, onRefresh }: AdminUsersTabProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await adminEnterpriseService.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      onRefresh();
    } catch (e) {
      toast.error('Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">User Management</h3>
          <p className="text-sm text-text-secondary mt-1">Manage researcher roles and access control.</p>
        </div>
        <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-xl border border-silver-muted/20">
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-gold-main text-bg-main shadow-lg shadow-gold-main/20' : 'text-text-muted hover:text-text-primary'}`}
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold-main text-bg-main shadow-lg shadow-gold-main/20' : 'text-text-muted hover:text-text-primary'}`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-[32px] border border-silver-muted/20 shadow-xl overflow-hidden metallic-card">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-elevated/50 border-b border-silver-muted/10">
                  <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Profile</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Current Role</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Plan Tier</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Joined</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-muted/10">
                {users.map((u, idx) => (
                  <tr key={u.id || (u as any)._id || idx} className="hover:bg-bg-elevated/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold-main/10 rounded-xl flex items-center justify-center text-gold-main font-bold border border-gold-main/20">
                          {u.displayName?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary group-hover:text-gold-main transition-colors leading-tight">{u.displayName || 'Anonymous'}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="relative inline-block text-left">
                        <select
                          disabled={updatingId === u.id}
                          className="appearance-none bg-bg-elevated/50 border border-silver-muted/20 text-[10px] font-bold text-text-primary px-3 py-1.5 pr-8 rounded-full uppercase tracking-widest cursor-pointer focus:outline-none focus:border-gold-main/50"
                          value={u.role || 'user'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="researcher">Researcher</option>
                          <option value="reviewer">Reviewer</option>
                          <option value="admin">Administrator</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={12} />
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-widest ${u.planTier === 'PRO' ? 'bg-gold-main/10 text-gold-main border-gold-main/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]' : 'bg-bg-elevated text-text-muted border-silver-muted/20'}`}>
                        {u.planTier}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-text-muted">
                      {u.createdAt ? formatDate(u.createdAt) : 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onDelete(u.id)}
                        className="p-2 text-text-muted/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-8">
            {users.map((u, idx) => (
              <div key={u.id || (u as any)._id || idx} className="bg-bg-elevated/30 border border-silver-muted/10 rounded-2xl p-6 hover:border-gold-main/20 transition-all group relative">
                <button 
                  onClick={() => onDelete(u.id)}
                  className="absolute top-4 right-4 p-2 text-text-muted/0 group-hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gold-main/10 rounded-2xl flex items-center justify-center text-gold-main text-xl font-black border-2 border-gold-main/20">
                    {u.displayName?.[0] || u.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary group-hover:text-gold-main transition-colors">{u.displayName || 'Anonymous'}</h4>
                    <p className="text-xs text-text-secondary font-medium truncate max-w-[150px]">{u.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Role</span>
                    <select
                      className="bg-bg-secondary border border-silver-muted/20 text-[10px] font-bold text-text-primary px-3 py-1 rounded-full uppercase tracking-widest focus:outline-none"
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="researcher">Researcher</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Plan</span>
                    <span className="text-[10px] font-black text-gold-main bg-gold-main/10 px-2 py-0.5 rounded border border-gold-main/20">{u.planTier}</span>
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
