export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin' | 'guest';
  planTier: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  isAdmin: boolean;
}

export interface Document {
  document_id: string;
  title: string;
  summary: string;
  keywords: string[];
  topics: string[];
  chunk_count: number;
  reading_time: number;
  file_name?: string;
  source_url?: string;
  created_at?: string;
}

export interface ChatMessage {
  query: string;
  answer: string;
  similarity_scores: number[];
  sources: SourceChunk[];
  model: string;
}

export interface SourceChunk {
  text: string;
  score: number;
  chunk_index: number;
}

export interface Analytics {
  document_id: string;
  title: string;
  summary: string;
  keywords: string[];
  topics: string[];
  chunk_count: number;
  reading_time: number;
}

export interface ChatHistory {
  document_id: string;
  query: string;
  answer: string;
  similarity_scores: number[];
  source_count: number;
  created_at: string;
}

export interface UploadResponse {
  document_id: string;
  title: string;
  chunk_count: number;
  summary: string;
  keywords: string[];
  topics: string[];
  reading_time: number;
  status: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  uploadDate: string;
  abstract: string;
  keywords: string[];
  status: 'processing' | 'completed' | 'error';
  fileUrl: string;
}

export interface AIAnalysis {
  paperId: string;
  summary: string;
  keyContributions: string[];
  methodology: string;
  limitations: string[];
  futureWork: string[];
  keyConcepts: { term: string; definition: string }[];
  importantQuotes: { text: string; page?: number }[];
}

export interface SearchResult {
  paperId: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  authors: string[];
  year: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: { paperId: string; title: string; snippet: string }[];
}

export interface DashboardStats {
  totalPapers: number;
  recentUploads: number;
  aiAnalyses: number;
  searchQueries: number;
  uploadsByMonth: { month: string; count: number }[];
  usageMetrics: { name: string; value: number }[];
}
