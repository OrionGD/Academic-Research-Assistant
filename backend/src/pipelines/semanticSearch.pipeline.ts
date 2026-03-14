import { searchSimilarChunks } from '../services/vectorSearchService';
import { callGeminiStructured } from '../services/geminiService';
import { Schema } from '@google/genai';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export interface SearchResultOutput {
  results: {
    documentId: string;
    text: string;
    relevanceReason: string;
  }[];
}

const rerankSchema = {
    type: "object",
    properties: {
        results: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    chunkIndex: { type: "number" },
                    relevanceReason: { type: "string" }
                },
                required: ["chunkIndex", "relevanceReason"]
            }
        }
    },
    required: ["results"]
};

export const runSemanticSearchPipeline = async (
  query: string,
  userId: mongoose.Types.ObjectId,
  userDocIds?: mongoose.Types.ObjectId[],
  limit = 5
) => {
  try {
    // Step 1-3: Vector Search
    const topChunks = await searchSimilarChunks(query, userId, userDocIds, limit);

    if (topChunks.length === 0) {
      return { results: [] };
    }

    // Step 4: Rerank results using Gemini reasoning
    const chunksText = topChunks.map((c, i) => `[Index ${i}] Document ID: ${c.chunk.documentId}\nText: ${c.chunk.text}`).join('\n\n');

    const prompt = `You are a search ranking assistant. Analyze the user's query and the retrieved document chunks. Determine how relevant each chunk is to the query and provide a brief reasoning. Return an array of the indices and their relevance reason.\n\nQuery: ${query}\n\nChunks:\n${chunksText}`;

    const reranked = await callGeminiStructured<{ results: { chunkIndex: number, relevanceReason: string }[] }>(prompt, rerankSchema as Schema, 'gemini-3.1-pro');

    // Build final output
    const finalResults = reranked.results.map(r => {
        const matchingChunk = topChunks[r.chunkIndex];
        return {
            documentId: matchingChunk ? matchingChunk.chunk.documentId.toString() : '',
            text: matchingChunk ? matchingChunk.chunk.text : '',
            relevanceReason: r.relevanceReason
        };
    }).filter(r => r.documentId !== '');

    logger.info(`Semantic search pipeline executed successfully for query: "${query}"`);

    return { results: finalResults };

  } catch (error: any) {
    logger.error('Semantic search pipeline error:', error);
    throw new Error('Failed to execute semantic search');
  }
};
