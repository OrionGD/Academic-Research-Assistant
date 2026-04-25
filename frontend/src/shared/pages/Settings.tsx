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
    toast.success(t('preferencesSaved'));
  };

  const ToggleSwitch = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={cn(
        'w-12 h-6 rounded-full relative transition-all shadow-inner focus:outline-none',
        on ? 'bg-red-600' : 'bg-slate-200'
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your application preferences.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          <button
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
              'bg-red-600 text-white shadow-lg shadow-red-200'
            )}
          >
            <Globe size={18} className="text-white" />
            Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl space-y-6"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('appPreferences')}</h3>

            {[
              {
                key: 'darkMode' as const,
                label: t('darkMode'),
                description: t('darkModeDesc'),
                icon: Moon,
              },
              {
                key: 'compactView' as const,
                label: t('compactView'),
                description: t('compactViewDesc'),
                icon: ChevronRight,
              },
              {
                key: 'autoAnalyze' as const,
                label: t('autoAnalyze'),
                description: t('autoAnalyzeDesc'),
                icon: CheckCircle2,
              },
            ].map(({ key, label, description, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-slate-600 rounded-xl text-red-500 shadow-sm border border-slate-100 dark:border-slate-500">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                  </div>
                </div>
                <ToggleSwitch on={preferences[key]} onToggle={() => toggle(key)} />
              </div>
            ))}

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white dark:bg-slate-600 rounded-xl text-red-500 shadow-sm border border-slate-100 dark:border-slate-500">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{t('language')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('languageDesc')}</p>
                </div>
              </div>
              <select
                value={preferences.language}
                onChange={(e) => {
                  setPreferences((p) => ({ ...p, language: e.target.value }));
                  setHasChanged(true);
                }}
                className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              >
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Hindi</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                className={cn(
                  'px-8 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2',
                  hasChanged
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                    : 'bg-slate-200 text-slate-500 cursor-default'
                )}
              >
                <Save size={18} />
                {t('savePreferences')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

