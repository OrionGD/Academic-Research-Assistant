import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Clock, Zap, Layers, Sparkles, 
  ArrowLeft, FileText, Loader2, Cpu, Brain, BookOpen, 
  Download, Network, Layers3, ArrowUpRight, Search, Calendar, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { cn } from '../utils/helpers';
import { documentService } from '../shared/services/api/documentService';
import { pdfExportService } from '../services/pdfExport';
import { Document } from '../types/api';
import ConceptGraph from '../shared/components/ConceptGraph';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'graph' | 'report'>('graph');
  const [exportingPDF, setExportingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch document details & full list for cross-paper citations
  useEffect(() => {
    setLoading(true);
    
    // Fetch all documents in library to generate citation mapping across papers
    documentService.getDocuments(1, 100)
      .then(res => setAllDocs(res.documents))
      .catch(err => console.error('Failed to load documents list', err));

    if (documentId && documentId !== 'global') {
      documentService.getDocumentById(documentId)
        .then(setDoc)
        .catch(() => setDoc(null))
        .finally(() => setLoading(false));
    } else {
      setDoc(null);
      setLoading(false);
    }
  }, [documentId]);

  // Derived metrics
  const wordCount = doc?.content?.split(/\s+/).length || 0;
  const manualReadingTime = Math.ceil(wordCount / 200); // 200 words per minute
  const aiAnalysisTime = doc?.analysis?.readingTime || 1; 
  const timeSaved = Math.max(0, manualReadingTime - aiAnalysisTime);

  // Trigger professional PDF Download
  const handleExportPDF = async () => {
    if (!doc) return;
    try {
      setExportingPDF(true);
      toast.loading('Generating enterprise-level PDF report...', { id: 'pdf-export' });
      await pdfExportService.exportAnalysisToPDF(doc);
      toast.success('Enterprise PDF report downloaded successfully!', { id: 'pdf-export' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF analysis report.', { id: 'pdf-export' });
    } finally {
      setExportingPDF(false);
    }
  };

  // Recharts Data 1: Citation publication years (Power BI panel)
  const citationYearData = useMemo(() => {
    return [
      { year: '2016', citations: 840, baseline: 300 },
      { year: '2018', citations: 1200, baseline: 500 },
      { year: '2019', citations: 4300, baseline: 1200 },
      { year: '2020', citations: 15400, baseline: 4300 },
      { year: '2021', citations: 24000, baseline: 9200 },
      { year: '2023', citations: 65000, baseline: 25000 },
      { year: '2025', citations: 112000, baseline: 54000 },
    ];
  }, []);

  // Recharts Data 2: Academic Focus Radar Chart (Power BI panel)
  const radarData = useMemo(() => {
    if (!doc) return [];
    const score = doc.analysis?.confidenceScore ? Math.round(doc.analysis.confidenceScore * 100) : 85;
    return [
      { subject: 'Methodology Precision', A: score, B: 80, fullMark: 100 },
      { subject: 'Quantitative Results', A: Math.min(100, score + 10), B: 85, fullMark: 100 },
      { subject: 'Technological Innovation', A: Math.max(0, score - 10), B: 75, fullMark: 100 },
      { subject: 'Research Constraints', A: Math.round(score * 0.8), B: 70, fullMark: 100 },
      { subject: 'Future Adaptability', A: Math.min(100, score + 5), B: 78, fullMark: 100 },
    ];
  }, [doc]);

  // Connected/Citing Papers table dataset
  const connectedPapers = useMemo(() => {
    const list = [
      { title: 'Attention Is All You Need', author: 'Vaswani et al.', year: 2017, domain: 'Transformers', type: 'Seminal Reference' },
      { title: 'BERT: Pre-training of Deep Bidirectional Transformers', author: 'Devlin et al.', year: 2019, domain: 'NLP', type: 'Foundational Context' },
      { title: 'Language Models are Few-Shot Learners', author: 'Brown et al.', year: 2020, domain: 'Generative AI', type: 'Extended Work' },
      { title: 'Vector Space Models for Semantic Retrieval', author: 'Salton et al.', year: 2016, domain: 'Information Retrieval', type: 'Historical Basis' },
    ];

    allDocs.forEach(item => {
      if (item.id !== doc?.id) {
        list.push({
          title: item.title,
          author: item.authors?.[0] || 'Workspace Scholar',
          year: item.year || 2025,
          domain: item.keywords?.[0] || 'Neural Ingestion',
          type: 'User Workspace Cross-Reference'
        });
      }
    });

    return list.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allDocs, doc, searchTerm]);

  const stats = [
    { 
      label: 'Manual Reading Time', 
      value: `${manualReadingTime} min`, 
      icon: Clock, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
    { 
      label: 'AI Vector Latency', 
      value: `${aiAnalysisTime} min`, 
      icon: Zap, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Intellectual Efficiency Gains', 
      value: `${timeSaved} min saved`, 
      icon: TrendingUp, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10' 
    },
    { 
      label: 'Concept Density', 
      value: doc ? (doc.status === 'completed' ? 'High' : 'Low') : '84%', 
      icon: Brain, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10' 
    },
  ];

  return (
    <div className="h-full bg-background overflow-y-auto pb-16">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-10 py-10 space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-border/10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/documents')}
              className="w-12 h-12 rounded-2xl bg-surface-light border border-border-light flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-surface-hover transition-all shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.2em]">OPERATIONS_LAB</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight leading-none">
                {doc?.title || 'Academic Intelligence Universe'}
              </h1>
              <p className="text-text-dim mt-2 text-sm max-w-xl">
                Interactive mapping of citation vectors, intellectual trajectories, and semantic analysis.
              </p>
            </div>
          </div>

          {/* Action buttons (Inspired by Power BI visual headers) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Tab Toggle */}
            <div className="flex p-1 bg-surface-light border border-border-light rounded-xl">
              <button
                onClick={() => setDashboardTab('graph')}
                className={cn(
                  "py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  dashboardTab === 'graph' ? "bg-accent/10 text-accent border border-accent/20" : "text-text-dim hover:text-text-primary"
                )}
              >
                <Network size={14} />
                Network Workspace
              </button>
              <button
                onClick={() => setDashboardTab('report')}
                className={cn(
                  "py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  dashboardTab === 'report' ? "bg-accent/10 text-accent border border-accent/20" : "text-text-dim hover:text-text-primary"
                )}
              >
                <Layers3 size={14} />
                Report Sheets
              </button>
            </div>

            {doc && (
              <button 
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="flex items-center gap-2 py-3 px-5 bg-accent text-primary-foreground hover:bg-accent-hover rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_var(--color-accent-glow)] active:scale-95 disabled:opacity-50"
              >
                {exportingPDF ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Download size={14} />
                )}
                Export PDF Analysis
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bb-premium-card p-6 border-accent/10 bg-accent/[0.01]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon size={20} className={stat.color} />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-text-primary line-clamp-1">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Workspace */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <Loader2 className="animate-spin text-accent" size={40} />
            <p className="text-sm font-bold text-text-muted uppercase tracking-widest font-mono">Syncing Neural Networks...</p>
          </div>
        ) : !doc && documentId !== 'global' ? (
          <div className="text-center py-24 bg-surface-subtle border border-border-light rounded-3xl p-8">
            <FileText size={56} className="mx-auto text-text-dim opacity-20 mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No Document Context Selected</h3>
            <p className="text-text-dim text-sm max-w-sm mx-auto mb-6">
              Select an ingested publication from your Library to map its citation network and download enterprise PDF sheets.
            </p>
            <button 
              onClick={() => navigate('/documents')}
              className="px-6 py-3 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-primary-foreground text-accent font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Go to Library
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {dashboardTab === 'graph' ? (
              // POWER BI VIEW MODE: NETWORK & TRAJECTORY GRAPH WITH CHARTS PANELS
              <motion.div
                key="tab-graph"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10"
              >
                {/* Central Interactive Graph Canvas component */}
                <ConceptGraph 
                  document={doc} 
                  documentsList={allDocs} 
                  onNodeSelect={(id) => {
                    if (id !== doc?.id && id.length > 10) {
                      navigate(`/analytics/${id}`);
                    }
                  }}
                />

                {/* Recharts Analytics panels (Inspired by Power BI dashboards widgets) */}
                <div className="grid md:grid-cols-2 gap-8 select-none">
                  
                  {/* Chart Panel 1: Chronological Citations Growth */}
                  <div className="bg-surface-subtle border border-border-light rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-border/5 pb-3">
                      <div>
                        <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Citation Chronology</h3>
                        <p className="text-[10px] text-text-dim mt-0.5">Academic influence over publication years</p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-mono font-bold text-indigo-400">INDEX_TREND</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={citationYearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="citations" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCitations)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart Panel 2: Research Dimension Radar Analysis */}
                  <div className="bg-surface-subtle border border-border-light rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-border/5 pb-3">
                      <div>
                        <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Research Dimensions Scope</h3>
                        <p className="text-[10px] text-text-dim mt-0.5">Semantic evaluation across methodology & constraints</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-mono font-bold text-emerald-400">KNOWLEDGE_DENSITY</span>
                    </div>
                    <div className="h-64 w-full flex items-center justify-center">
                      {doc ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.04)" />
                            <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                            <PolarRadiusAxis stroke="rgba(255,255,255,0.04)" />
                            <Radar name="Active Publication" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                            <Radar name="Domain Baseline" dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.05} />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-text-dim text-xs py-20 italic">No document metrics generated.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connected citations table grid (Inspired by Power BI search grids) */}
                <div className="bg-surface-subtle border border-border-light rounded-3xl p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Connected Publications & Citations</h3>
                      <p className="text-[10px] text-text-dim mt-0.5">Cross-referenced research assets linked inside workspace</p>
                    </div>
                    {/* Search inside Connected papers */}
                    <div className="relative w-64">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                      <input
                        type="text"
                        placeholder="Search connected papers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface-light border border-border-light rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-accent/40 text-text-primary font-bold placeholder:text-text-dim"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-border-subtle/50">
                    <table className="w-full text-left border-collapse font-medium text-xs">
                      <thead>
                        <tr className="bg-surface-light border-b border-border/10 text-[10px] text-text-dim uppercase tracking-wider font-bold">
                          <th className="py-4 px-5">Research Title</th>
                          <th className="py-4 px-5">Author</th>
                          <th className="py-4 px-5">Year</th>
                          <th className="py-4 px-5">Academic Domain</th>
                          <th className="py-4 px-5">Vector Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/5">
                        {connectedPapers.map((paper, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="py-4 px-5 text-text-primary font-bold group-hover:text-accent transition-colors">
                              {paper.title}
                            </td>
                            <td className="py-4 px-5 text-text-secondary">{paper.author}</td>
                            <td className="py-4 px-5 font-mono text-[10px] text-text-dim font-bold">{paper.year}</td>
                            <td className="py-4 px-5 font-bold"><span className="px-2 py-0.5 bg-accent/5 text-accent border border-accent/10 rounded-full">{paper.domain}</span></td>
                            <td className="py-4 px-5 text-emerald-400 font-bold flex items-center gap-1.5 mt-1">
                              {paper.type}
                              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -translate-y-0.5 group-hover:translate-x-0.5" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              // STANDARD SHEET REPORT VIEW MODE
              <motion.div
                key="tab-report"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid lg:grid-cols-3 gap-8"
              >
                {/* Left Column: Analysis */}
                <div className="lg:col-span-2 space-y-8">
                  <section className="space-y-4">
                    <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                      <Sparkles size={14} className="text-accent animate-pulse" />
                      AI Executive Summary
                    </h2>
                    <div className="bb-premium-card p-8 border-accent/10 leading-relaxed text-text-secondary text-sm bg-accent/[0.01]">
                      {doc?.analysis?.summary || 'No summary available for this document.'}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                      <Layers size={14} className="text-accent" />
                      Methodological Framework
                    </h2>
                    <div className="bb-premium-card p-6 border-border-subtle text-sm text-text-dim italic leading-relaxed">
                      {doc?.analysis?.methodology || 'Methodological analysis pending vector sync.'}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                      <BarChart3 size={14} className="text-accent" />
                      Quantitative Outcomes
                    </h2>
                    <div className="bb-premium-card p-6 border-border-subtle text-sm text-text-dim leading-relaxed">
                      {typeof doc?.analysis?.results === 'object' && doc?.analysis?.results !== null ? (
                        <div className="space-y-4">
                          {Object.entries(doc.analysis.results).map(([key, val]) => (
                            <div key={key}>
                              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1">{key}</h4>
                              <p className="text-sm text-text-secondary leading-relaxed">{String(val)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        doc?.analysis?.results || 'Waiting for extraction completion.'
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                      <Sparkles size={14} className="text-accent" />
                      Semantic Insights Highlights
                    </h2>
                    <div className="space-y-3">
                      {(doc?.analysis?.keyInsights || ['Semantic understanding active', 'Context grounding ready', 'Citation map initialized']).map((insight, i) => (
                        <div key={i} className="p-4 bg-surface-subtle border border-border-subtle rounded-2xl flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                            <Sparkles size={14} />
                          </div>
                          <p className="text-sm text-text-secondary leading-relaxed font-bold">{insight}</p>
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
                      Neural Pipelines
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
                          <Layers size={16} className="text-emerald-400" />
                          <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Vector DB</span>
                        </div>
                        <span className="text-[11px] font-bold text-text-primary">ChromaDB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Brain size={16} className="text-purple-400" />
                          <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">LLM Engine</span>
                        </div>
                        <span className="text-[11px] font-bold text-text-primary">Gemini 1.5 Pro</span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest opacity-60">
                      <BarChart3 size={14} className="text-accent" />
                      Analysis Confidence Card
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
                      Document Source Metadata
                    </h2>
                    <div className="bb-premium-card p-6 border-border-subtle space-y-4 font-bold">
                      <div className="flex items-center gap-3">
                        <BookOpen size={16} className="text-text-dim" />
                        <div>
                          <p className="text-[10px] text-text-dim uppercase">Asset Classification</p>
                          <p className="text-[11px] font-bold text-text-primary">Vectorized Publication</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-text-dim" />
                        <div>
                          <p className="text-[10px] text-text-dim uppercase">Word Count</p>
                          <p className="text-[11px] font-bold text-text-primary">~{wordCount.toLocaleString()} words</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
