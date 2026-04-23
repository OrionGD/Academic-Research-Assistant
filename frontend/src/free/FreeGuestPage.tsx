import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { documentsService } from '../shared/services/api/documentsService';
import { Document } from '../types/api';
import { 
  FileText, 
  Search, 
  Zap, 
  ArrowRight, 
  Loader2, 
  Clock, 
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../shared/components/Logo';

export default function FreeGuestPage() {
  const { guestCredits, guestId, isGuest } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGuestDocs = async () => {
      try {
        const docs = await documentsService.getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to fetch guest documents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isGuest) {
      fetchGuestDocs();
    }
  }, [isGuest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 py-4 px-8 flex items-center justify-between sticky top-0 z-50">
        <Logo />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-2xl border border-red-100">
            <Zap size={16} className="text-red-600 fill-current" />
            <span className="text-sm font-bold text-red-600">{guestCredits} Credits Remaining</span>
          </div>
          <Link 
            to="/signup"
            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
          >
            Create Account
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* ── WELCOME BANNER ───────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-gradient-to-br from-red-600 to-red-800 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-red-600/20">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-4">Welcome back, Guest!</h1>
              <p className="text-red-100 text-lg mb-8 max-w-xl">
                Your temporary session is active. You can analyze documents, search your library, and get AI insights. 
                Your documents will be stored for 7 days.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/guest-upload')}
                  className="px-8 py-3 bg-white text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center gap-2"
                >
                  Upload New Paper <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32" />
          </div>

          <div className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-red-600" size={24} />
              <h3 className="font-bold text-slate-900 text-xl">Conversion Perk</h3>
            </div>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Register now to get <span className="font-bold text-slate-900">1,000 free credits</span> and permanent storage for all your current guest uploads.
            </p>
            <Link 
              to="/signup"
              className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group"
            >
              Claim My Credits <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── DOCUMENTS LIST ───────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="text-red-600" />
              Temporary Library
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-400 font-medium bg-slate-50 px-4 py-2 rounded-xl">
              <Clock size={16} />
              Expires in 7 days
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Your library is empty</h3>
              <p className="text-slate-500 mb-8">Upload your first research paper to see it here.</p>
              <button 
                onClick={() => navigate('/guest-upload')}
                className="px-8 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all"
              >
                Upload Paper
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/40 hover:border-red-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                      <FileText size={24} />
                    </div>
                    <div className="flex gap-2">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                         doc.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                       }`}>
                         {doc.status}
                       </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 line-clamp-2">{doc.title}</h4>
                  <p className="text-xs text-slate-400 mb-6 font-medium">Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/free/analysis/${doc.id}`)}
                      className="flex-1 py-3 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                      View Analysis <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── SECURITY ALERT ───────────────────────────────────── */}
        <div className="mt-16 bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 items-start">
          <ShieldAlert className="text-amber-600 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-1">Unsaved Data Alert</h4>
            <p className="text-amber-700 text-xs leading-relaxed">
              This is a guest session. If you clear your browser cookies or use a different device without signing up, you will lose access to these documents. Register for a free account to persist your library permanently.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
