import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Search, Clock, Target, Zap, Layers, Sparkles, ArrowLeft, FileText, Loader2, Cpu, Brain, History, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/helpers';
import { documentService } from '../shared/services/api/documentService';
import { Document } from '../types/api';

export default function AnalyticsPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (documentId && documentId !== 'global') {
      setLoading(true);
      documentService.getDocumentById(documentId)
        .then(setDoc)
        .catch(() => setDoc(null))
        .finally(() => setLoading(false));
    } else {
      setDoc(null);
    }
  }, [documentId]);

  // Derived metrics
  const wordCount = doc?.content?.split(/\s+/).length || 0;
  const manualReadingTime = Math.ceil(wordCount / 200); // 200 words per minute
  const aiAnalysisTime = doc?.analysis?.readingTime || 1; 
  const timeSaved = Math.max(0, manualReadingTime - aiAnalysisTime);

  const stats = [
    { 
      label: 'Manual Reading Time', 
      value: `${manualReadingTime} min`, 
      icon: Clock, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
    { 
      label: 'AI Processing Latency', 
      value: `${aiAnalysisTime} min`, 
      icon: Zap, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Productivity Gains', 
      value: `${timeSaved} min saved`, 
      icon: TrendingUp, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10' 
    },
    { 
      label: 'Knowledge Density', 
      value: doc ? (doc.status === 'completed' ? 'High' : 'Low') : '84%', 
      icon: Brain, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10' 
    },
  ];

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-12">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/documents')}
              className="w-12 h-12 rounded-2xl bg-surface-light border border-border-light flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-surface-hover transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">{doc?.title || 'Document Intelligence'}</h1>
              <p className="text-text-dim mt-1 text-sm">Deep semantic analysis and vectorized insights.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {doc?.status === 'completed' ? 'Analysis Complete' : 'Processing...'}
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bb-premium-card p-6 border-border-subtle"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon size={20} className={stat.color} />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-text-primary line-clamp-1">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : !doc ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-text-dim opacity-20 mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">No Document Selected</h3>
            <p className="text-text-dim text-sm">Select a document to view its analytics.</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Analysis */}
              <div className="lg:col-span-2 space-y-8">
                <section className="space-y-4">
                  <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                    <Sparkles size={14} className="text-accent" />
                    AI Summary
                  </h2>
                  <div className="bb-premium-card p-8 border-border-subtle leading-relaxed text-text-secondary text-sm bg-surface-subtle">
                    {doc?.analysis?.summary || 'No summary available for this document.'}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                    <Target size={14} className="text-accent" />
                    Methodology
                  </h2>
                  <div className="bb-premium-card p-6 border-border-subtle text-sm text-text-dim italic">
                    {doc?.analysis?.methodology || 'Methodological analysis pending vector sync.'}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                    <BarChart3 size={14} className="text-accent" />
                    Key Results
                  </h2>
                  <div className="bb-premium-card p-6 border-border-subtle text-sm text-text-dim">
                    {doc?.analysis?.results || 'Waiting for extraction completion.'}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                    <Lightbulb size={14} className="text-accent" />
                    Key Insights
                  </h2>
                  <div className="space-y-3">
                    {(doc?.analysis?.keyInsights || ['Semantic understanding active', 'Context grounding ready', 'Citation map initialized']).map((insight, i) => (
                      <div key={i} className="p-4 bg-surface-subtle border border-border-subtle rounded-2xl flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                          <Sparkles size={14} />
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column: Metadata & Tech */}
              <div className="space-y-8">
                <section className="space-y-4">
                  <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                    <Cpu size={14} className="text-accent" />
                    Tech Stack
                  </h2>
                  <div className="bb-premium-card p-6 border-border-subtle space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Cpu size={16} className="text-indigo-400" />
                        <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Embeddings</span>
                      </div>
                      <span className="text-[11px] font-bold text-text-primary">BGE-Small-EN</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Database size={16} className="text-emerald-400" />
                        <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Vector DB</span>
                      </div>
                      <span className="text-[11px] font-bold text-text-primary">ChromaDB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Brain size={16} className="text-purple-400" />
                        <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">LLM</span>
                      </div>
                      <span className="text-[11px] font-bold text-text-primary">Gemini 1.5 Pro</span>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                    <Target size={14} className="text-accent" />
                    Reliability Score
                  </h2>
                  <div className="bb-premium-card p-8 border-border-subtle flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <div className="absolute inset-0 rounded-full border-[10px] border-border-subtle" />
                      <div 
                        className="absolute inset-0 rounded-full border-[10px] border-t-accent border-r-accent/60 transition-all duration-1000" 
                        style={{ transform: `rotate(${doc?.status === 'completed' ? '220deg' : '45deg'})` }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-3xl font-bold text-text-primary">{doc?.status === 'completed' ? 'High' : 'Syncing'}</p>
                        <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Reliability</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                    <BookOpen size={14} className="text-accent" />
                    Source Metadata
                  </h2>
                  <div className="bb-premium-card p-6 border-border-subtle space-y-4">
                    <div className="flex items-center gap-3">
                      <BookOpen size={16} className="text-text-dim" />
                      <div>
                        <p className="text-[10px] text-text-dim uppercase font-bold">Document Type</p>
                        <p className="text-[11px] font-bold text-text-primary">Research PDF</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-text-dim" />
                      <div>
                        <p className="text-[10px] text-text-dim uppercase font-bold">Word Count</p>
                        <p className="text-[11px] font-bold text-text-primary">~{wordCount.toLocaleString()} words</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Database({ size, className }: { size: number; className?: string }) {
  return <div className={className}><Layers size={size} /></div>;
}

function Lightbulb({ size, className }: { size: number; className?: string }) {
  return <div className={className}><Sparkles size={size} /></div>;
}

