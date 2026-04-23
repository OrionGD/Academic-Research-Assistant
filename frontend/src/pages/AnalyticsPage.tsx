import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { documentService } from '../../services/api';
import { Analytics } from '../../types';
import { useParams, useNavigate } from 'react-router-dom';

export function AnalyticsPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      navigate('/');
      return;
    }

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await documentService.getAnalytics(documentId);
        setAnalytics(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [documentId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-red-900 border border-red-700 rounded-lg flex gap-3">
            <AlertCircle className="text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{analytics.title}</h1>
          <p className="text-slate-300">Document Analytics & Insights</p>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl mb-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">Summary</h2>
          <p className="text-slate-300 leading-relaxed">{analytics.summary}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
            <p className="text-slate-400 text-sm mb-2">Total Chunks</p>
            <p className="text-4xl font-bold text-blue-400">{analytics.chunk_count}</p>
            <p className="text-slate-500 text-sm mt-2">Semantic segments</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
            <p className="text-slate-400 text-sm mb-2">Reading Time</p>
            <p className="text-4xl font-bold text-green-400">{analytics.reading_time}</p>
            <p className="text-slate-500 text-sm mt-2">Minutes estimated</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
            <p className="text-slate-400 text-sm mb-2">Unique Keywords</p>
            <p className="text-4xl font-bold text-purple-400">{analytics.keywords.length}</p>
            <p className="text-slate-500 text-sm mt-2">Key terms identified</p>
          </div>
        </div>

        {/* Keywords Section */}
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl mb-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-blue-400">🏷️</span>
            Keywords
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {analytics.keywords.map((keyword, i) => (
              <div
                key={i}
                className="bg-blue-900 border border-blue-700 rounded-lg p-4 text-center hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <p className="text-blue-200 font-semibold">{keyword}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Topics Section */}
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="text-purple-400" size={24} />
            Topics
          </h2>
          <div className="space-y-3">
            {analytics.topics.map((topic, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-purple-500 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold mt-1">{i + 1}.</span>
                  <p className="text-slate-200">{topic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Info Card */}
        <div className="mt-8 bg-slate-750 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-400 text-sm">Document ID</p>
          <p className="text-slate-300 font-mono text-sm mt-1">{documentId}</p>
        </div>
      </div>
    </div>
  );
}
