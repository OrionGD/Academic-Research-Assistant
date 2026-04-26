import React, { useState } from 'react';
import { Layers, Plus, Search, MoreHorizontal, FileText, CheckCircle2, ArrowRight, Shield, Database, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CollectionsPage() {
  const [activeCollection, setActiveCollection] = useState<string | null>('1');
  const navigate = useNavigate();
  
  const collections = [
    { id: '1', name: 'LLM Architectures', count: 12, description: 'Papers focusing on Transformer variants and scaling laws.' },
    { id: '2', name: 'Neural Retrieval', count: 8, description: 'Dense vs Sparse retrieval methods and hybrid systems.' },
    { id: '3', name: 'Biomedical AI', count: 5, description: 'Applications of large language models in healthcare.' },
  ];

  const handleActivate = (id: string, name: string) => {
    setActiveCollection(id);
    toast.success(`Context activated: ${name}. All RAG operations will now prioritize this collection.`);
  };

  return (
    <div className="h-full bg-[#020203] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Context Control</h1>
            <p className="text-text-dim mt-1">Group papers into thematic collections to define AI search and RAG context.</p>
          </div>
          <button className="bg-accent hover:bg-accent-light text-white flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-accent/20 active:scale-95">
            <Plus size={20} />
            <span>Create Collection</span>
          </button>
        </div>

        {/* Intelligence Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                 <Shield size={20} />
              </div>
              <div>
                 <p className="text-xs font-bold text-text-primary uppercase tracking-widest">Precision RAG</p>
                 <p className="text-[10px] text-text-dim mt-0.5">Filtering retrieval by collection</p>
              </div>
           </div>
           <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                 <Database size={20} />
              </div>
              <div>
                 <p className="text-xs font-bold text-text-primary uppercase tracking-widest">Knowledge Density</p>
                 <p className="text-[10px] text-text-dim mt-0.5">High semantic overlap detected</p>
              </div>
           </div>
           <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                 <Cpu size={20} />
              </div>
              <div>
                 <p className="text-xs font-bold text-text-primary uppercase tracking-widest">Local Latency</p>
                 <p className="text-[10px] text-text-dim mt-0.5">Sub-100ms retrieval speed</p>
              </div>
           </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {collections.map((col) => (
            <motion.div 
              key={col.id}
              whileHover={{ y: -4 }}
              className={cn(
                "bb-premium-card p-6 space-y-6 group cursor-pointer relative overflow-hidden",
                activeCollection === col.id ? "border-accent/40 bg-accent/[0.02]" : "border-white/5"
              )}
              onClick={() => handleActivate(col.id, col.name)}
            >
              {activeCollection === col.id && (
                <div className="absolute top-0 right-0 p-3">
                  <div className="bg-accent text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-lg shadow-accent/20">
                    Active Context
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                  activeCollection === col.id ? "bg-accent/20 border-accent/40 text-accent" : "bg-white/5 border-white/10 text-text-dim"
                )}>
                  <Layers size={24} />
                </div>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-text-dim hover:text-text-primary hover:bg-white/5 rounded-lg transition-all"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{col.name}</h3>
                <p className="text-xs text-text-dim leading-relaxed line-clamp-2">{col.description}</p>
              </div>

              <div className="pt-4 border-t border-white/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-dim">
                  <FileText size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{col.count} Sources</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/documents?collection=${encodeURIComponent(col.name)}`);
                  }}
                  className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all"
                >
                  <span>Enter Collection</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Create Card */}
          <button className="bb-premium-card border-dashed border-white/10 hover:border-accent/40 flex flex-col items-center justify-center p-8 gap-4 transition-all group min-h-[240px]">
             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-text-dim group-hover:text-accent group-hover:bg-accent/10 transition-all">
                <Plus size={24} />
             </div>
             <div className="text-center">
                <p className="text-sm font-bold text-text-primary">New Project Collection</p>
                <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Define research scope</p>
             </div>
          </button>
        </div>
      </div>
    </div>
  );
}
