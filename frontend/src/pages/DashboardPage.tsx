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
  Layers
} from 'lucide-react';
import { useDocuments } from '../shared/hooks/useDocuments';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MetricCard, ActionCard, FeatureCard, InsightItem } from '../shared/components/ui/DashboardComponents';
import { useAppStore } from '../store/useAppStore';
import { useLanguage } from '../context/LanguageContext';

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
    <div className="min-h-full bg-background pb-10">
      <div className="max-w-[1600px] mx-auto px-8 md:px-12 py-10 space-y-12">
        
        {/* Welcome Section */}
        <div className="flex flex-col gap-2">
           <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('researchControlCenter')}</h1>
           <p className="text-text-dim max-w-2xl leading-relaxed">
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
            color="text-indigo-400"
            delay={0.1}
          />
          <MetricCard 
            label={t('activeCollections')} 
            value="4" 
            subtext={t('contextGroups')}
            icon={Layers} 
            color="text-emerald-400"
            delay={0.2}
          />
          <MetricCard 
            label={t('neuralIndices')} 
            value={completedCount} 
            subtext={t('vectorizedChunks')}
            icon={Database} 
            color="text-purple-400"
            delay={0.3}
          />
          <MetricCard 
            label={t('systemHealth')} 
            value="Optimal" 
            subtext={t('ragEngineActive')}
            icon={ShieldCheck} 
            color="text-amber-400"
            delay={0.4}
          />
        </section>

        {/* Row 2: Workflow Entry Points */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Col 1: Primary Workflows (8/12) */}
          <section className="lg:col-span-8 space-y-6">
            <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
              {t('launchWorkflow')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionCard 
                title={t('neuralIngestion')} 
                description={t('uploadVectorize')} 
                icon={Plus} 
                onClick={() => setUploadModalOpen(true)}
                gradient="bg-rose-500/20 text-rose-400"
                delay={0.15}
              />
              <ActionCard 
                title={t('knowledgeLibrary')} 
                description={t('manageAnalyzeSources')} 
                icon={FileText} 
                onClick={() => navigate('/documents')}
                gradient="bg-indigo-500/20 text-indigo-400"
                delay={0.2}
              />
              <ActionCard 
                title={t('contextManagement')} 
                description={t('organizePapers')} 
                icon={Layers} 
                onClick={() => navigate('/collections')}
                gradient="bg-emerald-500/20 text-emerald-400"
                delay={0.3}
              />
              <ActionCard 
                title={t('semanticRetrieval')} 
                description={t('findSimilarConcepts')} 
                icon={Search} 
                onClick={() => navigate('/search')}
                gradient="bg-purple-500/20 text-purple-400"
                delay={0.4}
              />
              <ActionCard 
                title={t('interactiveReasoning')} 
                description={t('chatWithDocs')} 
                icon={MessageSquare} 
                onClick={() => navigate('/chat')}
                gradient="bg-amber-500/20 text-amber-400"
                delay={0.5}
              />
            </div>
          </section>

          {/* Col 2: Recent Activity (4/12) */}
          <section className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                {t('recentIngestions')}
              </h2>
              <button onClick={() => navigate('/documents')} className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest">
                {t('manage')}
              </button>
            </div>

            <div className="bb-premium-card min-h-[340px] flex flex-col p-6 border-white/[0.03]">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-accent" size={24} />
                  <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">{t('scanningRepository')}</p>
                </div>
              ) : recentDocs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center">
                  <FileText size={32} className="text-text-muted opacity-20" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-text-primary">{t('libraryEmpty')}</h3>
                    <p className="text-[10px] text-text-dim max-w-[180px] mx-auto leading-relaxed">
                      {t('initResearch')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setUploadModalOpen(true)}
                    className="bg-accent hover:bg-accent-light text-white px-6 py-2 rounded-lg text-[11px] font-bold transition-all shadow-lg shadow-accent/20 active:scale-95 uppercase tracking-widest"
                  >
                    {t('addSource')}
                  </button>
                </div>
              ) : (
                <div className="w-full divide-y divide-white/[0.03]">
                   {recentDocs.map((doc, i) => (
                     <div key={doc.id} className="flex items-center gap-3 py-3.5 group cursor-pointer" onClick={() => navigate(`/analytics/${doc.id}`)}>
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted group-hover:text-accent transition-colors border border-white/5">
                           <FileText size={16} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                           <p className="text-[13px] font-bold text-text-primary truncate">{doc.title}</p>
                           <p className="text-[10px] text-text-dim mt-0.5">{t('indexed')} {new Date(doc.uploadDate).toLocaleDateString()}</p>
                        </div>
                        <ArrowRight size={14} className="text-text-dim opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                     </div>
                   ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Feature Overview Footer */}
        <footer className="pt-10 border-t border-white/[0.03] flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <Quote size={20} className="text-text-dim" />
              <p className="text-[13px] italic text-text-dim">
                "The goal of research is not just to discover, but to understand and connect." 
                <span className="ml-2 text-accent font-bold not-italic">— ScholarAI</span>
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{t('ragEnabled')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                 <Database size={10} className="text-text-dim" />
                 <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{t('vectorDB')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                 <Cpu size={10} className="text-indigo-400" />
                 <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{t('localInference')}</span>
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
}

export default DashboardPage;
