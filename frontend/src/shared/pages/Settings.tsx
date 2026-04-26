import { useState, useEffect } from 'react';
import {
  Globe,
  Moon,
  ChevronRight,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const PREFS_KEY = 'aras_preferences';

interface Preferences {
  darkMode: boolean;
  language: string;
  compactView: boolean;
  autoAnalyze: boolean;
}

const defaultPreferences: Preferences = {
  darkMode: false,
  language: 'English (US)',
  compactView: false,
  autoAnalyze: true,
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultPreferences, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaultPreferences };
}

function applyPreferences(prefs: Preferences) {
  const root = document.documentElement;
  if (prefs.darkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  if (prefs.compactView) {
    root.setAttribute('data-compact', 'true');
  } else {
    root.removeAttribute('data-compact');
  }
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [hasChanged, setHasChanged] = useState(false);
  const { setLanguage, t } = useLanguage();

  // Apply on mount
  useEffect(() => {
    applyPreferences(preferences);
    setLanguage(preferences.language as any);
  }, []);

  const toggle = <K extends keyof Preferences>(key: K) => {
    setPreferences((p) => {
      const next = { ...p, [key]: !p[key] };
      applyPreferences(next);
      return next;
    });
    setHasChanged(true);
  };

  const handleSave = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    applyPreferences(preferences);
    setLanguage(preferences.language as any);
    setHasChanged(false);
    toast.success(t('preferencesSaved') || 'Settings saved successfully');
  };

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Settings</h1>
        <p className="text-text-dim mt-1">Manage your application preferences and local environment.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          <button
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all border border-accent/20',
              'bg-accent/10 text-accent shadow-lg shadow-accent/10'
            )}
          >
            <Globe size={18} />
            Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bb-premium-card p-8 border-white/5 space-y-8"
          >
            <h3 className="text-xl font-bold text-text-primary">System Preferences</h3>

            <div className="space-y-4">
              {[
                {
                  key: 'darkMode' as const,
                  label: t('darkMode') || 'Dark Mode',
                  description: t('darkModeDesc') || 'Switch between light and dark themes.',
                  icon: Moon,
                },
                {
                  key: 'compactView' as const,
                  label: t('compactView') || 'Compact View',
                  description: t('compactViewDesc') || 'Show more content with reduced padding.',
                  icon: ChevronRight,
                },
                {
                  key: 'autoAnalyze' as const,
                  label: t('autoAnalyze') || 'Auto-Analysis',
                  description: t('autoAnalyzeDesc') || 'Automatically generate summaries on upload.',
                  icon: CheckCircle2,
                },
              ].map(({ key, label, description, icon: Icon }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white/5 rounded-xl text-accent border border-white/10">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">{label}</p>
                      <p className="text-xs text-text-dim">{description}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={preferences[key]} onToggle={() => toggle(key)} />
                </div>
              ))}

              <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-accent border border-white/10">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{t('language') || 'Interface Language'}</p>
                    <p className="text-xs text-text-dim">{t('languageDesc') || 'Select your preferred language for the UI.'}</p>
                  </div>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => {
                    setPreferences((p) => ({ ...p, language: e.target.value }));
                    setHasChanged(true);
                  }}
                  className="bg-[#050508] border border-white/10 text-text-primary rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer"
                >
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={handleSave}
                disabled={!hasChanged}
                className={cn(
                  'px-10 py-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95',
                  hasChanged
                    ? 'bg-accent text-white hover:bg-accent-light shadow-accent/20'
                    : 'bg-white/5 text-text-dim cursor-default border border-white/5'
                )}
              >
                <Save size={18} />
                {t('savePreferences') || 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

