import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Database, Cpu, MessageSquare, Zap, Activity, Shield } from 'lucide-react';

const HolographicInterface = () => {
  return (
    <div className="relative w-full aspect-square max-w-[600px] flex items-center justify-center perspective-1000 scale-[0.65] sm:scale-75 lg:scale-100">
      {/* Central Core Glow */}
      <div className="absolute inset-0 bg-accent/20 blur-[120px] rounded-full animate-pulse" />
      
      {/* Layer 1: The Main Terminal (Back) */}
      <motion.div
        initial={{ opacity: 0, z: -100, rotateY: 15 }}
        animate={{ opacity: 1, z: 0, rotateY: 10 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className="absolute w-[85%] h-[75%] bg-accent/[0.03] backdrop-blur-md border border-accent/20 rounded-3xl p-6 shadow-2xl overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center gap-2 mb-6 border-b border-accent/10 pb-4">
           <Terminal size={14} className="text-accent" />
           <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">SYSTEM_LOG // NEURAL_INDEX_V4</span>
        </div>
        <div className="space-y-3 font-mono text-[9px] text-text-secondary/60">
           <p className="flex gap-2"><span className="text-accent">{'>'}</span> [INFO] Initializing vector extraction...</p>
           <p className="flex gap-2"><span className="text-accent">{'>'}</span> [OK] Document "quantum_theory.pdf" synchronized.</p>
           <p className="flex gap-2"><span className="text-accent">{'>'}</span> [WARN] High semantic density detected in section 4.</p>
           <p className="flex gap-2"><span className="text-accent">{'>'}</span> [INFO] Re-indexing context chunks...</p>
           <div className="w-full h-1 bg-accent/10 rounded-full mt-4 overflow-hidden">
              <motion.div 
                animate={{ x: ['-100%', '100%'] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-accent shadow-[0_0_10px_var(--color-accent-glow)]" 
              />
           </div>
        </div>
        
        {/* Subtle Scanlines */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%]" />
      </motion.div>

      {/* Layer 2: Data Visualization (Mid) */}
      <motion.div
        initial={{ opacity: 0, x: 50, z: 50 }}
        animate={{ opacity: 1, x: 20, z: 100 }}
        transition={{ duration: 1.2, delay: 0.5 }}
        className="absolute bottom-[10%] right-0 w-[55%] h-[40%] bg-accent/[0.05] backdrop-blur-xl border border-accent/30 rounded-2xl p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
           <Activity size={14} className="text-accent" />
           <div className="flex gap-1">
              {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-accent animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
           </div>
        </div>
        <div className="h-20 flex items-end gap-1">
           {[40, 70, 45, 90, 65, 80, 50, 100, 75, 60].map((h, i) => (
             <motion.div 
               key={i}
               initial={{ height: 0 }}
               animate={{ height: `${h}%` }}
               transition={{ duration: 1, delay: 0.8 + (i * 0.05) }}
               className="flex-1 bg-gradient-to-t from-accent/20 to-accent rounded-t-sm"
             />
           ))}
        </div>
        <p className="mt-3 text-[8px] font-mono text-center text-accent/60 font-bold tracking-widest">REALTIME_SEMANTIC_MATCH_PROBABILITY</p>
      </motion.div>

      {/* Layer 3: Chat Component (Front) */}
      <motion.div
        initial={{ opacity: 0, y: 50, x: -50, z: 150 }}
        animate={{ opacity: 1, y: 0, x: -20, z: 200 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute top-[20%] left-0 w-[50%] h-[45%] bg-accent/[0.08] backdrop-blur-2xl border border-accent/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-3 mb-4">
           <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-primary-foreground shadow-[0_0_15px_var(--color-accent-glow)]">
              <MessageSquare size={16} />
           </div>
           <div>
              <p className="text-[10px] font-bold text-text-primary tracking-tight">ScholarAI Assistant</p>
              <div className="flex items-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-emerald-500" />
                 <span className="text-[7px] text-accent uppercase font-bold tracking-widest">Response Stream</span>
              </div>
           </div>
        </div>
        <div className="space-y-2">
           <div className="p-2 bg-accent/5 rounded-lg border border-accent/10">
              <div className="flex gap-1">
                 <div className="w-1 h-1 rounded-full bg-accent/40 animate-bounce" />
                 <div className="w-1 h-1 rounded-full bg-accent/40 animate-bounce [animation-delay:0.2s]" />
                 <div className="w-1 h-1 rounded-full bg-accent/40 animate-bounce [animation-delay:0.4s]" />
              </div>
           </div>
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 2 }}
             className="text-[9px] text-text-secondary leading-tight italic"
           >
             "Based on your documents, the primary mechanism of action is..."
           </motion.p>
        </div>
      </motion.div>

      {/* Floating Elements (Orbs/Particles) */}
      {[Zap, Shield, Cpu, Database].map((Icon, i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 4 + i, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: i * 0.5
          }}
          className={cn(
            "absolute p-3 bg-accent/10 backdrop-blur-md border border-accent/20 rounded-xl text-accent shadow-[0_0_20px_var(--color-accent-glow)]",
            i === 0 && "top-0 left-[20%]",
            i === 1 && "bottom-0 left-[15%]",
            i === 2 && "top-[10%] right-[10%]",
            i === 3 && "bottom-[20%] left-[-5%]"
          )}
        >
          <Icon size={18} />
        </motion.div>
      ))}
    </div>
  );
};

// Helper for classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default HolographicInterface;
