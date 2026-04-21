import React from 'react';
import { FileText, Search, MessageSquare } from 'lucide-react';

const HeroMockup: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-br from-surface-dark to-surface-medium rounded-3xl p-8 lg:p-12 shadow-2xl border border-surface-light max-w-md mx-auto w-full aspect-[4/3]">
      <div className="absolute top-4 right-4 w-20 h-20 bg-accent-primary/10 rounded-2xl border-2 border-accent-primary/20 flex items-center justify-center">
        <FileText className="text-accent-primary w-8 h-8" />
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-accent-primary/5 rounded-2xl border border-accent-primary/10">
          <FileText className="text-accent-primary" size={20} />
          <div className="font-bold text-text-primary text-lg">research_paper.pdf</div>
        </div>
        <div className="grid grid-cols-2 gap-4 h-32 bg-surface-light/5 rounded-2xl p-4 items-center">
          <div className="space-y-2">
            <div className="text-xs text-text-secondary/50 font-bold">Summary</div>
            <div className="h-3 bg-accent-primary rounded-full w-4/5 shadow-sm"></div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-text-secondary/50 font-bold">Methodology</div>
            <div className="h-3 bg-surface-medium rounded-full w-3/5 shadow-sm"></div>
          </div>
        </div>
        <div className="flex gap-3 p-4 bg-surface-light/10 rounded-2xl border border-surface-light/30 items-center">
          <Search className="text-text-secondary/50 w-5 h-5 flex-shrink-0" />
          <input 
            className="bg-transparent text-text-primary outline-none flex-1 text-sm placeholder-text-secondary/50" 
            placeholder="Ask about this paper..." 
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-secondary/60">
          <span>95% processed</span>
          <MessageSquare className="w-4 h-4" />
        </div>
      </div>
      {/* Decorative glows */}
      <div className="absolute -inset-2 bg-gradient-to-r from-accent-primary/20 to-transparent rounded-3xl blur-xl opacity-50 animate-pulse"></div>
    </div>
  );
};

export default HeroMockup;

