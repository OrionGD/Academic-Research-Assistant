import { getGeminiClient } from '../config/gemini';
import { logger } from '../utils/logger';

const DEFAULT_MODEL    = 'gemini-2.5-flash';
const EMBEDDING_MODEL  = 'gemini-embedding-2-preview';

// Allowed model whitelist (prevents silent API breakage)
const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite'
]);

// ─────────────────────────────────────────────
// ENV VALIDATION (COMPULSORY)
// ─────────────────────────────────────────────
const validateGeminiAccess = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('SYSTEM NOT INITIALIZED: GEMINI_API_KEY missing');
  }
};

// ─────────────────────────────────────────────
// GENERATIVE CALL
// Uses: client.models.generateContent()   (@google/genai SDK)
// ─────────────────────────────────────────────
export const callGemini = async (
  prompt: string,
  modelName: string = DEFAULT_MODEL
): Promise<string> => {
  try {
    validateGeminiAccess();

    if (!ALLOWED_MODELS.has(modelName)) {
      logger.warn(`Invalid model requested: ${modelName}, fallback to default`);
      modelName = DEFAULT_MODEL;
    }

    const client = getGeminiClient();

    const result = await client.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return result.text ?? '';
  } catch (error) {
    logger.error('Gemini API Error:', error);
    throw new Error('Gemini generation failed');
  }
};

// ─────────────────────────────────────────────
// STRUCTURED OUTPUT (JSON)
// Uses: client.models.generateContent() with responseMimeType
// ─────────────────────────────────────────────
export const callGeminiStructured = async <T>(
  prompt: string,
  schema: any,
  modelName: string = DEFAULT_MODEL
): Promise<T> => {
  try {
    validateGeminiAccess();

    const client = getGeminiClient();

    const result = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const jsonString = result.text ?? '{}';
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logger.error('Gemini Structured Output Error:', error);
    throw new Error('Structured Gemini generation failed');
  }
};

// ─────────────────────────────────────────────
// STREAMING
// Uses: client.models.generateContentStream()
// ─────────────────────────────────────────────
export const callGeminiStream = async (
  prompt: string,
  modelName: string = DEFAULT_MODEL
) => {
  try {
    validateGeminiAccess();

    const client = getGeminiClient();

    const stream = await client.models.generateContentStream({
      model: modelName,
      contents: prompt,
    });

    return stream;
  } catch (error) {
    logger.error('Gemini Stream Error:', error);
    throw new Error('Gemini streaming failed');
  }
};

// ─────────────────────────────────────────────
// EMBEDDING  (ARAS RAG — critical path)
// Provider:  gemini-embedding-2-preview (dim=768)
// Uses:      client.models.embedContent()
// ─────────────────────────────────────────────
export const callGeminiEmbedding = async (text: string): Promise<number[]> => {
  try {
    validateGeminiAccess();

    const client = getGeminiClient();

    const response = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: 768,   // Matryoshka — 768 is the ARAS standard
      },
    });

    return response.embeddings?.[0]?.values ?? [];
  } catch (error) {
    logger.error('Gemini Embedding Error:', error);
    throw new Error('Embedding generation failed');
  }
};