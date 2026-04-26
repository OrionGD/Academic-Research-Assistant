import { X, Moon, Globe, Monitor, Zap, LayoutTemplate, ShieldCheck, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { useLanguage } from "../../context/LanguageContext";
import { cn } from "../../utils/helpers";

export default function SettingsModal() {
  const { 
    settingsOpen, 
    setSettingsOpen, 
    toggleDarkMode, 
    darkMode,
    compactMode,
    toggleCompactMode,
    autoNeuralSync,
    toggleAutoNeuralSync
  } = useAppStore();
  
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any);
  };

  const Toggle = ({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) => (
    <button 
      onClick={onToggle} 
      disabled={disabled}
      className={cn(
        "w-10 h-5 rounded-full relative transition-all duration-300", 
        on ? "bg-accent shadow-[0_0_10px_rgba(129,140,248,0.5)]" : "bg-surface-light",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 bg-accent-foreground rounded-full shadow-lg transition-all duration-300 ease-spring", 
        on ? "left-[22px]" : "left-0.5"
      )} />
    </button>
  );

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setSettingsOpen(false)} 
            className="fixed inset-0 bg-overlay backdrop-blur-sm z-[100]" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
            className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4"
          >
            <div className="bg-card border border-border-light rounded-[32px] shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-border-subtle bg-surface-subtle">
                <div>
                   <h2 className="text-xl font-bold text-text-primary tracking-tight">System Preferences</h2>
                   <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold mt-0.5">Customize your research environment</p>
                </div>
                <button 
                  onClick={() => setSettingsOpen(false)} 
                  className="w-10 h-10 rounded-full bg-surface-light border border-border-light flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-surface-hover transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Visual Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest px-1">Visual Interface</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 bg-surface-subtle border border-border-subtle rounded-2xl hover:bg-surface-light transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <Moon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">Luminescent Dark Mode</p>
                          <p className="text-[10px] text-text-dim font-medium leading-relaxed">Optimize for low-light research sessions</p>
                        </div>
                      </div>
                      <Toggle on={darkMode} onToggle={toggleDarkMode} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-subtle border border-border-subtle rounded-2xl hover:bg-surface-light transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                          <LayoutTemplate size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">Compact Dashboard</p>
                          <p className="text-[10px] text-text-dim font-medium leading-relaxed">Maximize information density for expert users</p>
                        </div>
                      </div>
                      <Toggle on={compactMode} onToggle={toggleCompactMode} />
                    </div>
                  </div>
                </div>

                {/* AI & Logic Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest px-1">AI & Preprocessing</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 bg-surface-subtle border border-border-subtle rounded-2xl hover:bg-surface-light transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">Auto-Neural Sync</p>
                          <p className="text-[10px] text-text-dim font-medium leading-relaxed">Automatically vectorize sources upon ingestion</p>
                        </div>
                      </div>
                      <Toggle on={autoNeuralSync} onToggle={toggleAutoNeuralSync} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-subtle border border-border-subtle rounded-2xl hover:bg-surface-light transition-all opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">Privacy Lockdown</p>
                          <p className="text-[10px] text-text-dim font-medium leading-relaxed">Encrypt all local knowledge chunks</p>
                        </div>
                      </div>
                      <Toggle on={false} onToggle={() => {}} disabled />
                    </div>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-1">Localization</h3>
                  <div className="flex items-center justify-between p-4 bg-surface-subtle border border-border-subtle rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">System Language</p>
                        <p className="text-[10px] text-text-dim font-medium leading-relaxed">Current Region: Global (EN)</p>
                      </div>
                    </div>
                    <select 
                      value={language} 
                      onChange={(e) => handleLanguageChange(e.target.value)} 
                      className="bg-surface-light border border-border-light text-text-primary rounded-xl px-4 py-2 text-[11px] font-bold outline-none focus:border-accent/40 transition-all uppercase tracking-widest"
                    >
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-8 py-6 border-t border-border-subtle bg-surface-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Cpu size={14} className="text-text-dim" />
                   <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Version 2.4.0-Neural</span>
                </div>
                <p className="text-[10px] text-text-dim italic">
                  Settings are persisted locally.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

