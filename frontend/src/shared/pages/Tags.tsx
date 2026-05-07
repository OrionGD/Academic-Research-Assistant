import React from 'react';
import { Tag as TagIcon, Plus, Search, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TagsPage() {
  const tags = [
    { name: 'AI Safety', count: 12, color: 'bg-indigo-500/20 text-indigo-400' },
    { name: 'Deep Learning', count: 25, color: 'bg-emerald-500/20 text-emerald-400' },
    { name: 'NLP', count: 18, color: 'bg-purple-500/20 text-purple-400' },
    { name: 'Ethics', count: 8, color: 'bg-amber-500/20 text-amber-400' },
    { name: 'Robotics', count: 15, color: 'bg-cyan-500/20 text-cyan-400' },
    { name: 'Sustainability', count: 6, color: 'bg-rose-500/20 text-rose-400' },
  ];

  return (
    <div className="min-h-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Tags</h1>
          <p className="text-text-dim mt-1">Organize your research with custom semantic labels.</p>
        </div>
        <button className="bg-accent hover:bg-accent-light text-white flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-accent/20">
          <Plus size={18} />
          <span>New Tag</span>
        </button>
      </div>

      <div className="relative group max-w-2xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" />
        <input 
          type="text" 
          placeholder="Search tags..." 
          className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tags.map((tag, i) => (
          <motion.button
            key={tag.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className={`p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3 transition-all hover:border-white/10 ${tag.color.split(' ')[0]}`}
          >
            <div className={`p-2 rounded-lg bg-white/10 ${tag.color.split(' ')[1]}`}>
               <Hash size={20} />
            </div>
            <div className="text-center">
               <p className="text-sm font-bold text-text-primary">{tag.name}</p>
               <p className="text-[11px] text-text-dim mt-0.5">{tag.count} Documents</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
