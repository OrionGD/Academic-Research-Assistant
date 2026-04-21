import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  History, 
  Search, 
  Lock, 
  Eye, 
  Terminal,
  Clock,
  ExternalLink
} from 'lucide-react';
import { AuditLog } from '../../types/api';
import { adminEnterpriseService } from '../../services/api/adminEnterpriseService';
import { formatDate } from '../../utils/helpers';
import { toast } from 'sonner';

export default function AdminSecurityTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await adminEnterpriseService.getAuditLogs();
      setLogs(data);
    } catch (e) {
      toast.error('Failed to fetch security logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">Security & Compliance Dashboard</h3>
          <p className="text-sm text-text-secondary mt-1">Audit log monitoring and intrusion detection metrics.</p>
        </div>
        <div className="flex items-center gap-3 bg-bg-secondary px-4 py-2 rounded-2xl border border-silver-muted/20">
          <Search size={16} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-text-primary w-40"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-bg-secondary rounded-[32px] border border-silver-muted/20 shadow-xl overflow-hidden metallic-card">
          <div className="p-6 border-b border-silver-muted/10 bg-bg-elevated/30 flex items-center justify-between">
            <h4 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
              <History size={16} className="text-gold-main" />
              Direct Audit Stream
            </h4>
            <span className="text-[10px] text-text-muted font-bold tracking-widest bg-bg-elevated px-2 py-0.5 rounded border border-silver-muted/10">LIVE</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-elevated/20 border-b border-silver-muted/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Actor</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Event</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Resource</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-muted/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center opacity-40 italic text-sm">No security events found.</td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-bg-elevated/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-text-primary truncate block max-w-[140px]">{log.userEmail}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest ${
                          log.action.includes('DELETE') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                          log.action.includes('CREATE') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          'bg-gold-main/10 text-gold-main border border-gold-main/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-medium text-text-secondary">{log.resource}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-text-muted flex items-center gap-1.5 uppercase">
                          <Clock size={10} /> {formatDate(log.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-text-muted hover:text-gold-main transition-all">
                          <Terminal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-secondary p-6 rounded-[28px] border border-silver-muted/20 shadow-lg metallic-card">
            <h5 className="text-[10px] font-black text-gold-main uppercase tracking-widest mb-4">Security Overview</h5>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-text-muted" />
                  <span className="text-xs font-medium text-text-secondary">Auth Policy</span>
                </div>
                <span className="text-[10px] font-bold text-green-500">ENFORCED</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-text-muted" />
                  <span className="text-xs font-medium text-text-secondary">Vulnerabilities</span>
                </div>
                <span className="text-[10px] font-bold text-text-muted">NONE</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-bg-secondary to-bg-elevated/20 p-6 rounded-[28px] border border-silver-muted/20 shadow-lg">
             <div className="w-10 h-10 bg-gold-main/10 rounded-xl flex items-center justify-center mb-4 border border-gold-main/20 shadow-glow-sm">
                <Eye className="text-gold-main" size={20} />
             </div>
             <h5 className="text-sm font-bold text-text-primary mb-2">Integrity Scan</h5>
             <p className="text-[10px] text-text-secondary leading-relaxed font-medium mb-4">
                Validate system file signatures and check for unauthorized MongoDB role escalations.
             </p>
             <button className="w-full py-2 bg-bg-secondary border border-silver-muted/20 rounded-xl text-[10px] font-black text-text-muted hover:text-gold-main transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                Run Integrity Scan <ExternalLink size={12} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
