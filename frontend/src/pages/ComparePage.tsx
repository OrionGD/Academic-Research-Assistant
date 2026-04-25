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
      className="w-full flex items-center justify-between p-4 bg-bg-elevated/50 hover:bg-bg-elevated transition-colors rounded-t-2xl"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-gold-main" />
        <h3 className="font-bold text-text-primary">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="px-2 py-0.5 bg-gold-main/10 text-gold-main text-xs font-bold rounded-full">
            {count}
          </span>
        )}
      </div>
      {expandedSections[sectionKey] ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
    </button>
  );

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('compareDocuments') || 'Compare Documents'}</h1>
          <p className="text-text-secondary mt-1">
            {t('compareDesc') || 'Select research papers to generate an AI-powered comparative analysis.'}
          </p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">
              <span className="font-bold text-text-primary">{selectedIds.size}</span> {t('selected') || 'selected'}
            </span>
            <button
              onClick={clearSelection}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary bg-bg-secondary border border-silver-muted/20 rounded-xl transition-all"
            >
              {t('clearSelection') || 'Clear'}
            </button>
            <button
              onClick={handleCompare}
              disabled={comparing || selectedIds.size < 2}
              className={cn(
                "btn-gold px-6 py-2.5 flex items-center gap-2 transition-all",
                (comparing || selectedIds.size < 2) && "opacity-50 cursor-not-allowed"
              )}
            >
              {comparing ? <Loader2 size={18} className="animate-spin" /> : <GitCompare size={18} />}
              {comparing ? (t('comparing') || 'Comparing...') : (t('compare') || 'Compare')}
            </button>
          </div>
        )}
      </div>

      {/* Document Selector */}
      <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <BookOpen size={20} className="text-gold-main" />
            {t('selectDocuments') || 'Select Documents'}
          </h2>
          <span className="text-xs text-text-muted font-medium">
            {t('maxCompareHint') || 'Select 2–5 documents'}
          </span>
        </div>

        {docsLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader size={40} />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary font-medium">{t('noDocumentsToCompare') || 'No documents available to compare.'}</p>
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
                    "relative cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md",
                    isSelected
                      ? "border-gold-main bg-gold-main/5 shadow-gold-main/10"
                      : "border-silver-muted/20 bg-bg-elevated hover:border-silver-muted/40"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isSelected ? "bg-gold-main border-gold-main" : "border-silver-muted/40"
                    )}>
                      {isSelected && <Check size={12} className="text-[#0E0E10]" />}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("font-semibold text-sm line-clamp-2", isSelected ? "text-gold-main" : "text-text-primary")}>
                        {doc.title || t('untitled')}
                      </p>
                      <p className="text-xs text-text-muted mt-1 truncate">
                        {(doc.authors || []).join(', ') || t('unknownAuthor')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-bg-secondary text-text-muted rounded border border-silver-muted/10">
                          {doc.year || 'N/A'}
                        </span>
                        {doc.status === 'processing' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gold-main/10 text-gold-main rounded border border-gold-main/20 flex items-center gap-1">
                            <Loader2 size={8} className="animate-spin" /> Processing
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Sparkles size={20} className="text-gold-main" />
              {t('comparisonResults') || 'Comparison Results'}
            </h2>
            <div className="flex items-center gap-2">
              {result.aiGenerated ? (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles size={12} /> {t('aiGenerated') || 'AI Generated'}
                </span>
              ) : (
                <span className="px-3 py-1 bg-silver-muted/10 text-silver-main text-xs font-bold rounded-full border border-silver-muted/20 flex items-center gap-1">
                  <Info size={12} /> {t('heuristicResults') || 'Heuristic'}
                </span>
              )}
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="p-2 text-text-muted hover:text-gold-main hover:bg-gold-main/10 rounded-lg transition-all border border-transparent hover:border-gold-main/20"
                title={t('recompare') || 'Run again'}
              >
                <RefreshCw size={16} className={cn(comparing && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
            <SectionHeader title={t('summary') || 'Summary'} icon={Layers} sectionKey="summary" />
            {expandedSections.summary && (
              <div className="p-6">
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {result.summary || (t('noSummary') || 'No summary available.')}
                </p>
              </div>
            )}
          </div>

          {/* Common Themes */}
          {result.commonThemes && result.commonThemes.length > 0 && (
            <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
              <SectionHeader title={t('commonThemes') || 'Common Themes'} icon={SearchCheck} sectionKey="themes" count={result.commonThemes.length} />
              {expandedSections.themes && (
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {result.commonThemes.map((theme, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-gold-main/10 text-gold-main text-sm font-medium rounded-xl border border-gold-main/20"
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
            <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
              <SectionHeader title={t('conflictingFindings') || 'Conflicting Findings'} icon={AlertTriangle} sectionKey="conflicts" count={result.conflictingFindings.length} />
              {expandedSections.conflicts && (
                <div className="p-6 space-y-3">
                  {result.conflictingFindings.map((finding, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <ArrowRight size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-text-secondary">{finding}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Research Gaps */}
          {result.researchGaps && result.researchGaps.length > 0 && (
            <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
              <SectionHeader title={t('researchGaps') || 'Research Gaps'} icon={SearchCheck} sectionKey="gaps" count={result.researchGaps.length} />
              {expandedSections.gaps && (
                <div className="p-6 space-y-3">
                  {result.researchGaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-bg-elevated border border-silver-muted/10 rounded-xl">
                      <div className="w-5 h-5 rounded-full bg-gold-main/10 text-gold-main flex items-center justify-center shrink-0 text-xs font-bold">
                        {i + 1}
                      </div>
                      <p className="text-sm text-text-secondary">{gap}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Novel Opportunities */}
          {result.novelOpportunities && result.novelOpportunities.length > 0 && (
            <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
              <SectionHeader title={t('novelOpportunities') || 'Novel Opportunities'} icon={Lightbulb} sectionKey="opportunities" count={result.novelOpportunities.length} />
              {expandedSections.opportunities && (
                <div className="p-6 space-y-3">
                  {result.novelOpportunities.map((opp, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <Zap size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-text-secondary">{opp}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comparison Table */}
          {result.comparisonTable && result.comparisonTable.length > 0 && (
            <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
              <SectionHeader title={t('comparisonTable') || 'Comparison Table'} icon={Table} sectionKey="table" count={result.comparisonTable.length} />
              {expandedSections.table && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-bg-elevated/50 border-b border-silver-muted/10">
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('dimension') || 'Dimension'}</th>
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('paperA') || 'Paper A'}</th>
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('paperB') || 'Paper B'}</th>
                        <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('comparison') || 'Comparison'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-silver-muted/5">
                      {result.comparisonTable.map((row, i) => (
                        <tr key={i} className="hover:bg-bg-elevated/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gold-main">{row.dimension}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{row.paperA}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{row.paperB}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{row.comparison}</td>
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
            <div className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-lg overflow-hidden">
              <SectionHeader title={t('featureComparison') || 'Feature Comparison'} icon={GitCompare} sectionKey="features" count={result.features.length} />
              {expandedSections.features && (
                <div className="p-6 space-y-6">
                  {result.features.map((feature, fi) => {
                    const docIds = Object.keys(feature.values);
                    return (
                      <div key={fi}>
                        <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-main" />
                          {feature.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {docIds.map(docId => {
                            const doc = documents.find(d => d.id === docId);
                            return (
                              <div key={docId} className="p-3 bg-bg-elevated rounded-xl border border-silver-muted/10">
                                <p className="text-xs font-bold text-gold-main mb-1">{doc?.title || docId}</p>
                                <p className="text-sm text-text-secondary">{feature.values[docId]}</p>
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

