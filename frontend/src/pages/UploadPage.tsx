import { useState, useRef } from 'react';
import { Upload as UploadIcon, X, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUpload } from '../hooks/useUpload';
import { toast } from 'sonner';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [metadata, setMetadata] = useState({
    title: '',
    authors: '',
    year: new Date().getFullYear(),
    keywords: '',
    abstract: ''
  });

  const { loading: isUploading, uploadProgress, actions } = useUpload();
  const { performUpload } = actions;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setMetadata(prev => ({ ...prev, title: droppedFile.name.replace('.pdf', '') }));
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMetadata(prev => ({ ...prev, title: selectedFile.name.replace('.pdf', '') }));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const result = await performUpload(file, metadata);
    if (result) {
      setFile(null);
      setMetadata({ title: '', authors: '', year: new Date().getFullYear(), keywords: '', abstract: '' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Upload Research Paper</h1>
        <p className="text-text-secondary mt-1">Add a new paper to your research library for AI analysis.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer
              ${isDragging ? 'border-gold-main bg-gold-main/5' : 'border-silver-muted/20 bg-bg-secondary hover:border-gold-main/50 hover:bg-bg-elevated'}
              ${file ? 'border-silver-main bg-silver-main/5' : ''}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf"
              className="hidden"
              disabled={isUploading}
            />
            
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-silver-main/10 text-silver-main rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-silver-main/10">
                    <CheckCircle2 size={40} />
                  </div>
                  <p className="font-bold text-text-primary truncate max-w-xs">{file.name}</p>
                  <p className="text-sm text-text-secondary mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  {!isUploading && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="mt-4 text-sm font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                    >
                      <X size={16} /> Remove
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="no-file"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-bg-elevated text-gold-main rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-silver-muted/20">
                    <UploadIcon size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2 text-glow-gold">Click or drag to upload</h3>
                  <p className="text-text-secondary">Support for PDF files up to 50MB</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isUploading && (
            <div className="bg-bg-secondary p-6 rounded-3xl border border-silver-muted/20 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-text-primary">
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing & Analyzing...'}
                </span>
                <span className="text-sm font-bold text-gold-main">{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-bg-elevated rounded-full overflow-hidden border border-silver-muted/10 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gold-main rounded-full shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                />
              </div>
              <p className="text-xs text-text-secondary mt-3 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-gold-main" />
                {uploadProgress < 100 
                  ? 'Sending file to server...' 
                  : 'Our AI is extracting metadata and generating initial insights.'}
              </p>
            </div>
          )}
        </div>

        {/* Metadata Form */}
        <div className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl space-y-6">
          <h3 className="text-xl font-bold text-text-primary">Paper Metadata</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Paper Title</label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                className="input-field w-full"
                placeholder="Enter paper title"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Authors (comma separated)</label>
              <input
                type="text"
                value={metadata.authors}
                onChange={(e) => setMetadata({ ...metadata, authors: e.target.value })}
                className="input-field w-full"
                placeholder="e.g. John Doe, Jane Smith"
                disabled={isUploading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Publication Year</label>
                <input
                  type="number"
                  value={metadata.year}
                  onChange={(e) => setMetadata({ ...metadata, year: parseInt(e.target.value) })}
                  className="input-field w-full"
                  disabled={isUploading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Keywords</label>
                <input
                  type="text"
                  value={metadata.keywords}
                  onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g. AI, NLP"
                  disabled={isUploading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Abstract (Optional)</label>
              <textarea
                value={metadata.abstract}
                onChange={(e) => setMetadata({ ...metadata, abstract: e.target.value })}
                rows={4}
                className="input-field w-full resize-none"
                placeholder="Enter a brief summary of the paper"
                disabled={isUploading}
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-[56px]"
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
