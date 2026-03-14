export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
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
