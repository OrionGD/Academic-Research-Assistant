import { 
  Search, Plus, Bell, Sun, Command, Settings, 
  LayoutDashboard, FileText, Layers, Search as SearchIcon, 
  MessageSquare, GitCompare, BarChart3, Moon, User
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useLanguage } from "../../context/LanguageContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { cn } from "../../utils/helpers";
import Logo from "./Logo";

export default function DashboardNavbar() {
  const { setSettingsOpen, setUploadModalOpen, setMobileDrawerOpen, darkMode, toggleDarkMode } = useAppStore();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: Layers, label: "Collections", path: "/collections" },
    { icon: SearchIcon, label: "Search", path: "/search" },
    { icon: MessageSquare, label: "AI Chat", path: "/chat" },
    { icon: GitCompare, label: "Compare", path: "/compare" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ];

  return (
    <nav className="h-20 border-b border-white/[0.05] bg-[#020203]/80 backdrop-blur-xl z-50 flex items-center justify-between px-8 shrink-0">
      {/* Left: Logo & Nav */}
      <div className="flex items-center gap-12">
        <Logo size="sm" showText={true} onClick={() => navigate('/dashboard')} className="cursor-pointer" />
        
        <div className="hidden xl:flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap",
                location.pathname === item.path 
                  ? "bg-accent/10 text-accent border border-accent/20" 
                  : "text-text-dim hover:text-text-primary hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Global Search CMD+K */}
        <div className="relative group hidden lg:block w-64">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search knowledge..." 
            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-10 pr-10 text-[12px] text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1 py-0.5 rounded border border-white/10 bg-white/5">
             <Command size={8} className="text-text-dim" />
             <span className="text-[8px] font-bold text-text-dim uppercase">K</span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-x border-white/5 px-4 h-8">
           <button 
             onClick={toggleDarkMode}
             className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-white/5 transition-all"
           >
             {darkMode ? <Sun size={18} /> : <Moon size={18} />}
           </button>
           <button 
             onClick={() => setSettingsOpen(true)}
             className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-white/5 transition-all"
             title="Settings / Preferences"
           >
             <Settings size={18} />
           </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-accent hover:bg-accent-light text-white flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all shadow-lg shadow-accent/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Upload</span>
          </button>
          
          <div className="flex items-center gap-3 pl-3 border-l border-white/5">
             <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-accent/20 cursor-pointer hover:scale-105 transition-transform">
               O
             </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
