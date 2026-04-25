import React, { useEffect } from 'react';
import { Loader2, Trash2, MessageSquare, FileText, Plus, Search, BookOpen, Sparkles, BarChart3, Zap, ArrowRight } from 'lucide-react';
import { useDocuments } from '../shared/hooks/useDocuments';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/helpers';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: documents, loading, error, actions } = useDocuments();

  useEffect(() => {
    actions.fetchDocuments(1, 10);
  }, []);

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    await actions.deleteDocument(documentId);
  };

  const recentDocs = documents.slice(0, 5);

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('dashboard')}</h1>
            <p className="text-sm text-text-muted mt-1">{t('managePapers')}</p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="bb-btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> {t('uploadPaper')}
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('totalPapers') || 'Total Papers', value: documents.length, icon: FileText, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
            { label: t('aiAnalyses') || 'AI Analyses', value: documents.filter(d => d.status === 'completed').length, icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: t('semanticSearch'), value: '∞', icon: Search, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: t('aiChat'), value: '∞', icon: MessageSquare, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "p-5 rounded-2xl border backdrop-blur-sm",
                stat.bg, stat.border
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2 rounded-xl bg-bg-surface/50", stat.color)}>
                  <stat.icon size={18} />
                </div>
              </div>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions + Recent */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="bg-bg-surface border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Zap size={16} className="text-accent" /> {t('quickActions') || 'Quick Actions'}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/upload')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-elevated hover:bg-bg-hover border border-border-light transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t('uploadPaper')}</p>
                    <p className="text-[11px] text-text-muted">{t('uploadNew')}</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/search')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-elevated hover:bg-bg-hover border border-border-light transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Search size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t('semanticSearch')}</p>
                    <p className="text-[11px] text-text-muted">{t('searchPlaceholder')}</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/chat')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-elevated hover:bg-bg-hover border border-border-light transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t('aiChat')}</p>
                    <p className="text-[11px] text-text-muted">{t('aiGenerated')}</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/compare')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-elevated hover:bg-bg-hover border border-border-light transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t('compareDocuments')}</p>
                    <p className="text-[11px] text-text-muted">{t('compareDesc')}</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Recent Papers */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">{t('recentPapers') || 'Recent Papers'}</h3>
                <button onClick={() => navigate('/library')} className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
                  {t('viewAll') || 'View All'} <ArrowRight size={12} />
                </button>
              </div>

              {loading ? (
                <div className="p-12 flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-accent" size={28} />
                  <p className="text-sm text-text-muted">{t('loading') || 'Loading...'}</p>
                </div>
              ) : recentDocs.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-bg-elevated rounded-2xl flex items-center justify-center mx-auto text-text-dim">
                    <FileText size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t('noPapers')}</p>
                    <p className="text-xs text-text-muted mt-1">{t('noPapersHint')}</p>
                  </div>
                  <button onClick={() => navigate('/upload')} className="bb-btn-primary text-xs px-4 py-2 mt-2">
                    {t('uploadPaper')}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-bg-elevated/40 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-light flex items-center justify-center text-text-muted group-hover:text-accent-light transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{doc.title}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {doc.status === 'completed' ? (
                            <span className="text-emerald-400">Analysis ready</span>
                          ) : (
                            <span className="text-amber-400">Processing...</span>
                          )}
                          {' · '}
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/chat`)}
                          className="p-2 rounded-lg hover:bg-accent/10 text-text-muted hover:text-accent-light transition-colors"
                          title="Chat"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/analytics/${doc.id}`)}
                          className="p-2 rounded-lg hover:bg-accent/10 text-text-muted hover:text-accent-light transition-colors"
                          title="Insights"
                        >
                          <BookOpen size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'AI Document Analysis', desc: 'Structured breakdowns: summary, methodology, results, limitations, and future work.', icon: Sparkles, color: 'text-accent-light', bg: 'bg-accent/10' },
            { title: 'Semantic Search', desc: 'Vector embeddings and cosine similarity understand meaning, not just keywords.', icon: Search, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { title: 'Cross-Paper Comparison', desc: 'Compare multiple papers side-by-side with AI-generated comparative analysis.', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="bg-bg-surface border border-border rounded-2xl p-5 hover:border-accent/20 transition-colors"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", feature.bg, feature.color)}>
                <feature.icon size={18} />
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">{feature.title}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

