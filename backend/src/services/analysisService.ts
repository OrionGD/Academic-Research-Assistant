import { Schema } from '@google/genai';
import { callGeminiStructured } from './geminiService';

export interface AnalysisOutput {
  summary: string;
  keyInsights: string[];
  methodology: string;
  results: string;
  limitations: string;
  futureWork: string;
}

const analysisSchema = {
    type: "object",
    properties: {
        summary: { type: "string" },
        keyInsights: { 
            type: "array",
            items: { type: "string" }
        },
        methodology: { type: "string" },
        results: { type: "string" },
        limitations: { type: "string" },
        futureWork: { type: "string" }
    },
    required: ["summary", "keyInsights", "methodology", "results", "limitations", "futureWork"]
};


export const analyzeDocumentText = async (text: string): Promise<AnalysisOutput> => {
  const prompt = `Analyze the following academic research paper text and extract the requested fields. \n\nPaper Text:\n${text}`;
  
  return callGeminiStructured<AnalysisOutput>(prompt, analysisSchema as Schema, 'gemini-3.1-pro');
};
