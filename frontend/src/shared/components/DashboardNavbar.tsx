import { Menu, Sparkles, Bell, Search } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useLanguage } from "../../context/LanguageContext";
import { useLocation } from "react-router-dom";

export default function DashboardNavbar() {
  const { setMobileDrawerOpen, setSettingsOpen } = useAppStore();
  const { t } = useLanguage();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return t("dashboard");
    if (path.includes("/library")) return t("library");
    if (path.includes("/chat")) return t("aiChat");
    if (path.includes("/compare")) return t("compareDocuments");
    if (path.includes("/search")) return t("semanticSearch");
    return "ScholarAI Platform";
  };

  return (
    <nav className="sticky top-0 left-0 right-0 h-16 border-b border-white/5 bg-bg-surface/60 backdrop-blur-md z-30 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileDrawerOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-bg-hover text-text-secondary"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-text-primary tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[10px] text-text-muted hidden sm:block">
            ScholarAI Research Environment
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 gap-2 w-48 lg:w-64 transition-all focus-within:border-accent/40 focus-within:bg-white/10">
          <Search size={14} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-dim w-full"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
            <Bell size={18} />
          </button>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-light hover:bg-accent/30 transition-all"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
