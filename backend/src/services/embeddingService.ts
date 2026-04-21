import { getGeminiClient } from '../config/gemini';
import { logger } from '../utils/logger';

// Primary: gemini-embedding-2-preview (Matryoshka, dim=768)
// Fallback: gemini-embedding-001
const EMBEDDING_MODEL = 'gemini-embedding-2-preview';

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const client = getGeminiClient();

    const response = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error('No embedding returned from Gemini');
    }

    return values;
  } catch (error: any) {
    logger.error('Embedding Generation Error:', error.message || error);
    throw new Error('Failed to generate embedding');
  }
};
