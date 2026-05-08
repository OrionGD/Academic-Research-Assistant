import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDocuments } from '../shared/hooks/useDocuments';
import { documentService } from '../shared/services/api/documentService';
import { Document, DocumentComparisonResult } from '../types/api';
import { useLanguage } from '../context/LanguageContext';
import { Loader } from '../shared/components/LoadingStates';
import { cn } from '../utils/helpers';
import { toast } from 'sonner';
import {
  GitCompare,
  Check,
  FileText,
  X,
  Loader2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Table,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Layers,
  SearchCheck,
  Zap,
  Info
} from 'lucide-react';

export default function ComparePage() {
  const { t } = useLanguage();
  const location = useLocation();
  const { data: documents, loading: docsLoading, actions } = useDocuments();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<DocumentComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    themes: true,
    conflicts: true,
    gaps: true,
    opportunities: true,
    table: true,
    features: true,
  });

  useEffect(() => {
    actions.fetchDocuments();
  }, []);

  useEffect(() => {
    const state = location.state as { documentIds?: string[] } | null;
    if (state?.documentIds && state.documentIds.length >= 2) {
      setSelectedIds(new Set(state.documentIds));
    }
  }, [location.state]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 5) {
          toast.error(t('maxSelectionReached') || 'You can compare up to 5 documents at a time');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleCompare = async () => {
    if (selectedIds.size < 2) {
      toast.error(t('selectAtLeastTwo') || 'Select at least 2 documents to compare');
      return;
    }
    setComparing(true);
    setError(null);
    setResult(null);
    try {
      const data = await documentService.compareDocuments(Array.from(selectedIds));
      setResult(data as DocumentComparisonResult);
      toast.success(t('comparisonComplete') || 'Comparison complete');
    } catch (err: any) {
      setError(err?.message || 'Comparison failed');
      toast.error(t('comparisonFailed') || 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SectionHeader = ({
    title,
    icon: Icon,
    sectionKey,
    count
  }: {
    title: string;
    icon: any;
    sectionKey: string;
    count?: number;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-5 bg-surface-subtle hover:bg-surface-light transition-all rounded-t-3xl border-b border-border-subtle"
    >
      <div className="flex items-center gap-4">
        <Icon size={18} className="text-accent" />
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="px-2.5 py-1 bg-accent/10 text-accent text-[10px] font-bold rounded-full border border-accent/20">
            {count}
          </span>
        )}
      </div>
      <div className="p-1.5 rounded-lg bg-surface-light border border-border-light text-text-dim">
        {expandedSections[sectionKey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
    </button>
  );

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 space-y-10 bg-bg-primary">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('compareDocuments') || 'Compare Research Papers'}</h1>
          <p className="text-text-dim mt-1">
            {t('compareDesc') || 'Select up to 5 papers to generate a multi-dimensional AI comparative analysis.'}
          </p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-text-dim uppercase tracking-widest">
              <span className="text-accent">{selectedIds.size}</span> Papers Selected
            </span>
            <button
              onClick={clearSelection}
              className="px-4 py-2 text-[10px] font-bold text-text-dim uppercase tracking-widest hover:text-rose-500 transition-colors"
            >
              {t('clearSelection') || 'Reset Selection'}
            </button>
            <button
              onClick={handleCompare}
              disabled={comparing || selectedIds.size < 2}
              className={cn(
                "bg-accent hover:bg-accent-light text-accent-foreground px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-accent/20 flex items-center gap-2 active:scale-95",
                (comparing || selectedIds.size < 2) && "opacity-50 cursor-not-allowed grayscale"
              )}
            >
              {comparing ? <Loader2 size={18} className="animate-spin" /> : <GitCompare size={18} />}
              <span className="text-xs uppercase tracking-widest">
                {comparing ? (t('comparing') || 'Analyzing...') : (t('compare') || 'Start Comparison')}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Document Selector */}
      <div className="bb-premium-card p-8 border-border-subtle">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <BookOpen size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-text-primary tracking-tight">
                  {t('selectDocuments') || 'Knowledge Selection'}
                </h2>
                <p className="text-xs text-text-dim uppercase tracking-widest font-bold">Select 2–5 documents to begin</p>
             </div>
          </div>
        </div>

        {docsLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-surface-subtle rounded-3xl border border-dashed border-border-light">
            <FileText size={40} className="mx-auto text-text-dim mb-3 opacity-20" />
            <p className="text-text-dim font-bold uppercase tracking-widest text-xs">{t('noDocumentsToCompare') || 'No synchronized documents available.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map(doc => {
              const isSelected = selectedIds.has(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelection(doc.id)}
                  className={cn(
                    "relative cursor-pointer rounded-2xl border p-5 transition-all group",
                    isSelected
                      ? "border-accent bg-accent/5 shadow-lg shadow-accent/5"
                      : "border-border-subtle bg-surface-subtle hover:border-border-light hover:bg-surface-light"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                      isSelected ? "bg-accent border-accent text-accent-foreground shadow-lg" : "border-border-light group-hover:border-accent/40"
                    )}>
                      {isSelected && <Check size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("font-bold text-sm line-clamp-2 leading-relaxed tracking-tight", isSelected ? "text-accent" : "text-text-primary")}>
                        {doc.title || t('untitled')}
                      </p>
                      <p className="text-xs text-text-dim mt-2 truncate font-medium">
                        {(doc.authors || []).join(', ') || t('unknownAuthor')}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-light text-text-dim rounded-md border border-border-subtle uppercase tracking-widest">
                          {doc.year || 'N/A'}
                        </span>
                        {doc.status === 'processing' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-accent/10 text-accent rounded-md border border-accent/20 flex items-center gap-1.5 uppercase tracking-widest">
                            <Loader2 size={10} className="animate-spin" /> Analyzing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
          <AlertTriangle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

    {/* Results */}
    {result && (
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3 tracking-tight">
            <Sparkles size={24} className="text-accent" />
            {t('comparisonResults') || 'Semantic Comparison Analysis'}
          </h2>
          <div className="flex items-center gap-3">
            {result.aiGenerated ? (
              <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-emerald-500/5">
                <Sparkles size={12} /> {t('aiGenerated') || 'AI Synthesis Enabled'}
              </span>
            ) : (
              <span className="px-4 py-1.5 bg-surface-light text-text-dim text-[10px] font-bold rounded-full border border-border-light flex items-center gap-2 uppercase tracking-widest">
                <Info size={12} /> {t('heuristicResults') || 'Standard Comparison'}
              </span>
            )}
            <button
              onClick={handleCompare}
              disabled={comparing}
              className="p-2.5 text-text-dim hover:text-accent hover:bg-accent/10 rounded-xl transition-all border border-border-subtle hover:border-accent/30 active:scale-95"
              title={t('recompare') || 'Regenerate Analysis'}
            >
              <RefreshCw size={18} className={cn(comparing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bb-premium-card border-border-subtle overflow-hidden">
          <SectionHeader title={t('summary') || 'Comparative Summary'} icon={Layers} sectionKey="summary" />
          {expandedSections.summary && (
            <div className="p-8">
              <p className="text-text-dim leading-relaxed whitespace-pre-line text-lg font-medium italic">
                "{result.summary || 'AI-generated comparison across selected documents highlighting methodology, results, and insights.'}"
              </p>
            </div>
          )}
        </div>

        {/* Common Themes */}
        {result.commonThemes && result.commonThemes.length > 0 && (
          <div className="bb-premium-card border-border-subtle overflow-hidden">
            <SectionHeader title={t('commonThemes') || 'Cross-Paper Themes'} icon={SearchCheck} sectionKey="themes" count={result.commonThemes.length} />
            {expandedSections.themes && (
              <div className="p-8">
                <div className="flex flex-wrap gap-3">
                  {result.commonThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-accent/5 text-accent text-sm font-bold rounded-xl border border-accent/20 hover:border-accent/40 transition-colors"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conflicting Findings */}
        {result.conflictingFindings && result.conflictingFindings.length > 0 && (
          <div className="bb-premium-card border-border-subtle overflow-hidden">
            <SectionHeader title={t('conflictingFindings') || 'Critical Conflicts'} icon={AlertTriangle} sectionKey="conflicts" count={result.conflictingFindings.length} />
            {expandedSections.conflicts && (
              <div className="p-8 space-y-4">
                {result.conflictingFindings.map((finding, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                       <AlertTriangle size={16} className="text-rose-500" />
                    </div>
                    <p className="text-sm text-text-dim leading-relaxed font-medium">{finding}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Research Gaps */}
        {result.researchGaps && result.researchGaps.length > 0 && (
          <div className="bb-premium-card border-border-subtle overflow-hidden">
            <SectionHeader title={t('researchGaps') || 'Identified Gaps'} icon={SearchCheck} sectionKey="gaps" count={result.researchGaps.length} />
            {expandedSections.gaps && (
              <div className="p-8 space-y-4">
                {result.researchGaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-surface-subtle border border-border-subtle rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 text-xs font-bold border border-accent/20">
                      {i + 1}
                    </div>
                    <p className="text-sm text-text-dim leading-relaxed font-medium">{gap}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Novel Opportunities */}
        {result.novelOpportunities && result.novelOpportunities.length > 0 && (
          <div className="bb-premium-card border-border-subtle overflow-hidden">
            <SectionHeader title={t('novelOpportunities') || 'Innovation Opportunities'} icon={Lightbulb} sectionKey="opportunities" count={result.novelOpportunities.length} />
            {expandedSections.opportunities && (
              <div className="p-8 space-y-4">
                {result.novelOpportunities.map((opp, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl shadow-lg shadow-emerald-500/5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                       <Zap size={16} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-text-dim leading-relaxed font-medium">{opp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison Table */}
        {result.comparisonTable && result.comparisonTable.length > 0 && (
          <div className="bb-premium-card border-border-subtle overflow-hidden">
            <SectionHeader title={t('comparisonTable') || 'Structural Comparison Matrix'} icon={Table} sectionKey="table" count={result.comparisonTable.length} />
            {expandedSections.table && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-subtle border-b border-border-subtle">
                      <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">{t('dimension') || 'Comparison Dimension'}</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">Document A Perspective</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">Document B Perspective</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">AI Synthesis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {result.comparisonTable.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-subtle/50 transition-colors group">
                        <td className="px-8 py-6 text-xs font-bold text-accent uppercase tracking-wider group-hover:pl-10 transition-all">{row.dimension}</td>
                        <td className="px-8 py-6 text-sm text-text-dim leading-relaxed">{row.paperA}</td>
                        <td className="px-8 py-6 text-sm text-text-dim leading-relaxed">{row.paperB}</td>
                        <td className="px-8 py-6 text-sm text-text-primary font-medium leading-relaxed bg-accent/[0.02]">{row.comparison}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Feature Comparison */}
        {result.features && result.features.length > 0 && (
          <div className="bb-premium-card border-border-subtle overflow-hidden">
            <SectionHeader title={t('featureComparison') || 'Granular Feature Analysis'} icon={GitCompare} sectionKey="features" count={result.features.length} />
            {expandedSections.features && (
              <div className="p-8 space-y-10">
                {result.features.map((feature, fi) => {
                  const docIds = Object.keys(feature.values);
                  return (
                    <div key={fi}>
                      <h4 className="text-xs font-bold text-text-primary mb-5 flex items-center gap-3 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                        {feature.name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {docIds.map(docId => {
                          const doc = documents.find(d => d.id === docId);
                          return (
                            <div key={docId} className="p-5 bg-surface-subtle rounded-2xl border border-border-subtle hover:border-accent/20 transition-all">
                              <p className="text-[10px] font-bold text-accent mb-2 uppercase tracking-widest truncate">{doc?.title || docId}</p>
                              <p className="text-sm text-text-dim leading-relaxed font-medium">{feature.values[docId]}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);
}

