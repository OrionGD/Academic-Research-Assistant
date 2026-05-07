import React from 'react';
import { Quote, Search, Download, Share2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CitationsPage() {
  return (
    <div className="min-h-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Citations</h1>
          <p className="text-text-dim mt-1">Export and manage bibliographic references for your research.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-white/[0.05] hover:bg-white/[0.08] text-text-primary flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all border border-white/10">
             <Download size={18} />
             <span>Export All</span>
           </button>
        </div>
      </div>

      <div className="relative group max-w-2xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" />
        <input 
          type="text" 
          placeholder="Search by citation key or title..." 
          className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
        />
      </div>

      {/* Citations List (Placeholder) */}
      <div className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bb-premium-card p-5 flex items-start gap-4 hover:border-accent/20 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted shrink-0">
            <Quote size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-text-primary font-medium leading-relaxed">
              Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I. (2017). 
              <span className="italic"> Attention is all you need</span>. Advances in neural information processing systems, 30.
            </p>
            <div className="flex items-center gap-4 mt-3">
               <button className="text-[11px] font-bold text-accent uppercase tracking-wider hover:underline">Copy BibTeX</button>
               <button className="text-[11px] font-bold text-text-dim uppercase tracking-wider hover:text-text-primary transition-colors">View Source</button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="py-20 text-center">
         <p className="text-text-dim text-sm italic">"Proper citation is the cornerstone of academic integrity."</p>
      </div>
    </div>
  );
}
