import { useState, useEffect } from "react";
import { X, Moon, Globe, Monitor, LayoutTemplate } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { useLanguage } from "../../context/LanguageContext";
import { cn } from "../../utils/helpers";
import { toast } from "sonner";

const PREFS_KEY = "aras_preferences";

interface Preferences {
  darkMode: boolean;
  language: string;
  compactView: boolean;
  autoAnalyze: boolean;
}

const defaultPreferences: Preferences = {
  darkMode: true,
  language: "English (US)",
  compactView: false,
  autoAnalyze: true,
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultPreferences };
}

function savePreferences(prefs: Preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, toggleDarkMode, darkMode, setDarkMode } = useAppStore();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any);
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button 
      onClick={onToggle} 
      className={cn(
        "w-10 h-5 rounded-full relative transition-all", 
        on ? "bg-accent" : "bg-bg-hover"
      )}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", 
        on ? "right-0.5" : "left-0.5"
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
            className="fixed inset-0 bg-black/50 z-40" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
          >
            <div className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">{t('settings')}</h2>
                <button onClick={() => setSettingsOpen(false)} className="bb-btn-icon"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-bg-hover rounded-lg">
                      <Moon size={16} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{t('darkMode')}</p>
                      <p className="text-[10px] text-text-muted">{t('darkModeDesc')}</p>
                    </div>
                  </div>
                  <Toggle on={darkMode} onToggle={() => toggleDarkMode()} />
                </div>

                {/* Language Selection */}
                <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-bg-hover rounded-lg">
                      <Globe size={16} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{t('language')}</p>
                      <p className="text-[10px] text-text-muted">{t('languageDesc')}</p>
                    </div>
                  </div>
                  <select 
                    value={language} 
                    onChange={(e) => handleLanguageChange(e.target.value)} 
                    className="bg-bg-hover border border-border-light text-text-primary rounded-lg px-3 py-1.5 text-xs outline-none"
                  >
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Hindi</option>
                  </select>
                </div>
              </div>
              
              <div className="px-5 py-4 border-t border-border bg-bg-elevated/50">
                <p className="text-center text-[10px] text-text-muted">
                  Changes are applied immediately.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
