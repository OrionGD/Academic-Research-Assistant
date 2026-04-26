import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, BookOpen, Clock, Gauge, Lightbulb, FlaskConical, ClipboardList, Milestone, Sparkles, ArrowLeft, MessageSquare } from 'lucide-react';
import { documentService } from '../shared/services/api/documentService';
import { AnalysisResult } from '../types/api';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../utils/helpers';

export function AnalyticsPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      navigate('/dashboard');
      return;
    }

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const fetchedDoc = await documentService.getDocumentById(documentId);
        setDoc(fetchedDoc);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [documentId, navigate]);

  const analysis: AnalysisResult | null = doc?.analysis || null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-accent-light" size={32} />
          <p className="text-sm text-text-muted">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary p-8">
        <div className="max-w-md w-full p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  const sections = [
    { key: 'summary', label: 'Summary', icon: BookOpen, color: 'text-accent-light', bg: 'bg-accent/10', content: analysis?.summary },
    { key: 'methodology', label: 'Methodology', icon: FlaskConical, color: 'text-emerald-400', bg: 'bg-emerald-500/10', content: analysis?.methodology },
    { key: 'results', label: 'Results', icon: ClipboardList, color: 'text-sky-400', bg: 'bg-sky-500/10', content: analysis?.results },
    { key: 'limitations', label: 'Limitations', icon: Gauge, color: 'text-amber-400', bg: 'bg-amber-500/10', content: analysis?.limitations },
    { key: 'futureWork', label: 'Future Work', icon: Milestone, color: 'text-violet-400', bg: 'bg-violet-500/10', content: analysis?.futureWork },
  ];

  return (
    <div className="h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => navigate('/library')}
            className="bb-btn-icon"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary truncate">{doc.title}</h1>
            <p className="text-xs text-text-muted">AI Research Insight Report</p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="bb-btn-primary btn-glow-glitter text-xs flex items-center gap-1.5"
          >
            <MessageSquare size={14} /> Chat
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Reading Time', value: `${analysis?.readingTime || 0} min`, icon: Clock, color: 'text-accent-light', bg: 'bg-accent/10' },
            { label: 'Complexity', value: analysis?.complexity || 'Unknown', icon: Gauge, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Key Themes', value: analysis?.keyThemesCount || 0, icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Confidence', value: `${Math.round((analysis?.confidenceScore || 0) * 100)}%`, icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-bg-surface border border-border rounded-xl p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", stat.bg, stat.color)}>
                <stat.icon size={16} />
              </div>
              <div className="text-lg font-bold text-text-primary">{stat.value}</div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Analysis Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-bg-surface border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", section.bg, section.color)}>
                  <section.icon size={14} />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">{section.label}</h3>
              </div>
              <div className="p-5">
                {section.content ? (
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{section.content}</p>
                ) : (
                  <p className="text-sm text-text-dim italic">Not available for this document.</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Insights */}
        {analysis?.keyInsights && analysis.keyInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 bg-bg-surface border border-border rounded-2xl overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-400">
                <Lightbulb size={14} />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Key Insights & Contributions</h3>
            </div>
            <div className="p-5">
              <ul className="space-y-3">
                {analysis.keyInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-accent/10 text-accent-light flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Document Info */}
        <div className="mt-4 p-4 bg-bg-surface border border-border rounded-xl">
          <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Document ID</p>
          <p className="text-xs text-text-secondary font-mono">{documentId}</p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;

