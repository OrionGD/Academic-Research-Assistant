import { getGeminiClient } from '../config/gemini';
import { logger } from '../utils/logger';

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const client = getGeminiClient();
    const result = await client.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    
    // Fallback if the SDK structure is different
    const embedding = result.embeddings?.[0]?.values;
    if (!embedding) {
      throw new Error('Failed to generate embedding: No embedding returned');
    }
    
    return embedding;
  } catch (error) {
    logger.error('Embedding Generation Error:', error);
    throw new Error('Failed to generate embedding');
  }
};
