import { Schema } from '@google/genai';
import { callGeminiStructured } from './geminiService';
import { IAnalysisResult } from '../models/AnalysisResult';
import { IDocument } from '../models/Document';

export interface ComparisonOutput {
  sharedThemes: string[];
  methodologicalDifferences: string;
  conflictingResults: string;
  overallConclusion: string;
}

const comparisonSchema = {
    type: "object",
    properties: {
        sharedThemes: { 
            type: "array",
            items: { type: "string" }
        },
        methodologicalDifferences: { type: "string" },
        conflictingResults: { type: "string" },
        overallConclusion: { type: "string" }
    },
    required: ["sharedThemes", "methodologicalDifferences", "conflictingResults", "overallConclusion"]
};

export const compareDocumentsAnalysis = async (documentsData: { doc: IDocument, analysis: IAnalysisResult }[]): Promise<ComparisonOutput> => {
  
  const docsText = documentsData.map((d, i) => `Document ${i+1}: ${d.doc.title}\nSummary: ${d.analysis.summary}\nKey Insights: ${d.analysis.keyInsights.join(', ')}\nMethodology: ${d.analysis.methodology}\nResults: ${d.analysis.results}\nLimitations: ${d.analysis.limitations}`).join('\n\n---\n\n');

  const prompt = `Compare the following academic research papers based on their analysis data. Identify shared themes, methodological differences, conflicting results, and an overall conclusion.\n\nData:\n${docsText}`;
  
  return callGeminiStructured<ComparisonOutput>(prompt, comparisonSchema as Schema, 'gemini-3.1-pro');
};
