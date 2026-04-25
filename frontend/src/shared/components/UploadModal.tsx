import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, FileText, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { documentService } from "../../shared/services/api/documentService";
import { cn } from "../../utils/helpers";
import { toast } from "sonner";

export default function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen } = useAppStore();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<any>(null);

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
      const doc = await documentService.uploadDocument(file, file.name.replace(/\\.pdf$/i, ""));
      setUploadedDoc(doc);
      setFiles([]);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-bg-surface border border-border rounded-2xl shadow-2xl z-50 flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">Upload Document</h2>
              <button onClick={handleClose} className="bb-btn-icon">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragActive
                    ? "border-accent bg-accent/5"
                    : "border-border-light hover:border-accent/50 bg-bg-elevated"
                )}
              >
                <input {...getInputProps()} />
                <Upload size={32} className="mx-auto mb-3 text-text-muted" />
                <p className="text-sm text-text-secondary font-medium">
                  {isDragActive ? "Drop files here" : "Drag & drop PDFs, or click to browse"}
                </p>
                <p className="text-[11px] text-text-dim mt-1">PDF up to 50MB</p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-border-light"
                    >
                      <FileText size={16} className="text-accent-light shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{file.name}</p>
                        <p className="text-[10px] text-text-muted">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="bb-btn-icon"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Success */}
              {uploadedDoc && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-300">Upload Complete</p>
                  </div>
                  <p className="text-xs text-text-muted">{uploadedDoc.title}</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-medium transition-all",
                  files.length > 0 && !uploading
                    ? "bg-accent text-white hover:bg-accent-light"
                    : "bg-bg-elevated text-text-dim cursor-not-allowed"
                )}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
