import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Zap, Check, Loader2, Send, QrCode, ClipboardCheck } from 'lucide-react';
import apiClient from '../../shared/services/api/client';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      toast.error('Please enter the Transaction ID / UTR number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/upgrade/request', { 
        transactionId,
        message 
      });
      toast.success('Payment details submitted! An admin will verify your transaction shortly.');
      await refreshUser();
      onClose();
    } catch (error: any) {
      console.error('Upgrade request error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    'Unlimited AI Research Queries',
    'Advanced Paper Comparisons',
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
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all z-10"
            >
              <X size={20} />
            </button>

            <div className="grid md:grid-cols-5 h-full min-h-[600px]">
              {/* Left Side: QR Code & Pricing (3 Cols) */}
              <div className="md:col-span-3 p-10 bg-slate-50 flex flex-col items-center justify-center border-r border-slate-200 text-center">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
                  <QrCode className="text-blue-600" size={32} />
                </div>
                
                <h2 className="text-3xl font-bold text-slate-900">Scan & Pay</h2>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">Scan the QR code below using any UPI app (GPay, PhonePe, Paytm) to pay for your subscription.</p>

                <div className="mt-8 relative p-4 bg-white rounded-3xl shadow-xl border-4 border-blue-600/5 transition-transform hover:scale-[1.02]">
                  <img 
                    src="/payment_qr.png" 
                    alt="Payment QR Code" 
                    className="w-64 h-64 object-contain rounded-2xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/40 backdrop-blur-[2px] rounded-2xl pointer-events-none">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">SCAN ME</span>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-5xl font-black text-slate-900">₹150</span>
                    <div className="text-left">
                      <div className="text-slate-400 text-sm font-medium line-through">₹499</div>
                      <div className="text-blue-600 text-sm font-bold">70% OFF</div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mt-1">LIFETIME UPDATES INCLUDED</p>
                </div>
              </div>

              {/* Right Side: Verification Form (2 Cols) */}
              <div className="md:col-span-2 p-10 flex flex-col bg-white">
                {isPending ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-8 relative">
                      <Loader2 size={40} className="text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Verification Pending</h3>
                    <p className="text-slate-500 mt-4 leading-relaxed">We've received your transaction details. Our team is verifying your payment with the bank. This usually takes 5-15 minutes.</p>
                    
                    <div className="mt-8 p-4 bg-blue-50 rounded-2xl w-full border border-blue-100 text-left">
                      <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                        <Zap size={14} />
                        <span>Instant Boost</span>
                      </div>
                      <p className="text-xs text-blue-600/80">Once approved, all premium features will unlock automatically on your dashboard.</p>
                    </div>

                    <button 
                      onClick={onClose}
                      className="mt-10 w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Continue using ARAS
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-10">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Payment</h3>
                      <p className="text-slate-500 mt-2 text-sm leading-relaxed">After scanning, please enter your transaction details below to activate your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Transaction ID / UTR Number</label>
                        <div className="relative">
                          <ClipboardCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="text"
                            required
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono placeholder:text-slate-300"
                            placeholder="e.g. 123456789012"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Mandatory for verification</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Note (Optional)</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[100px] resize-none text-sm"
                          placeholder="Any specific request or name used for payment..."
                        />
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : (
                            <>
                              <Send size={18} />
                              Submit for Approval
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                    
                    <div className="mt-8 flex items-center gap-2 text-slate-400 justify-center">
                      <Check size={14} className="text-green-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Secure Manual Verification</span>
                    </div>
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
