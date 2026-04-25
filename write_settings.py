import pathlib

content = '''import { useState, useEffect } from "react";
import { X, Moon, Globe, Monitor } from "lucide-react";
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
}

const defaultPreferences: Preferences = {
  darkMode: true,
  language: "English (US)",
  compactView: false,
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...defaultPreferences };
}

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, darkMode, toggleDarkMode } = useAppStore();
  const { language, setLanguage, t } = useLanguage();
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);

  useEffect(() => {
    const root = document.documentElement;
    if (prefs.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (prefs.compactView) {
      root.setAttribute("data-compact", "true");
    } else {
      root.removeAttribute("data-compact");
    }
  }, [prefs.darkMode, prefs.compactView]);

  const handleSave = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setLanguage(prefs.language as any);
    toast.success("Preferences saved");
    setSettingsOpen(false);
  };

  const Toggle = ({
    label,
    value,
    onChange,
    icon: Icon,
  }: {
    label: string;
    value: boolean;
    onChange: () => void;
    icon: any;
  }) => (
    <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-border-light">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-bg-surface rounded-lg text-accent-light border border-border-light">
          <Icon size={14} />
        </div>
        <span className="text-sm text-text-primary">{label}</span>
      </div>
      <button
        onClick={onChange}
        className={cn(
          "w-10 h-5 rounded-full relative transition-all",
          value ? "bg-accent" : "bg-bg-hover"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
            value ? "right-0.5" : "left-0.5"
          )}
        />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setSettingsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm bg-bg-surface border border-border rounded-2xl shadow-2xl z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="bb-btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <Toggle
                label="Dark Mode"
                value={prefs.darkMode}
                onChange={() => {
                  setPrefs((p) => ({ ...p, darkMode: !p.darkMode }));
                  toggleDarkMode();
                }}
                icon={Moon}
              />
              <Toggle
                label="Compact View"
                value={prefs.compactView}
                onChange={() => setPrefs((p) => ({ ...p, compactView: !p.compactView }))}
                icon={Monitor}
              />

              <div className="p-3 bg-bg-elevated rounded-xl border border-border-light">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-bg-surface rounded-lg text-accent-light border border-border-light">
                    <Globe size={14} />
                  </div>
                  <span className="text-sm text-text-primary">Language</span>
                </div>
                <select
                  value={prefs.language}
                  onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                  className="w-full bg-bg-surface border border-border-light rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50"
                >
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Hindi</option>
                </select>
              </div>

            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-light transition-all"
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
'''

path = pathlib.Path("frontend/src/shared/components/SettingsModal.tsx")
path.write_text(content, encoding="utf-8")
print("SettingsModal.tsx written successfully")
