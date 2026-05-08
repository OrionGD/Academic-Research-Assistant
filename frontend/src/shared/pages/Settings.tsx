import {
  Globe,
  Moon,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';
import { useAppStore, AppLanguage } from '../../store/useAppStore';

export default function SettingsPage() {
  const { 
    darkMode, toggleDarkMode,
    language, setLanguage, 
    compactMode, toggleCompactMode,
    autoNeuralSync, toggleAutoNeuralSync 
  } = useAppStore();
  
  const { t } = useLanguage();

  const ToggleSwitch = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={cn(
        'w-12 h-6 rounded-full relative transition-all shadow-inner focus:outline-none',
        on ? 'bg-accent' : 'bg-white/10'
      )}
    >
      <div
        className={cn(
          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
          on ? 'right-1' : 'left-1'
        )}
      />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('settings')}</h1>
        <p className="text-text-dim mt-1">{t('appPreferences')}</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-accent/10 text-accent border border-accent/20">
            <Globe size={18} />
            {t('appPreferences')}
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bb-premium-card p-8 border-white/5 space-y-8"
          >
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-accent border border-white/10">
                    <Moon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{t('darkMode')}</p>
                    <p className="text-xs text-text-dim">{t('darkModeDesc')}</p>
                  </div>
                </div>
                <ToggleSwitch on={darkMode} onToggle={toggleDarkMode} />
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-accent border border-white/10">
                    <ChevronRight size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{t('compactView')}</p>
                    <p className="text-xs text-text-dim">{t('compactViewDesc')}</p>
                  </div>
                </div>
                <ToggleSwitch on={compactMode} onToggle={toggleCompactMode} />
              </div>

              {/* Auto Sync */}
              <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-accent border border-white/10">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{t('autoAnalyze')}</p>
                    <p className="text-xs text-text-dim">{t('autoAnalyzeDesc')}</p>
                  </div>
                </div>
                <ToggleSwitch on={autoNeuralSync} onToggle={toggleAutoNeuralSync} />
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-accent border border-white/10">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{t('language')}</p>
                    <p className="text-xs text-text-dim">{t('languageDesc')}</p>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  className="bg-card border border-border text-text-primary rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer"
                >
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
