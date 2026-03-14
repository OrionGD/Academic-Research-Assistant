import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
};
