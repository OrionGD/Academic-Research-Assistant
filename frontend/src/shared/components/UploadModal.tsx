import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, FileText, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { documentService } from "../../shared/services/api/documentService";
import { cn } from "../../utils/helpers";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen } = useAppStore();
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<any>(null);
  const navigate = useNavigate();

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
    setUploadedDoc(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 50 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadedDoc(null);

    try {
      const file = files[0];
      const doc = await documentService.uploadDocument(
        file, 
        file.name.replace(/\.pdf$/i, ""),
        author || "Unknown Author"
      );
      setUploadedDoc(doc);
      setFiles([]);
      setAuthor("");
      toast.success("Document uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setUploadModalOpen(false);
    setFiles([]);
    setUploadedDoc(null);
  };

  return (
    <AnimatePresence>
      {uploadModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-overlay backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-card border border-border-light rounded-3xl shadow-2xl z-50 flex flex-col max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface-subtle">
              <div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight">Ingest Source</h2>
                <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold mt-0.5">Vectorize your research papers</p>
              </div>
              <button onClick={handleClose} className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center text-text-dim hover:text-text-primary transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto space-y-6">
              {!uploadedDoc ? (
                <>
                  {/* Dropzone */}
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all relative group overflow-hidden",
                      isDragActive
                        ? "border-accent bg-accent/5"
                        : "border-border-subtle hover:border-accent/40 bg-surface-subtle"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4 border border-accent/20">
                        <Upload size={32} />
                      </div>
<p className="text-sm text-text-primary font-bold">
                        {isDragActive ? "Release to process" : "Drop PDF here, or browse"}
                      </p>
                      <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold mt-2">Maximum file size: 50MB</p>
                    </div>
                  </div>

                  {/* Author Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest px-2">Primary Author</label>
                    <input 
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Dr. Jane Smith"
                      className="w-full bg-surface-subtle border border-border-subtle rounded-2xl py-4 px-6 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40 transition-all shadow-lg"
                    />
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-3">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 bg-surface-subtle rounded-2xl border border-border-subtle"
                        >
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate">{file.name}</p>
                            <p className="text-[10px] text-text-dim uppercase font-bold tracking-wider">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFiles((prev) => prev.filter((_, idx) => idx !== i));
                            }}
                            className="p-2 text-text-dim hover:text-rose-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Success State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-[32px] bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <CheckCircle size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-text-primary">Source Vectorized</h3>
                    <p className="text-sm text-text-dim max-w-xs mx-auto">
                      "{uploadedDoc.title}" has been successfully ingested and indexed for semantic reasoning.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                       handleClose();
                       navigate(`/analytics/${uploadedDoc.id}`);
                    }}
                    className="w-full bg-accent hover:bg-accent-light text-accent-foreground py-4 rounded-2xl font-bold transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3 active:scale-95 group"
                  >
                     <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                     <span>Launch Neural Insights</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            {!uploadedDoc && (
              <div className="p-6 border-t border-border-subtle bg-surface-subtle flex justify-end gap-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 text-[11px] font-bold text-text-dim hover:text-text-primary uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploading}
                  className={cn(
                    "px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg",
                    files.length > 0 && !uploading
                      ? "bg-accent text-accent-foreground hover:bg-accent-light shadow-accent/20"
                      : "bg-surface-light text-text-dim cursor-not-allowed"
                  )}
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Neural Processing...
                    </span>
                  ) : (
                    "Initialize Ingestion"
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
