import { useEffect } from 'react';
import { 
  X, LayoutDashboard, FileText, Layers, Search as SearchIcon, 
  MessageSquare, GitCompare, BarChart3, Settings, Shield, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: "/dashboard" },
    { icon: FileText, label: t('library'), path: "/documents" },
    { icon: Layers, label: t('contextManagement'), path: "/collections" },
    { icon: SearchIcon, label: t('semanticRetrieval'), path: "/search" },
    { icon: MessageSquare, label: t('aiChat'), path: "/chat" },
    { icon: GitCompare, label: t('compare'), path: "/compare" },
    { icon: BarChart3, label: t('analytics'), path: "/analytics" },
  ];

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] xl:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-accent/20 z-[201] xl:hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-accent/10 bg-accent/5">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-accent shadow-[0_0_15px_var(--color-accent-glow)] flex items-center justify-center">
                    <Zap size={16} className="text-primary-foreground" />
                 </div>
                 <span className="text-sm font-bold text-text-primary uppercase tracking-widest">ScholarAI</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-primary-foreground transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div>
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] mb-6 px-2">Navigation</h3>
                <div className="space-y-2">
                   {navItems.map((item) => {
                     const active = location.pathname === item.path;
                     return (
                       <Link 
                         key={item.path} 
                         to={item.path} 
                         onClick={onClose} 
                         className={cn(
                           "flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest",
                           active 
                             ? "bg-accent/10 text-accent border border-accent/30 shadow-[0_0_15px_rgba(0,242,255,0.1)]" 
                             : "text-text-secondary hover:bg-accent/5 hover:text-text-primary border border-transparent"
                         )}
                       >
                         <item.icon size={18} className={active ? "text-accent" : "text-text-muted"} />
                         {item.label}
                       </Link>
                     );
                   })}
                </div>
              </div>

              <div className="pt-8 border-t border-accent/10">
                 <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] mb-6 px-2">Security</h3>
                 <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
                    <Shield size={18} className="text-emerald-500" />
                    <div>
                       <p className="text-[10px] font-bold text-emerald-500 uppercase">Neural Vault Active</p>
                       <p className="text-[8px] text-text-muted uppercase mt-1">End-to-End Encrypted</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-accent/10 bg-accent/[0.02]">
               <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-widest">v4.2.0_stable</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

