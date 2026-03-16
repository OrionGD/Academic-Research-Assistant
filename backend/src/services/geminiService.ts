import { getGeminiClient } from '../config/gemini';
import { logger } from '../utils/logger';

const DEFAULT_MODEL = 'gemini-1.5-flash';

export const callGemini = async (prompt: string, model: string = DEFAULT_MODEL): Promise<string> => {
  try {
    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model,
      contents: prompt,
    });
    return result.text || '';
  } catch (error) {
    logger.error('Gemini API Error:', error);
    throw new Error('Failed to generate content from Gemini');
  }
};

export const callGeminiStructured = async <T>(prompt: string, schema: any, model: string = DEFAULT_MODEL): Promise<T> => {
  try {
    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });
    const jsonString = result.text || '{}';
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logger.error('Gemini Structured Output Error:', error);
    throw new Error('Failed to generate structured content from Gemini');
  }
};

export const callGeminiStream = async (prompt: string, model: string = DEFAULT_MODEL) => {
  try {
    const client = getGeminiClient();
    const responseStream = await client.models.generateContentStream({
      model,
      contents: prompt,
    });
    return responseStream;
  } catch (error) {
    logger.error('Gemini Stream Error:', error);
    throw new Error('Failed to generate stream from Gemini');
  }
};
