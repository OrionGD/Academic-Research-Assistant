import React, { useState } from 'react';
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { documentService } from '../../services/api';
import { UploadResponse } from '../../types';

export function UploadPage() {
  const [uploadMethod, setUploadMethod] = useState<'pdf' | 'url' | 'text'>('pdf');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');

  const handleUploadPDF = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const response = await documentService.uploadPDF(file, title || file.name);
      setUploadProgress(response.data);
      setFile(null);
      setTitle('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error uploading PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadURL = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const response = await documentService.uploadURL(url, title);
      setUploadProgress(response.data);
      setUrl('');
      setTitle('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error uploading from URL');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadText = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const response = await documentService.uploadText(text, title);
      setUploadProgress(response.data);
      setText('');
      setTitle('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error uploading text');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Upload Document</h1>
          <p className="text-slate-300">Upload academic documents for AI analysis</p>
        </div>

        {/* Upload Method Tabs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(['pdf', 'url', 'text'] as const).map((method) => (
            <button
              key={method}
              onClick={() => setUploadMethod(method)}
              className={`p-4 rounded-lg font-semibold transition-all ${
                uploadMethod === method
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {method === 'pdf' && '📄 Upload PDF'}
              {method === 'url' && '🔗 From URL'}
              {method === 'text' && '📝 Raw Text'}
            </button>
          ))}
        </div>

        {/* Upload Form */}
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Document Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Machine Learning Research Paper"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Method-specific Input */}
          {uploadMethod === 'pdf' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-4">
                Select PDF File
              </label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('pdf-input')?.click()}>
                <FileText className="mx-auto mb-4 text-slate-400" size={48} />
                <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
                <p className="text-slate-500 text-sm">PDF files only</p>
                {file && <p className="text-blue-400 mt-4 font-medium">{file.name}</p>}
                <input
                  id="pdf-input"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  hidden
                />
              </div>
            </div>
          )}

          {uploadMethod === 'url' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Document URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/document"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {uploadMethod === 'text' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Document Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or enter your document text here..."
                rows={10}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg flex gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={uploadMethod === 'pdf' ? handleUploadPDF : uploadMethod === 'url' ? handleUploadURL : handleUploadText}
            disabled={uploading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>

        {/* Success Display */}
        {uploadProgress && (
          <div className="mt-8 bg-green-900 border border-green-700 rounded-lg p-6 shadow-xl">
            <div className="flex gap-4">
              <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={32} />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-300 mb-3">Document Processed Successfully!</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-200 font-medium">Title</p>
                    <p className="text-slate-300">{uploadProgress.title}</p>
                  </div>
                  <div>
                    <p className="text-green-200 font-medium">Chunks</p>
                    <p className="text-slate-300">{uploadProgress.chunk_count}</p>
                  </div>
                  <div>
                    <p className="text-green-200 font-medium">Reading Time</p>
                    <p className="text-slate-300">{uploadProgress.reading_time} min</p>
                  </div>
                  <div>
                    <p className="text-green-200 font-medium">Document ID</p>
                    <p className="text-slate-300 font-mono text-xs">{uploadProgress.document_id.substring(0, 12)}...</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-green-200 font-medium mb-2">Summary</p>
                  <p className="text-slate-300 text-sm">{uploadProgress.summary}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {uploadProgress.keywords.map((keyword, i) => (
                    <span key={i} className="bg-green-800 text-green-200 px-3 py-1 rounded-full text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
