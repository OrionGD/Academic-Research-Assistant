import React, { useEffect } from 'react';
import { 
  FileText, 
  MessageSquare, 
  Search, 
  Sparkles, 
  GitCompare, 
  Zap, 
  Plus,
  ArrowRight, 
  BarChart3,
  Loader2,
  ShieldCheck,
  Database,
  Cpu,
  Quote,
  Layers,
  Terminal
} from 'lucide-react';
import { useDocuments } from '../shared/hooks/useDocuments';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MetricCard, ActionCard, FeatureCard, InsightItem } from '../shared/components/ui/DashboardComponents';
import { useAppStore } from '../store/useAppStore';
import { useLanguage } from '../context/LanguageContext';
import { FuturisticBackground } from '../shared/components/FuturisticBackground';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: documents, total, completedCount, loading, actions } = useDocuments();
  const { setUploadModalOpen, darkMode } = useAppStore();

  useEffect(() => {
    actions.fetchDocuments(1, 10);
  }, []);

  const recentDocs = documents.slice(0, 5);

  return (
    <div className="min-h-full bg-background pb-10 relative overflow-hidden">
      <div className="opacity-10 pointer-events-none fixed inset-0 z-0">
        <FuturisticBackground />
      </div>
      
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10 space-y-8 lg:space-y-12 relative z-10">
        
        {/* Welcome Section */}
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-[0_0_15px_var(--color-accent-glow)]">
                <Terminal size={18} />
             </div>
             <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.4em]">SYSTEM_READY_V4.2</span>
           </div>
           <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tighter">{t('researchControlCenter')}</h1>
           <p className="text-sm md:text-base text-text-secondary max-w-2xl leading-relaxed font-medium">
             {t('researchWelcome')}
           </p>
        </div>

        {/* Row 1: Metric Grid - System State */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            label={t('knowledgeSources')} 
            value={total} 
            subtext={t('papersInLibrary')}
            icon={FileText} 
            color="text-accent"
            delay={0.1}
          />
          <MetricCard 
            label={t('activeCollections')} 
            value="4" 
            subtext={t('contextGroups')}
            icon={Layers} 
            color="text-blue-400"
            delay={0.2}
          />
          <MetricCard 
            label={t('neuralIndices')} 
            value={completedCount} 
            subtext={t('vectorizedChunks')}
            icon={Database} 
            color="text-emerald-400"
            delay={0.3}
          />
          <MetricCard 
            label={t('systemHealth')} 
            value="Optimal" 
            subtext={t('ragEngineActive')}
            icon={ShieldCheck} 
            color="text-cyan-400"
            delay={0.4}
          />
        </section>

        {/* Row 2: Workflow Entry Points */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Col 1: Primary Workflows (8/12) */}
          <section className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-accent/20" />
              <h2 className="text-[10px] font-bold text-text-primary flex items-center gap-2 uppercase tracking-[0.4em] opacity-40">
                {t('launchWorkflow')}
              </h2>
              <div className="h-px flex-1 bg-accent/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionCard 
                title={t('neuralIngestion')} 
                description={t('uploadVectorize')} 
                icon={Plus} 
                onClick={() => setUploadModalOpen(true)}
                gradient="bg-accent/20 text-accent border border-accent/30"
                delay={0.15}
              />
              <ActionCard 
                title={t('knowledgeLibrary')} 
                description={t('manageAnalyzeSources')} 
                icon={FileText} 
                onClick={() => navigate('/documents')}
                gradient="bg-blue-500/20 text-blue-400 border border-blue-500/30"
                delay={0.2}
              />
              <ActionCard 
                title={t('contextManagement')} 
                description={t('organizePapers')} 
                icon={Layers} 
                onClick={() => navigate('/collections')}
                gradient="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                delay={0.3}
              />
              <ActionCard 
                title={t('semanticRetrieval')} 
                description={t('findSimilarConcepts')} 
                icon={Search} 
                onClick={() => navigate('/search')}
                gradient="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                delay={0.4}
              />
              <ActionCard 
                title={t('interactiveReasoning')} 
                description={t('chatWithDocs')} 
                icon={MessageSquare} 
                onClick={() => navigate('/chat')}
                gradient="bg-accent/20 text-accent border border-accent/30"
                delay={0.5}
              />
            </div>
          </section>

          {/* Col 2: Recent Activity (4/12) */}
          <section className="lg:col-span-4 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-text-primary flex items-center gap-2 uppercase tracking-[0.4em] opacity-40">
                {t('recentIngestions')}
              </h2>
              <button onClick={() => navigate('/documents')} className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest">
                {t('manage')}
              </button>
            </div>

            <div className="bb-premium-card min-h-[340px] flex flex-col p-6 border-accent/10 bg-accent/[0.02]">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-accent" size={24} />
                  <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">{t('scanningRepository')}</p>
                </div>
              ) : recentDocs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent/20">
                     <FileText size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">{t('libraryEmpty')}</h3>
                    <p className="text-[10px] text-text-dim max-w-[180px] mx-auto leading-relaxed">
                      {t('initResearch')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setUploadModalOpen(true)}
                    className="bg-accent/10 hover:bg-accent text-accent hover:text-primary-foreground border border-accent/30 px-8 py-3 rounded-xl text-[10px] font-bold transition-all shadow-[0_0_20px_var(--color-accent-glow)] active:scale-95 uppercase tracking-[0.2em]"
                  >
                    {t('addSource')}
                  </button>
                </div>
              ) : (
                <div className="w-full divide-y divide-accent/10">
                   {recentDocs.map((doc, i) => (
                     <div key={doc.id} className="flex items-center gap-4 py-4 group cursor-pointer" onClick={() => navigate(`/analytics/${doc.id}`)}>
                        <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-text-muted group-hover:text-accent transition-colors border border-accent/10 group-hover:border-accent/30 shadow-inner">
                           <FileText size={18} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                           <p className="text-sm font-bold text-text-primary truncate group-hover:text-accent transition-colors">{doc.title}</p>
                           <p className="text-[10px] text-text-dim mt-1 font-mono uppercase tracking-tighter">{t('indexed')} {new Date(doc.uploadDate).toLocaleDateString()}</p>
                        </div>
                        <ArrowRight size={14} className="text-accent opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                     </div>
                   ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Feature Overview Footer */}
        <footer className="pt-12 border-t border-accent/10 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-4">
              <Quote size={20} className="text-accent/40" />
              <p className="text-sm italic text-text-secondary font-medium">
                "The goal of research is not just to discover, but to understand and connect." 
                <span className="ml-3 text-accent font-bold not-italic font-mono text-xs tracking-tighter">— SCHOLAR_AI_SYSTEM</span>
              </p>
           </div>
           
            <div className="flex flex-wrap items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-xl bg-accent/5 border border-accent/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[8px] lg:text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{t('ragEnabled')}</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-xl bg-accent/5 border border-accent/10">
                 <Database size={10} className="lg:hidden text-accent" />
                  <Database size={12} className="hidden lg:block text-accent" />
                 <span className="text-[8px] lg:text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{t('vectorDB')}</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-xl bg-accent/5 border border-accent/10">
                 <Cpu size={10} className="lg:hidden text-accent" />
                  <Cpu size={12} className="hidden lg:block text-accent" />
                 <span className="text-[8px] lg:text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{t('localInference')}</span>
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
}

export default DashboardPage;
