import { searchSimilarChunks } from '../services/vectorSearchService';
import { callGeminiStructured } from '../services/geminiService';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface SearchResultItem {
  documentId: string;
  chunkText: string;
  relevanceReason: string;
  chunkIndex: number;
  score: number;
}

export interface SearchResultOutput {
  results: SearchResultItem[];
}

const rerankSchema = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chunkIndex: { type: 'number' },
          relevanceReason: { type: 'string' }
        },
        required: ['chunkIndex', 'relevanceReason']
      }
    }
  },
  required: ['results']
};

export const runSemanticSearchPipeline = async (
  query: string,
  userId: mongoose.Types.ObjectId,
  userDocIds?: mongoose.Types.ObjectId[],
  limit = 5
): Promise<SearchResultOutput> => {
  try {
    // Step 1-3: Vector Search (numCandidates = 200 set in vectorSearchService)
    const topChunks = await searchSimilarChunks(query, userId, userDocIds, limit);

    if (topChunks.length === 0) {
      return { results: [] };
    }

    // Step 4: Rerank with Gemini reasoning
    const chunksText = topChunks
      .map((c, i) => `[Index ${i}] DocumentID: ${c.chunk.documentId}\nText: ${c.chunk.chunkText}`)
      .join('\n\n');

    const prompt = `You are a research document search ranking assistant.
Analyze the user query and the retrieved document chunks below.
Rank them by relevance and explain the reasoning per chunk.
Return all chunks that are at least partially relevant with a clear relevance reason.

Query: "${query}"

Chunks:
${chunksText}`;

    const reranked = await callGeminiStructured<{ results: { chunkIndex: number; relevanceReason: string }[] }>(
      prompt,
      rerankSchema,
      'gemini-1.5-flash'
    );

    const finalResults: SearchResultItem[] = reranked.results
      .map(r => {
        const matchingChunk = topChunks[r.chunkIndex];
        if (!matchingChunk) return null;
        return {
          documentId: matchingChunk.chunk.documentId?.toString() ?? '',
          chunkText: matchingChunk.chunk.chunkText,
          relevanceReason: r.relevanceReason,
          chunkIndex: matchingChunk.chunk.chunkIndex,
          score: matchingChunk.score,
        };
      })
      .filter((r): r is SearchResultItem => r !== null && r.documentId !== '');

    logger.info(`Semantic search pipeline completed for query: "${query}" — ${finalResults.length} results`);
    return { results: finalResults };

  } catch (error: any) {
    logger.error('Semantic search pipeline error:', error);
    throw new Error('Failed to execute semantic search');
  }
};
