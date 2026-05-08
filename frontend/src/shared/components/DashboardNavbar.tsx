import { 
  Search, Plus, Bell, Sun, Command, Settings, 
  LayoutDashboard, FileText, Layers, Search as SearchIcon, 
  MessageSquare, GitCompare, BarChart3, Moon, User, Menu,
  LogOut, ChevronDown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { useLanguage } from "../../context/LanguageContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { cn } from "../../utils/helpers";
import Logo, { LOGO_URL } from "./Logo";
import { documentService } from "../services/api/documentService";
import { toast } from "sonner";

export default function DashboardNavbar() {
  const { setSettingsOpen, setUploadModalOpen, setMobileDrawerOpen, darkMode, toggleDarkMode, resetStore } = useAppStore();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // 1. Clear session on backend
      await documentService.clearSession();
      
      // 2. Reset frontend store
      resetStore();
      
      // 3. Clear session storage ID to force a new one on next session
      sessionStorage.removeItem('scholarai_session_id');
      localStorage.removeItem('scholarai_session_id'); // Cleanup legacy if exists
      
      toast.success("Mission session cleared successfully.");
      
      // 4. Navigate to landing page
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: still clear local data and navigate
      resetStore();
      sessionStorage.removeItem('scholarai_session_id');
      localStorage.removeItem('scholarai_session_id');
      navigate("/");
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: "/dashboard" },
    { icon: FileText, label: t('library'), path: "/documents" },
    { icon: Layers, label: t('contextManagement'), path: "/collections" },
    { icon: SearchIcon, label: t('semanticRetrieval'), path: "/search" },
    { icon: MessageSquare, label: t('aiChat'), path: "/chat" },
    { icon: GitCompare, label: t('compare'), path: "/compare" },
    { icon: BarChart3, label: t('analytics'), path: "/analytics" },
  ];

  return (
    <nav className="h-20 border-b border-border bg-background/80 backdrop-blur-xl z-50 flex items-center justify-between px-6 lg:px-8 shrink-0">
      {/* Left: Logo & Nav */}
      <div className="flex items-center gap-4 lg:gap-12">
        <button 
          onClick={() => setMobileDrawerOpen(true)}
          className="xl:hidden p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-white/5 transition-all"
        >
          <Menu size={24} />
        </button>

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
            placeholder={t('searchPlaceholder')} 
            className={cn(
              "w-full border rounded-xl py-2 pl-10 pr-10 text-[12px] placeholder:text-text-dim focus:outline-none focus:border-accent/40 transition-all",
              darkMode ? "bg-white/[0.03] border-white/[0.05] text-text-primary focus:bg-white/[0.05]" : "bg-black/[0.03] border-black/[0.05] text-black focus:bg-black/[0.05]"
            )}
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
             title={t('settings')}
           >
             <Settings size={18} />
           </button>
        </div>
        
        <div className="flex items-center gap-3 pl-3 border-l border-white/5 relative" ref={dropdownRef}>
             <button 
               onClick={() => setDropdownOpen(!dropdownOpen)}
               className={cn(
                 "flex items-center gap-2 p-1 pr-2 rounded-full transition-all duration-300",
                 dropdownOpen ? "bg-white/10" : "hover:bg-white/5"
               )}
             >
               <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden shadow-lg shadow-accent/10 transition-transform group-hover:scale-105">
                 <img src={LOGO_URL} alt="Profile" className="w-full h-full object-cover" />
               </div>
               <ChevronDown size={14} className={cn("text-text-dim transition-transform duration-300", dropdownOpen && "rotate-180")} />
             </button>

             <AnimatePresence>
               {dropdownOpen && (
                 <motion.div
                   initial={{ opacity: 0, y: 10, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 10, scale: 0.95 }}
                   transition={{ duration: 0.2, ease: "easeOut" }}
                   className="absolute top-full right-0 mt-2 w-56 hud-glass rounded-2xl overflow-hidden shadow-2xl z-[100] p-1.5"
                 >
                   <div className="px-4 py-3 mb-1 border-b border-white/5">
                     <p className="text-[10px] font-mono text-accent uppercase tracking-widest">Operator_Status</p>
                     <p className="text-sm font-bold text-text-primary">Scholar_Admin</p>
                   </div>

                   <button 
                     onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
                     className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all group"
                   >
                     <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                       <User size={14} />
                     </div>
                     View Profile
                   </button>

                   <button 
                     onClick={() => { setDropdownOpen(false); setSettingsOpen(true); }}
                     className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all group"
                   >
                     <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                       <Settings size={14} />
                     </div>
                     Account Settings
                   </button>

                   <div className="my-1 border-t border-white/5" />

                   <button 
                     onClick={handleLogout}
                     className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
                   >
                     <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                       <LogOut size={14} />
                     </div>
                     Logout Mission
                   </button>
                 </motion.div>
               )}
             </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
