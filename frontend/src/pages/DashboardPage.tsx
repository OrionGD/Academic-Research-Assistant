import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, MessageSquare, FileText } from 'lucide-react';
import { documentService } from '../../services/api';
import { Document } from '../../types';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const response = await documentService.listDocuments(0, 20);
        setDocuments(response.data.documents || []);
      } catch (err: any) {
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const handleDelete = async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.document_id !== documentId));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError('Failed to delete document');
    }
  };

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const totalKeywords = new Set(documents.flatMap((doc) => doc.keywords)).size;
  const totalTopics = new Set(documents.flatMap((doc) => doc.topics)).size;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-300">Manage your academic documents and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Documents', value: documents.length, icon: '📄' },
            { label: 'Total Chunks', value: totalChunks, icon: '🔗' },
            { label: 'Keywords', value: totalKeywords, icon: '🏷️' },
            { label: 'Topics', value: totalTopics, icon: '🎯' }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
              <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-2xl mt-2">{stat.icon}</p>
            </div>
          ))}
        </div>

        {/* Documents Table */}
        <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Documents</h2>
          </div>

          {error && (
            <div className="p-4 bg-red-900 border-b border-red-700 text-red-200">
              {error}
            </div>
          )}

          {documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400">No documents yet. <span className="text-blue-400 cursor-pointer" onClick={() => navigate('/upload')}>Upload one</span></p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Chunks</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Reading Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Keywords</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Topics</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {documents.map((doc) => (
                    <tr key={doc.document_id} className="hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{doc.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{doc.summary.substring(0, 50)}...</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{doc.chunk_count}</td>
                      <td className="px-6 py-4 text-slate-300">{doc.reading_time} min</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {doc.keywords.slice(0, 2).map((kw, i) => (
                            <span key={i} className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">
                              {kw}
                            </span>
                          ))}
                          {doc.keywords.length > 2 && (
                            <span className="text-slate-400 text-xs">+{doc.keywords.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{doc.topics.join(', ').substring(0, 30)}...</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/chat/${doc.document_id}`)}
                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Chat"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(doc.document_id)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-sm">
              <p className="text-white font-semibold mb-4">Delete this document?</p>
              <p className="text-slate-300 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
