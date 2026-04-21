import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Zap, Check, Loader2, Send } from 'lucide-react';
import apiClient from '../services/api/client';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/upgrade/request', { message });
      toast.success('Upgrade request submitted! An admin will review it soon.');
      await refreshUser();
      onClose();
    } catch (error: any) {
      console.error('Upgrade request error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    'Unlimited AI Research Queries',
    'Advanced Paper Comparisons (up to 10)',
    'PDF & DOCX Export Options',
    'Personalized Knowledge Graphs',
    'Priority Support',
    'Unlimited Document Library'
  ];

  const isPending = user?.upgradeRequestStatus === 'pending';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-main/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-bg-secondary rounded-[32px] border border-gold-main/20 shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-text-muted hover:text-gold-main hover:bg-bg-elevated rounded-xl transition-all z-10"
            >
              <X size={20} />
            </button>

            <div className="grid md:grid-cols-2">
              {/* Left Side: Features */}
              <div className="p-8 bg-gradient-to-br from-bg-elevated to-bg-secondary border-r border-gold-main/10">
                <div className="w-12 h-12 bg-gold-main/20 rounded-2xl flex items-center justify-center mb-6">
                  <Crown className="text-gold-main" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Premium Plan</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gold-main">₹150</span>
                  <span className="text-text-secondary text-sm font-medium">/ month</span>
                </div>
                
                <ul className="mt-8 space-y-4">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 p-0.5 bg-gold-main/20 rounded-full">
                        <Check size={12} className="text-gold-main" />
                      </div>
                      <span className="text-sm text-text-secondary font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Side: Request Form */}
              <div className="p-8 flex flex-col justify-center">
                {isPending ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gold-main/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Loader2 size={32} className="text-gold-main animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Request Pending</h3>
                    <p className="text-text-secondary mt-2 text-sm">Our team is currently reviewing your upgrade request. We'll notify you via email as soon as it's approved!</p>
                    <button 
                      onClick={onClose}
                      className="mt-8 w-full py-3 bg-bg-elevated text-text-primary font-bold rounded-2xl hover:bg-bg-secondary transition-all"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-text-primary">Request Access</h3>
                      <p className="text-sm text-text-secondary mt-1">Submit a request to upgrade your account. Our admins will approve it manually.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">Message to Admin (Optional)</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="input-field w-full min-h-[120px] py-4 resize-none"
                          placeholder="Tell us why you need premium access..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-gold w-full flex items-center justify-center gap-2 h-[56px] disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            <Send size={18} />
                            Send Request
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
