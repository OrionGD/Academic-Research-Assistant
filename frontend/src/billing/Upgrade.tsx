import React from 'react';
import { CreditCard, Rocket, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Upgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Level Up Your Research</h1>
        <p className="text-slate-500 mt-3 text-lg">Choose the plan that fits your workflow. Instant activation.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Current Plan Card */}
        <div className="p-8 bg-slate-50 rounded-3xl border-2 border-slate-200">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Current Plan</div>
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-2xl font-bold text-slate-900">{user?.planTier || 'BASIC'}</h3>
             <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">Active</span>
           </div>
           <ul className="space-y-3 mb-8">
             <li className="flex items-center gap-3 text-slate-600 text-sm">
               <CheckCircle2 size={16} className="text-emerald-500" />
               Current feature set
             </li>
             <li className="flex items-center gap-3 text-slate-600 text-sm">
               <CheckCircle2 size={16} className="text-emerald-500" />
               Standard support
             </li>
           </ul>
        </div>

        {/* Upgrade Target Card */}
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 bg-white rounded-3xl border-2 border-red-500 shadow-2xl shadow-red-500/10 relative overflow-hidden"
        >
           <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-full">Recommended</div>
           <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">Next Level</div>
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-2xl font-bold text-slate-900">STANDARD</h3>
             <div className="text-right">
               <div className="text-2xl font-black text-slate-900">₹1,499</div>
               <div className="text-xs font-bold text-slate-400 uppercase">Per Month</div>
             </div>
           </div>
           <ul className="space-y-4 mb-8">
             {[
               '5,000 AI Credits / Mo',
               'Paper Comparison Suite',
               'Batch Upload Support',
               'Priority AI Processing',
               'Advanced Semantic Search'
             ].map((feat) => (
               <li key={feat} className="flex items-center gap-3 text-slate-700 text-sm font-semibold">
                 <Zap size={16} className="text-red-500 fill-red-500" />
                 {feat}
               </li>
             ))}
           </ul>
           <button className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
             Upgrade Now <Rocket size={18} />
           </button>
        </motion.div>
      </div>

      <div className="mt-12 pt-12 border-t border-slate-100 flex flex-col gap-4">
        <div className="flex items-center gap-4 text-slate-400">
           <ShieldCheck size={24} />
           <span className="text-sm font-medium">Simulation Mode - No real charges will be made</span>
        </div>
        <div className="text-sm text-slate-500">
           Billing is currently a placeholder simulation; no real payment gateway is integrated.
        </div>
      </div>
    </div>
  );
}
