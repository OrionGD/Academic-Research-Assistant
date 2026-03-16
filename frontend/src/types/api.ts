/**
 * API Type Definitions
 */

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role?: 'user' | 'admin';
  createdAt?: string;
}

export interface UpdateUserPayload {
  displayName?: string;
  photoURL?: string;
}

export interface Document {
  id: string;
  title: string;
  authors: string[];
  year: number;
  uploadDate: string;
  abstract?: string;
  keywords?: string[];
  status: 'processing' | 'completed' | 'error';
  fileUrl: string;
  userId: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  pageNumber: number;
  relevanceScore?: number;
}

export interface SearchFilters {
  author?: string;
  journal?: string;
  year?: number;
}

export interface SearchResult {
  documentId: string;
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
  citations?: { documentId: string; title: string; snippet: string }[];
}

export interface ChatResponse {
  message: ChatMessage;
  suggestedQuestions?: string[];
}

export interface SystemMetrics {
  totalUsers: number;
  totalDocuments: number;
  activeUsersToday: number;
  apiRequestsLast24h: number;
  storageUsedBytes: number;
  requestsByDay?: { date: string; count: number }[];
}

export interface AnalysisResult {
  documentId: string;
  summary: string;
  keyInsights: string[];
  methodology: string;
  results: string;
  limitations: string[];
  suggestedFutureWork: string[];
  confidenceScore: number;
}
