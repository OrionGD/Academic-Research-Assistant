import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult } from '../../types/api';
import { analysisService } from '../../shared/services/api/analysisService';

interface AnalysisPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentTitle?: string;
}

export default function AnalysisPreviewModal({ isOpen, onClose, documentId, documentTitle }: AnalysisPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For visual loading effect
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!isOpen || !documentId) {
      setAnalysis(null);
      setError(null);
      setLoading(true);
      setLoadingStep(0);
      return;
    }

    let isActive = true;
    let pollInterval: number;

    const fetchAnalysis = async (isPolling: boolean = false) => {
      try {
        const result = await analysisService.getDocumentAnalysis(documentId);
        if (isActive) {
          setAnalysis(result);
          setLoading(false);
          setError(null);
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (err: any) {
        if (!isActive) return;
        
        // If it's a 404, it might mean analysis hasn't started or isn't finished.
        if (err.response?.status === 404) {
          if (!isPolling) {
             // First time 404, let's trigger it.
             try {
               await analysisService.startAnalysis(documentId);
               // Start polling
               pollInterval = setInterval(() => fetchAnalysis(true), 3000);
             } catch (startErr: any) {
               setError('Failed to start document analysis.');
               setLoading(false);
             }
          }
        } else {
          setError(err.response?.data?.error || 'Failed to load document analysis.');
          setLoading(false);
          if (pollInterval) clearInterval(pollInterval);
        }
      }
    };

    fetchAnalysis();

    // Fake loading steps for UX
    const stepsInterval = setInterval(() => {
        if (isActive) {
           setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
        }
    }, 2000);

    return () => {
      isActive = false;
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(stepsInterval);
    };
  }, [isOpen, documentId]);


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-main/90 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl flex flex-col bg-bg-secondary border border-border-subtle rounded-2xl shadow-2xl overflow-hidden max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-elevated/50 backdrop-blur-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold-main/20 rounded-xl">
                  <Sparkles className="text-gold-main" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary line-clamp-1">
                    AI Analysis Result
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                    {documentTitle || 'Document Preview'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-white hover:bg-neutral-800 rounded-lg transition-all border border-transparent hover:border-border-subtle"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-bg-main relative custom-scrollbar">
              {loading && !error && (
                <div className="flex flex-col items-center justify-center py-20 px-6 h-full">
                  <div className="relative mb-8">
                     <div className="absolute inset-0 bg-gold-main/20 blur-xl rounded-full"></div>
                     <Loader2 className="w-12 h-12 text-gold-main animate-spin relative z-10" />
                  </div>
                  
                  <h4 className="text-lg font-bold text-text-primary mb-6">Analyzing Document...</h4>
                  
                  <div className="w-full max-w-sm space-y-4">
                     <div className={`flex items-center gap-3 text-sm font-medium transition-colors ${loadingStep >= 0 ? 'text-gold-main' : 'text-text-muted'}`}>
                        {loadingStep > 0 ? <CheckCircle2 size={16} /> : <Loader2 size={16} className={loadingStep === 0 ? "animate-spin" : ""} />}
                        <span>Extracting text and metadata</span>
                     </div>
                     <div className={`flex items-center gap-3 text-sm font-medium transition-colors ${loadingStep >= 1 ? 'text-gold-main' : 'text-text-muted'}`}>
                        {loadingStep > 1 ? <CheckCircle2 size={16} /> : <Loader2 size={16} className={loadingStep === 1 ? "animate-spin" : ""} />}
                        <span>Generating semantic embeddings</span>
                     </div>
                     <div className={`flex items-center gap-3 text-sm font-medium transition-colors ${loadingStep >= 2 ? 'text-gold-main' : 'text-text-muted'}`}>
                        {loadingStep > 2 ? <CheckCircle2 size={16} /> : <Loader2 size={16} className={loadingStep === 2 ? "animate-spin" : ""} />}
                        <span>Synthesizing key insights with LLM</span>
                     </div>
                     <div className={`flex items-center gap-3 text-sm font-medium transition-colors ${loadingStep >= 3 ? 'text-gold-main' : 'text-text-muted'}`}>
                        {loadingStep > 3 ? <CheckCircle2 size={16} /> : <Loader2 size={16} className={loadingStep === 3 ? "animate-spin" : ""} />}
                        <span>Finalizing summary</span>
                     </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center py-16 h-full">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <h4 className="text-lg font-bold text-red-400 mb-2">Analysis Failed</h4>
                  <p className="text-red-300/80 text-sm max-w-md text-center">{error}</p>
                </div>
              )}

              {!loading && !error && analysis && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-8"
                >
                  <section className="bg-bg-elevated border border-gold-main/10 rounded-2xl p-6 shadow-sm shadow-gold-main/5 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-3 opacity-10">
                        <FileText size={100} />
                     </div>
                     <h4 className="text-[10px] font-bold text-gold-main uppercase tracking-widest mb-3 relative z-10">Executive Summary</h4>
                     <p className="text-text-primary leading-relaxed text-sm relative z-10">
                        {analysis.summary || 'No summary available.'}
                     </p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <section className="bg-bg-secondary border border-border-subtle rounded-2xl p-5">
                         <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Key Insights</h4>
                         <ul className="space-y-3">
                            {Array.isArray(analysis.keyInsights) && analysis.keyInsights.length > 0 ? (
                                analysis.keyInsights.map((insight: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gold-main mt-1.5 shrink-0" />
                                        <span className="text-sm text-text-secondary leading-snug">{insight}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-text-muted italic">No key insights extracted.</li>
                            )}
                         </ul>
                      </section>

                      <section className="bg-bg-secondary border border-border-subtle rounded-2xl p-5">
                         <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Methodology & Limits</h4>
                         <p className="text-sm text-text-secondary leading-snug mb-4">
                            <strong>Methodology:</strong> {analysis.methodology || 'N/A'}
                         </p>
                         <p className="text-sm text-text-secondary leading-snug">
                            <strong>Limitations:</strong>
                         </p>
                         <ul className="space-y-1 mt-1">
                            {Array.isArray(analysis.limitations) && analysis.limitations.length > 0 ? (
                                analysis.limitations.map((limit: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400/50 mt-1.5 shrink-0" />
                                        <span className="text-sm text-text-secondary leading-snug">{limit}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-text-muted italic">No limitations noted.</li>
                            )}
                         </ul>
                      </section>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
