export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  plan: string;
}

export interface Document {
  id: string;
  title: string;
  authors: string[];
  year: number;
  uploadDate: string;
  abstract?: string;
  keywords?: string[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  fileUrl: string;
  userId: string;
  mimeType?: string;
  canView?: boolean;
  canDownload?: boolean;
  lastViewedAt?: string;
  downloadCount?: number;
  analysis?: AnalysisResult;
  pageCount?: number;
  content?: string;
}

export interface DocumentViewMetadata {
  documentId: string;
  name: string;
  mimeType: string;
  viewUrl: string;
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
  chunkIndex: number;
  fullText: string;
  pageNumber?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: { documentId: string; title: string; snippet: string; index?: number; pageNumber?: number }[];
}

export interface ChatResponse {
  message: ChatMessage;
  suggestedQuestions?: string[];
}

export interface SystemMetrics {
  totalUsers?: number;
  totalDocuments: number;
  activeUsersToday?: number;
  apiRequestsLast24h: number;
  storageUsedBytes?: number;
  pendingUpgrades: number;
  requestsByDay?: { date: string; count: number }[];
  platformStats?: {
    userDistribution: { _id: string, count: number }[];
    totalStorage: number;
    totalAnalyses: number;
    totalMessages: number;
    totalUsers: number;
    activeUsersToday: number;
  };
}

export interface AnalysisResult {
  documentId: string;
  summary: string;
  keyInsights: string[];
  methodology: string;
  results: string;
  limitations: string;
  futureWork: string;
  complexity: string;
  readingTime: number;
  keyThemesCount: number;
  confidenceScore: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'ongoing' | 'completed' | 'on-hold';
  supervisors: User[];
  collaborators: User[];
  milestones: { title: string; dueDate: string; completed: boolean }[];
  associatedDocuments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ComparisonFeature {
  name: string;
  values: Record<string, string>;
}

export interface ComparisonTableRow {
  dimension: string;
  paperA: string;
  paperB: string;
  comparison: string;
}

export interface DocumentComparisonResult {
  summary: string;
  commonThemes: string[];
  conflictingFindings: string[];
  researchGaps: string[];
  novelOpportunities: string[];
  features: ComparisonFeature[];
  comparisonTable: ComparisonTableRow[];
  aiGenerated: boolean;
}

export interface SystemSettings {
  require2FA: boolean;
  restrictAIToPeerReviewed: boolean;
  language: string;
  maintenanceMode: boolean;
  allowedUploadOrigins: string[];
  maxUploadMB: number;
}
