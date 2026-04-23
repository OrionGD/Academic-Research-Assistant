import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Loader2, ChevronLeft, Zap, Shield } from 'lucide-react';
import { documentsService } from '../shared/services/api/documentsService';
import { Document } from '../types/api';
import Logo from '../shared/components/Logo';

export default function AnalysisView() {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        if (id) {
          const doc = await documentsService.getDocumentById(id);
          setDocument(doc);
        }
      } catch (error) {
        console.error('Failed to fetch document:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center flex-col gap-4">
        <Shield size={48} className="text-red-600" />
        <h2 className="text-2xl font-bold">Document Not Found</h2>
        <button onClick={() => navigate('/free')} className="text-red-600 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <header className="bg-white border-b border-slate-100 py-4 px-8 flex items-center justify-between sticky top-0 z-50">
        <Logo />
        <button 
          onClick={() => navigate('/free')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all"
        >
          <ChevronLeft size={20} /> Back to Library
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-600">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{document.title}</h1>
              <p className="text-slate-400">Analysis Results • Temporary Guest Access</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-50 rounded-3xl p-6">
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Complexity</h4>
              <p className="text-2xl font-bold text-slate-900">{document.analysis?.complexity || 'Analyzing...'}</p>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6">
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Key Themes</h4>
              <p className="text-2xl font-bold text-slate-900">{document.analysis?.keyThemesCount || 0} Identified</p>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6">
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Reading Time</h4>
              <p className="text-2xl font-bold text-slate-900">{document.analysis?.readingTime || 0} mins</p>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-red-600 fill-current" />
                Executive Summary
              </h3>
              <div className="p-8 bg-red-50/50 border border-red-100 rounded-3xl text-slate-700 leading-relaxed">
                {document.analysis?.summary || 'Generating summary based on extracted text...'}
              </div>
            </section>

            {document.analysis?.keyInsights && document.analysis.keyInsights.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Key Insights</h3>
                <ul className="space-y-3">
                  {document.analysis.keyInsights.map((insight, index) => (
                    <li key={index} className="flex gap-3 p-4 bg-slate-50 rounded-2xl text-slate-700 border border-slate-100">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-100 flex-shrink-0">
                        {index + 1}
                      </div>
                      {insight}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-8 pt-8 border-t border-slate-100">
              <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">Unlock Full Research Breakdown</h3>
                  <p className="text-slate-400 mb-6 max-w-xl">
                    You're currently viewing a guest-tier summary. Full accounts unlock Methodology analysis, 
                    Result verification, Limitations mapping, and Future Work projections.
                  </p>
                  <button 
                    onClick={() => navigate('/auth/register')}
                    className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center gap-2"
                  >
                    Create Free Account <Zap size={18} className="fill-current text-red-600" />
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
              </div>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
