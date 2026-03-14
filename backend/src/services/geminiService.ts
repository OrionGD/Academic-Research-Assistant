import { getGeminiClient } from '../config/gemini';
import { logger } from '../utils/logger';

export const callGemini = async (prompt: string, model: string = 'gemini-3.1-pro') => {
  try {
    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model,
      contents: prompt,
    });
    
    // Fallback if the SDK is slightly different
    return result.text || '';
  } catch (error) {
    logger.error('Gemini API Error:', error);
    throw new Error('Failed to generate content from Gemini');
  }
};

export const callGeminiStructured = async <T>(prompt: string, schema: any, model: string = 'gemini-3.1-pro'): Promise<T> => {
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
    
    // Parse the JSON output
    const jsonString = result.text || '{}';
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logger.error('Gemini Structured Output Error:', error);
    throw new Error('Failed to generate structured content from Gemini');
  }
};

export const callGeminiStream = async (prompt: string, model: string = 'gemini-3.1-pro') => {
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
