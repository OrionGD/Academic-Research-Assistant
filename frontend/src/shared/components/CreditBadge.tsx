import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';

interface CreditBadgeProps {
  className?: string;
}

export function CreditBadge({ className }: CreditBadgeProps) {
  const { user, guestCredits, isGuest } = useAuth();
  
  const credits = isGuest ? guestCredits : (user?.remainingCredits ?? 0);
  const plan = isGuest ? 'GUEST' : (user?.planTier ?? 'FREE');
  
  // Unlimited for PRO users
  const isUnlimited = plan === 'PRO';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 shadow-sm",
        className
      )}
    >
      <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white shrink-0">
        <Zap size={12} fill="currentColor" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-amber-600 leading-none uppercase tracking-tight">
          {plan} Credits
        </span>
        <span className="text-xs font-black text-amber-900 leading-tight">
          {isUnlimited ? '∞' : credits}
        </span>
      </div>
    </motion.div>
  );
}
