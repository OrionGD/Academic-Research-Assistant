import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-bg-surface border-r border-border z-50 md:hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-sm font-semibold text-text-primary">Menu</span>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
              >
                <X size={18} className="text-text-muted" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs text-text-dim uppercase font-bold tracking-widest mb-4">Navigation</p>
              <div className="space-y-2">
                 {/* Simplified mobile links */}
                 {['Dashboard', 'Documents', 'Collections', 'Search', 'AI Chat', 'Compare', 'Analytics'].map(item => (
                   <button key={item} onClick={onClose} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-text-dim hover:text-text-primary hover:bg-white/5 transition-all">
                     {item}
                   </button>
                 ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

