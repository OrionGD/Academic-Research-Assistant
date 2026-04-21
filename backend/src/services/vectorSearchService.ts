import { DocumentChunk, IDocumentChunk } from '../models/DocumentChunk';
import { generateEmbedding } from './embeddingService';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface SearchResult {
  chunk: IDocumentChunk;
  score: number;
}

export const searchSimilarChunks = async (
  query: string,
  userId: mongoose.Types.ObjectId,
  documentIds?: mongoose.Types.ObjectId[],
  limit = 5
): Promise<SearchResult[]> => {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    // Multi-tenant isolation filter: always scope to userId
    const filter: any = { userId };
    if (documentIds && documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    const numCandidates = Math.max(200, limit * 40);

    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates,
          limit,
          filter,
        }
      },
      {
        $project: {
          _id: 1,
          documentId: 1,
          userId: 1,
          chunkIndex: 1,
          chunkText: 1,  // Fixed: was 'text: 1' — field is chunkText
          metadata: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await DocumentChunk.aggregate(pipeline);
    
    return results.map(doc => ({
      chunk: doc as any as IDocumentChunk,
      score: doc.score
    }));
  } catch (error) {
    logger.error('Vector Search Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute vector search: ${errorMessage}`);
  }
};
