import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import { chatService, documentService } from '../../services/api';
import { ChatMessage, Document } from '../../types';
import { useParams, useNavigate } from 'react-router-dom';

export function ChatPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; sources?: any[] }>>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load document details
  useEffect(() => {
    if (!documentId) {
      navigate('/');
      return;
    }

    const loadDocument = async () => {
      try {
        const response = await documentService.getAnalytics(documentId);
        setDocument(response.data);
      } catch (err: any) {
        setError('Failed to load document');
      }
    };

    loadDocument();
  }, [documentId, navigate]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !documentId || loading) return;

    // Add user message
    const userQuery = query;
    setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await chatService.query(documentId, userQuery);
      const chatData = response.data as ChatMessage;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: chatData.answer,
          sources: chatData.sources
        }
      ]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error querying document');
    } finally {
      setLoading(false);
    }
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">{document.title}</h1>
        <div className="flex gap-4 text-sm text-slate-400">
          <span>{document.chunk_count} chunks</span>
          <span>{document.reading_time} min read</span>
          <span>{document.keywords.length} keywords</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-4 text-slate-600" size={48} />
                  <p className="text-slate-400">Ask a question about the document</p>
                  <p className="text-slate-500 text-sm mt-2">Based on: {document.summary.substring(0, 100)}...</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
                        : 'bg-slate-700 text-slate-100 rounded-lg rounded-tl-none'
                    } p-4`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <p className="text-xs font-semibold opacity-70 mb-2">Sources:</p>
                        {msg.sources.map((source, j) => (
                          <div
                            key={j}
                            className={`text-xs p-2 rounded mb-1 ${
                              msg.role === 'user' ? 'bg-blue-700' : 'bg-slate-600'
                            }`}
                          >
                            <p>{source.text.substring(0, 100)}...</p>
                            <p className="opacity-70 mt-1">Relevance: {(source.score * 100).toFixed(0)}%</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-100 rounded-lg rounded-tl-none p-4">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-4 p-4 bg-red-900 border border-red-700 rounded-lg flex gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-6 border-t border-slate-700">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Document Info */}
        <div className="w-64 border-l border-slate-700 bg-slate-750 p-6 overflow-y-auto hidden lg:block">
          <h3 className="font-bold text-white mb-4">Document Info</h3>
          
          <div className="mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Summary</p>
            <p className="text-sm text-slate-300">{document.summary}</p>
          </div>

          <div className="mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {document.keywords.map((kw, i) => (
                <span key={i} className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Topics</p>
            <div className="space-y-2">
              {document.topics.map((topic, i) => (
                <div key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
