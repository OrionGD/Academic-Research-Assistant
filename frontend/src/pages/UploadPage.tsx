import React, { useState, useCallback } from 'react';
import { FileText, Loader2, CheckCircle, AlertCircle, Upload, Link as LinkIcon, Type, X, ArrowRight } from 'lucide-react';
import { documentService } from '../shared/services/api/documentService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/helpers';
import { toast } from 'sonner';

export function UploadPage() {
  const navigate = useNavigate();
  const [uploadMethod, setUploadMethod] = useState<'pdf' | 'url' | 'text'>('pdf');
  const [uploading, setUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'application/pdf') setFile(dropped);
      else toast.error('Only PDF files are accepted');
    }
  }, []);

  const handleUploadPDF = async () => {
    if (!file) { setError('Please select a PDF file'); return; }
    setUploading(true); setError(null); setUploadedDoc(null);
    try {
      const response = await documentService.uploadDocument(file, title || undefined);
      setUploadedDoc(response);
      setFile(null); setTitle('');
      toast.success('Document uploaded and analyzed');
    } catch (err: any) {
      setError(err.message || 'Error uploading PDF');
    } finally { setUploading(false); }
  };

  const handleUploadURL = async () => {
    if (!url.trim()) { setError('Please enter a URL'); return; }
    setUploading(true); setError(null); setUploadedDoc(null);
    try {
      const response = await documentService.uploadFromUrl(url, title);
      setUploadedDoc(response);
      setUrl(''); setTitle('');
      toast.success('URL document added');
    } catch (err: any) {
      setError(err.message || 'Error uploading from URL');
    } finally { setUploading(false); }
  };

  const handleUploadText = async () => {
    if (!text.trim()) { setError('Please enter some text'); return; }
    setUploading(true); setError(null); setUploadedDoc(null);
    try {
      const response = await documentService.uploadFromText(text, title);
      setUploadedDoc(response);
      setText(''); setTitle('');
      toast.success('Text document added');
    } catch (err: any) {
      setError(err.message || 'Error uploading text');
    } finally { setUploading(false); }
  };

  const methods = [
    { key: 'pdf' as const, label: 'Upload PDF', icon: Upload },
    { key: 'url' as const, label: 'From URL', icon: LinkIcon },
    { key: 'text' as const, label: 'Paste Text', icon: Type },
  ];

  return (
    <div className="h-full overflow-y-auto bg-bg-primary py-8">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Upload Document</h1>
          <p className="text-text-dim mt-1">Add research papers to your local intelligence library for deep semantic analysis.</p>
        </motion.div>

        {/* Method Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => { setUploadMethod(m.key); setError(null); }}
              className={cn(
                "flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold transition-all border shadow-sm",
                uploadMethod === m.key
                  ? 'bg-accent/10 text-accent border-accent/30 shadow-accent/5'
                  : 'bg-white/[0.03] text-text-dim border-white/5 hover:border-white/10 hover:text-text-primary'
              )}
            >
              <m.icon size={18} />
              {m.label}
            </button>
          ))}
        </motion.div>

        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bb-premium-card p-10 border-white/5"
        >
          {/* Title Input */}
          <div className="mb-8">
            <label className="block text-[11px] font-bold text-text-dim uppercase tracking-widest mb-3">
              Document Title <span className="text-text-muted normal-case opacity-50">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Attention is All You Need"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-5 text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
            />
          </div>

          {/* Method-specific Input */}
          {uploadMethod === 'pdf' && (
            <div className="mb-8">
              <label className="block text-[11px] font-bold text-text-dim uppercase tracking-widest mb-3">
                Select PDF File
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('pdf-input')?.click()}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all relative overflow-hidden group",
                  dragActive
                    ? "border-accent bg-accent/5"
                    : "border-white/5 hover:border-accent/30 bg-white/[0.02]"
                )}
              >
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <Upload className="mx-auto mb-4 text-text-dim group-hover:text-accent transition-colors" size={48} />
                  <p className="text-lg text-text-primary font-bold tracking-tight">
                    {dragActive ? 'Drop PDF here' : 'Click or drag & drop PDF'}
                  </p>
                  <p className="text-sm text-text-dim mt-1">PDF format supported, max 50 MB</p>
                </div>
                {file && (
                  <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl relative z-10">
                    <FileText size={16} className="text-accent" />
                    <span className="text-sm text-accent font-bold">{file.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-text-dim hover:text-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input id="pdf-input" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} hidden />
              </div>
            </div>
          )}

          {uploadMethod === 'url' && (
            <div className="mb-8">
              <label className="block text-[11px] font-bold text-text-dim uppercase tracking-widest mb-3">
                Document URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://arxiv.org/abs/1706.03762"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-5 text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all"
              />
            </div>
          )}

          {uploadMethod === 'text' && (
            <div className="mb-8">
              <label className="block text-[11px] font-bold text-text-dim uppercase tracking-widest mb-3">
                Document Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your document text here..."
                rows={12}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all resize-none"
              />
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3"
              >
                <AlertCircle className="text-rose-500 flex-shrink-0" size={18} />
                <p className="text-sm text-rose-200 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Button */}
          <button
            onClick={uploadMethod === 'pdf' ? handleUploadPDF : uploadMethod === 'url' ? handleUploadURL : handleUploadText}
            disabled={uploading}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
              uploading
                ? 'bg-white/5 text-text-dim cursor-not-allowed border border-white/5'
                : 'bg-accent text-white hover:bg-accent-light shadow-xl shadow-accent/20'
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span className="uppercase tracking-widest text-xs">Processing with AI Local Intelligence...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span className="uppercase tracking-widest text-xs">
                  {uploadMethod === 'pdf' ? 'Analyze Document' : 'Add to Intelligence'}
                </span>
              </>
            )}
          </button>
        </motion.div>

        {/* Success */}
        <AnimatePresence>
          {uploadedDoc && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] p-8 shadow-2xl shadow-emerald-500/5"
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  <CheckCircle className="text-emerald-400" size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-emerald-400 mb-1">Document Analysis Complete</h3>
                  <p className="text-sm text-text-dim mb-6 tracking-tight">{uploadedDoc.title}</p>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Reading Time</p>
                      <p className="text-xl font-bold text-text-primary mt-1">{uploadedDoc.analysis?.readingTime || 0} min</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Semantic Accuracy</p>
                      <p className="text-xl font-bold text-text-primary mt-1">{Math.round((uploadedDoc.analysis?.confidenceScore || 0) * 100)}%</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate(`/analytics/${uploadedDoc.id}`)}
                      className="px-8 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:bg-accent-light transition-all flex items-center gap-2 shadow-lg shadow-accent/20 active:scale-95"
                    >
                      Explore Insights <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => navigate('/chat')}
                      className="px-8 py-3 bg-white/5 text-text-primary text-sm font-bold rounded-xl hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                    >
                      AI Interaction
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UploadPage;

