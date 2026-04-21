/**
 * API Type Definitions
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  displayName: string | null;
  photoURL: string | null;
  institution?: string;
  field?: string;
  bio?: string;
  role?: 'user' | 'admin' | 'researcher' | 'reviewer';
  // SaaS fields
  planTier: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  plan: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO' | 'premium';
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'trialing' | 'inactive';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  monthlyUploads?: number;
  monthlyQueries?: number;
  storageUsedMb?: number;
  upgradeRequestStatus: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface UsageMeter {
  used: number;
  limit: number;    // -1 = unlimited
  percentage: number;
}

export interface UsageSummary {
  planTier: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  uploads: UsageMeter;
  queries: UsageMeter;
  storage: { usedMb: number; limitMb: number; percentage: number };
  currentPeriodEnd: string | null;
}

export interface SubscriptionInfo {
  planTier: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingInterval: 'month' | 'year' | null;
  amountInr: number;
}

export interface ApiKeyInfo {
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface PlanLimits {
  maxMonthlyUploads: number;
  maxStorageMb: number;
  maxMonthlyQueries: number;
  apiAccess: boolean;
  maxApiKeys: number;
}

export interface UpdateUserPayload {
  name?: string;
  displayName?: string;
  photoURL?: string;
  institution?: string;
  field?: string;
  bio?: string;
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
  mimeType?: string;
  canView?: boolean;
  canDownload?: boolean;
  lastViewedAt?: string;
  downloadCount?: number;
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
  limitations: string[];
  suggestedFutureWork: string[];
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

export interface SystemSettings {
  require2FA: boolean;
  restrictAIToPeerReviewed: boolean;
  language: string;
  maintenanceMode: boolean;
  allowedUploadOrigins: string[];
  maxUploadMB: number;
}
