import { z } from 'zod';

// Reusable primitives
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// Search
export const SearchRequestSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Query is required').max(1000),
    documentIds: z.array(objectIdSchema).optional(),
    limit: z.number().int().min(1).max(20).optional().default(5),
  }),
});

// Analysis
export const AnalysisStartSchema = z.object({
  body: z.object({
    documentId: objectIdSchema,
    fullText: z.string().optional(),
  }),
});

// Comparison
export const ComparisonRequestSchema = z.object({
  body: z.object({
    documentIds: z.array(objectIdSchema).min(2, 'At least two document IDs required').max(5),
  }),
});

// Chat
export const ChatRequestSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1).max(128),
    query: z.string().min(1, 'Query cannot be empty').max(2000),
    documentIds: z.array(objectIdSchema).optional(),
  }),
});

// Upload document (applied alongside multer)
export const UploadDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(300).optional(),
    authors: z.string().optional(),  // Comma-separated string from form
    year: z.coerce.number().int().min(1900).max(2100).optional(),
  }),
});

// Auth — Firebase token login/register
export const AuthRegisterSchema = z.object({
  body: z.object({
    firebaseUid: z.string().min(20),
    email: z.string().email(),
    name: z.string().min(1).max(200).optional(),
  }),
});

// Paginated list query
export const PaginatedQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});
