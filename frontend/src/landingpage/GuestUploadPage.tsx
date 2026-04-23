import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, Shield, Search, Zap, ArrowRight, FileText, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { documentsService } from '../shared/services/api/documentsService';
import { toast } from 'sonner';

export default function GuestUploadPage() {
  const { guestCredits, isGuest, login } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const document = await documentsService.uploadDocument(file, (progress) => {
        setUploadProgress(progress);
      });

      toast.success('Upload successful! Starting analysis...');
      
      // Redirect to guest dashboard/analysis view
      navigate('/free');
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Zap size={14} className="fill-current" />
            Try ARAS for Free
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Analyze your research<br />without an account
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Upload any PDF paper and get instant AI-powered summaries, semantic search, and citations. 
            You have <span className="font-bold text-red-600">{guestCredits} free credits</span> remaining.
          </p>
        </div>

        <div 
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-white rounded-[40px] border-2 border-dashed ${isUploading ? 'border-red-400 bg-red-50/20' : 'border-red-200'} p-16 text-center shadow-2xl shadow-red-500/5 relative group cursor-pointer hover:border-red-400 transition-all`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf"
          />
          <div className="absolute inset-0 bg-red-50/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[38px]" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10 group-hover:scale-110 transition-transform">
              {isUploading ? <Loader2 size={40} className="animate-spin" /> : <UploadIcon size={40} />}
            </div>
            
            {isUploading ? (
              <div className="w-full max-w-xs">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Uploading your paper... {uploadProgress}%</h3>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-red-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Drop your PDF here</h3>
                <p className="text-slate-500 font-medium">or click to browse from your computer</p>
              </div>
            )}

            <div className="flex gap-4">
              <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-400">Max 10MB</span>
              <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-400">PDF Only</span>
            </div>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: 'Semantic Search', desc: 'Find exact concepts, not just keywords.' },
            { icon: FileText, title: 'Smart Summaries', desc: 'Get the core methodology and results in seconds.' },
            { icon: Shield, title: 'Secure & Private', desc: 'Your papers are encrypted and never shared.' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4">
                <feature.icon size={24} />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">{feature.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 bg-slate-900 rounded-[40px] p-10 text-center text-white relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-2xl font-bold mb-4">Want unlimited access?</h3>
             <p className="text-slate-400 mb-8 max-w-md mx-auto">Create a free account to save your library, get more credits, and unlock API access.</p>
             <button 
               onClick={() => navigate('/signup')}
               className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-600/30 inline-flex items-center gap-2"
             >
               Get Started for Free <ArrowRight size={18} />
             </button>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px]" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px]" />
        </div>
      </div>
    </div>
  );
}
