import { DocumentChunk, IDocumentChunk } from '../models/DocumentChunk';
import { generateEmbedding } from './embeddingService';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface SearchResult {
  chunk: IDocumentChunk;
  score: number;
}

export const searchSimilarChunks = async (query: string, userId: mongoose.Types.ObjectId, documentIds?: mongoose.Types.ObjectId[], limit = 5): Promise<SearchResult[]> => {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    // Mandatory filter by userId to ensure multi-tenant isolation
    const filter: any = { userId: userId };
    
    if (documentIds && documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    // Using MongoDB Atlas Vector Search ($vectorSearch stage)
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index', // Make sure this matches your Atlas search index name
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
          filter: filter,
        }
      },
      {
        $project: {
          _id: 1,
          documentId: 1,
          chunkIndex: 1,
          text: 1,
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
    throw new Error('Failed to execute vector search');
  }
};
