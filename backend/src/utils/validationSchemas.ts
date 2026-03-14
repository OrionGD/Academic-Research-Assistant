import { z } from 'zod';

// Reusable schemas
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const SearchRequestSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Query is required').max(1000),
    documentIds: z.array(objectIdSchema).optional()
  })
});

export const AnalysisStartSchema = z.object({
  body: z.object({
    documentId: objectIdSchema,
    fullText: z.string().min(1, 'Full text or reference is required')
  })
});

export const ComparisonRequestSchema = z.object({
  body: z.object({
    documentIds: z.array(objectIdSchema).min(2, 'At least two document IDs are required')
  })
});

export const ChatRequestSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    query: z.string().min(1, 'Query cannot be empty').max(2000),
    documentIds: z.array(objectIdSchema).optional()
  })
});
