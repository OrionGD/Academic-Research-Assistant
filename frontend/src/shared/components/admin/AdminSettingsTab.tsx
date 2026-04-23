import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Zap, 
  Globe, 
  ShieldCheck, 
  Save, 
  AlertTriangle,
  Database,
  Link2
} from 'lucide-react';
import { adminEnterpriseService } from '../../services/api/adminEnterpriseService';
import { toast } from 'sonner';

export default function AdminSettingsTab() {
  const [settings, setSettings] = useState<any>({
    require2FA: false,
    restrictAIToPeerReviewed: true,
    language: 'en',
    maxUploadMB: 50,
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await adminEnterpriseService.getSettings();
      setSettings(data);
    } catch (e) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminEnterpriseService.updateSettings(settings);
      toast.success('System settings updated successfully');
    } catch (e) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">System Configuration</h3>
          <p className="text-sm text-text-secondary mt-1">Configure global AI behavior and platform constraints.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gold-main text-bg-main text-xs font-black rounded-xl hover:bg-gold-hover transition-all shadow-lg shadow-gold-main/20 uppercase tracking-widest disabled:opacity-50"
        >
          {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AI & Research Controls */}
        <div className="bg-bg-secondary p-8 rounded-[32px] border border-silver-muted/20 shadow-xl metallic-card">
          <h4 className="text-sm font-black text-gold-main uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap size={18} />
            AI Behavioral Engine
          </h4>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-xs font-bold text-text-primary uppercase tracking-widest leading-loose">Restriction Policy</p>
                <p className="text-[10px] text-text-secondary font-medium mt-1">Force AI to prioritize peer-reviewed research papers in the RAG pipeline.</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, restrictAIToPeerReviewed: !settings.restrictAIToPeerReviewed})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.restrictAIToPeerReviewed ? 'bg-gold-main' : 'bg-bg-elevated/50 border border-silver-muted/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.restrictAIToPeerReviewed ? 'right-1 bg-bg-main' : 'left-1 bg-text-muted'}`} />
              </button>
            </div>

            <div className="pt-4 border-t border-silver-muted/10">
              <p className="text-xs font-bold text-text-primary uppercase tracking-widest mb-3">Language (Localization)</p>
              <div className="grid grid-cols-2 gap-4">
                {['en', 'de', 'fr', 'es'].map(lang => (
                   <button 
                    key={lang}
                    onClick={() => setSettings({...settings, language: lang})}
                    className={`py-2 text-[10px] font-black rounded-lg border transition-all uppercase tracking-widest ${settings.language === lang ? 'bg-gold-main/10 text-gold-main border-gold-main/20' : 'bg-bg-elevated/50 text-text-muted border-silver-muted/20 hover:border-white/10'}`}
                   >
                     {lang === 'en' ? 'English' : lang === 'de' ? 'German' : lang === 'fr' ? 'French' : 'Spanish'}
                   </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-bg-secondary p-8 rounded-[32px] border border-silver-muted/20 shadow-xl metallic-card">
          <h4 className="text-sm font-black text-gold-main uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShieldCheck size={18} />
            Access Compliance
          </h4>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-xs font-bold text-text-primary uppercase tracking-widest leading-loose">Enforce 2FA</p>
                <p className="text-[10px] text-text-secondary font-medium mt-1">Make Two-Factor Authentication mandatory for all academic staff accounts.</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, require2FA: !settings.require2FA})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.require2FA ? 'bg-gold-main' : 'bg-bg-elevated/50 border border-silver-muted/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.require2FA ? 'right-1 bg-bg-main' : 'left-1 bg-text-muted'}`} />
              </button>
            </div>

            <div className="pt-4 border-t border-silver-muted/10">
              <p className="text-xs font-bold text-text-primary uppercase tracking-widest mb-3">Upload Size Limit (MB)</p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  step="10" 
                  value={settings.maxUploadMB}
                  onChange={(e) => setSettings({...settings, maxUploadMB: parseInt(e.target.value)})}
                  className="flex-1 accent-gold-main bg-bg-elevated rounded-lg h-1.5"
                />
                <span className="text-xs font-black text-gold-main w-12 text-right">{settings.maxUploadMB}MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Hub Placeholder */}
        <div className="md:col-span-2 bg-gradient-to-r from-bg-secondary to-bg-secondary p-8 rounded-[32px] border border-silver-muted/20 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Link2 size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-md">
              <h4 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-2">
                <Database size={18} className="text-gold-main" />
                Integration Connectors
              </h4>
              <p className="text-xs text-text-secondary font-medium leading-relaxed">
                Connect ARAS to institutional repositories and external reference managers.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
               {['Zotero', 'PubMed', 'IEEE', 'Scopus'].map(srv => (
                 <div key={srv} className="px-4 py-3 bg-bg-elevated/50 border border-silver-muted/10 rounded-2xl flex items-center gap-2 opacity-40 cursor-not-allowed grayscale">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{srv}</span>
                    <Settings size={12} className="text-text-muted" />
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="md:col-span-2 bg-red-500/5 border border-red-500/10 p-8 rounded-[32px] shadow-sm">
           <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                 <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                 <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">System Maintenance Mode</h4>
                 <p className="text-[10px] text-red-400/60 font-medium mt-0.5">Disables site-wide access for all non-admin users during deep indexing.</p>
              </div>
           </div>
           <button 
            onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
            className={`w-full py-3 text-[10px] font-black rounded-xl border uppercase tracking-widest transition-all ${settings.maintenanceMode ? 'bg-red-500 text-bg-main border-red-500' : 'bg-transparent text-red-500 border-red-500/20 hover:bg-red-500/5'}`}
           >
             {settings.maintenanceMode ? 'Sytem Offline - Resume Now' : 'Enter Maintenance Mode'}
           </button>
        </div>
      </div>
    </div>
  );
}
