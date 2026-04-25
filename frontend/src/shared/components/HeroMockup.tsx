import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, CheckCircle2, GitMerge } from 'lucide-react';

const HeroMockup: React.FC = () => {
  return (
    <div className="relative bg-bg-surface border border-border-main rounded-2xl shadow-2xl max-w-2xl mx-auto w-full overflow-hidden flex flex-col font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-main bg-[#050505]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <div className="text-text-muted text-xs flex items-center gap-2">
          <Terminal size={14} />
          agent_consensus_protocol.sh
        </div>
      </div>

      <div className="flex flex-col sm:flex-row h-full">
        {/* Sidebar: Agents */}
        <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-border-main bg-[#0A0A0A] p-4 flex flex-col gap-4">
          <div className="text-xs text-text-muted uppercase tracking-wider font-sans font-bold mb-2">Active Agents</div>
          {[
            { name: 'Claude 3.5 Sonnet', status: 'Running', color: 'bg-green-500' },
            { name: 'GPT-4o', status: 'Analyzing', color: 'bg-yellow-500' },
            { name: 'Internal LLM', status: 'Idle', color: 'bg-text-muted' },
          ].map((agent, i) => (
            <motion.div 
              key={agent.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex items-center justify-between p-3 rounded-xl border border-border-main bg-bg-primary"
            >
              <div className="flex items-center gap-3">
                <Cpu size={16} className="text-text-secondary" />
                <span className="text-text-primary text-xs font-semibold">{agent.name}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${agent.color} ${agent.status === 'Running' ? 'animate-pulse' : ''}`}></div>
            </motion.div>
          ))}
        </div>

        {/* Main Content: Consensus & Code Comparison */}
        <div className="w-full sm:w-2/3 p-5 bg-[#000000] flex flex-col gap-5 relative">
          <div className="flex items-center gap-2 text-xs font-bold text-accent-light uppercase tracking-widest font-sans">
            <GitMerge size={16} />
            Consensus Engine
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Model A Result */}
            <div className="space-y-2">
              <div className="text-xs text-text-muted">Model A (GPT-4)</div>
              <div className="bg-[#0D1117] border border-border-main rounded-xl p-3 text-[10px] text-text-secondary overflow-x-auto">
                <code>
                  <span className="text-purple-400">def</span> <span className="text-blue-400">optimize</span>(data):<br/>
                  &nbsp;&nbsp;<span className="text-purple-400">return</span> [x <span className="text-purple-400">for</span> x <span className="text-purple-400">in</span> data <span className="text-purple-400">if</span> x]
                </code>
              </div>
            </div>

            {/* Model B Result (Winner) */}
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-primary font-bold">Model B (Claude)</span>
              </div>
              <div className="bg-[#05100A] border border-[#10B981]/30 rounded-xl p-3 text-[10px] text-text-primary overflow-x-auto shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <code>
                  <span className="text-purple-400">def</span> <span className="text-blue-400">optimize</span>(data: list) -&gt; list:<br/>
                  &nbsp;&nbsp;<span className="text-purple-400">return</span> list(filter(<span className="text-blue-400">None</span>, data))
                </code>
              </div>
              {/* Winner Badge */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="absolute -top-3 -right-2 bg-[#10B981] text-[#000000] text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-[#10B981]/20 font-sans"
              >
                <CheckCircle2 size={10} />
                WINNER
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mt-2 text-xs text-text-secondary border-t border-border-main pt-4"
          >
            <span className="text-accent-light">&gt;</span> Consensus reached in 420ms. Code optimized for memory efficiency.
          </motion.div>

          {/* Decorative glows */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#10B981]/5 to-transparent rounded-3xl blur-2xl opacity-50 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default HeroMockup;

