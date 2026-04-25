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
    <div className="h-full overflow-y-auto bg-bg-primary">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Upload Document</h1>
          <p className="text-sm text-text-muted mt-1">Add research papers to your library for AI analysis</p>
        </motion.div>

        {/* Method Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3 mt-6"
        >
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => { setUploadMethod(m.key); setError(null); }}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border",
                uploadMethod === m.key
                  ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                  : 'bg-bg-surface text-text-secondary border-border hover:border-border-light hover:text-text-primary'
              )}
            >
              <m.icon size={16} />
              {m.label}
            </button>
          ))}
        </motion.div>

        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-bg-surface border border-border rounded-2xl p-6"
        >
          {/* Title Input */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Document Title <span className="text-text-dim normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Attention is All You Need"
              className="bb-input w-full"
            />
          </div>

          {/* Method-specific Input */}
          {uploadMethod === 'pdf' && (
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Select PDF File
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('pdf-input')?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                  dragActive
                    ? "border-accent bg-accent/5"
                    : "border-border-light hover:border-accent/50 bg-bg-elevated"
                )}
              >
                <FileText className="mx-auto mb-3 text-text-muted" size={40} />
                <p className="text-sm text-text-secondary font-medium">
                  {dragActive ? 'Drop PDF here' : 'Click or drag & drop PDF'}
                </p>
                <p className="text-xs text-text-dim mt-1">PDF up to 50 MB</p>
                {file && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg">
                    <FileText size={14} className="text-accent-light" />
                    <span className="text-xs text-accent-light font-medium">{file.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-text-muted hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <input id="pdf-input" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} hidden />
              </div>
            </div>
          )}

          {uploadMethod === 'url' && (
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Document URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://arxiv.org/abs/1706.03762"
                className="bb-input w-full"
              />
            </div>
          )}

          {uploadMethod === 'text' && (
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Document Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your document text here..."
                rows={10}
                className="bb-input w-full resize-none"
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
                className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3"
              >
                <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Button */}
          <button
            onClick={uploadMethod === 'pdf' ? handleUploadPDF : uploadMethod === 'url' ? handleUploadURL : handleUploadText}
            disabled={uploading}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              uploading
                ? 'bg-bg-elevated text-text-dim cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20'
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing with AI...
              </>
            ) : (
              <>
                <Upload size={18} />
                {uploadMethod === 'pdf' ? 'Upload & Analyze' : 'Add Document'}
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
              className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-emerald-400" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-emerald-300 mb-1">Document Processed Successfully</h3>
                  <p className="text-xs text-text-muted mb-3">{uploadedDoc.title}</p>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="bg-bg-surface rounded-lg p-2.5 border border-border">
                      <p className="text-text-muted">Reading Time</p>
                      <p className="text-text-primary font-semibold mt-0.5">{uploadedDoc.analysis?.readingTime || 0} min</p>
                    </div>
                    <div className="bg-bg-surface rounded-lg p-2.5 border border-border">
                      <p className="text-text-muted">Confidence</p>
                      <p className="text-text-primary font-semibold mt-0.5">{Math.round((uploadedDoc.analysis?.confidenceScore || 0) * 100)}%</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/analytics/${uploadedDoc.id}`)}
                      className="px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent-light transition-colors flex items-center gap-1.5"
                    >
                      View Analysis <ArrowRight size={12} />
                    </button>
                    <button
                      onClick={() => navigate('/chat')}
                      className="px-4 py-2 bg-bg-elevated text-text-primary text-xs font-medium rounded-lg hover:bg-bg-hover transition-colors border border-border-light"
                    >
                      Chat with Paper
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

