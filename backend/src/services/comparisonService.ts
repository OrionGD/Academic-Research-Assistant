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
  type: 'object',
  properties: {
    sharedThemes: {
      type: 'array',
      items: { type: 'string' },
    },
    methodologicalDifferences: { type: 'string' },
    conflictingResults: { type: 'string' },
    overallConclusion: { type: 'string' },
  },
  required: ['sharedThemes', 'methodologicalDifferences', 'conflictingResults', 'overallConclusion'],
};

export const compareDocumentsAnalysis = async (
  documentsData: { doc: IDocument; analysis: IAnalysisResult }[]
): Promise<ComparisonOutput> => {
  const docsText = documentsData
    .map(
      (d, i) =>
        `Document ${i + 1}: ${d.doc.title}\n` +
        `Summary: ${d.analysis.summary}\n` +
        `Key Contributions: ${d.analysis.keyContributions.join(', ')}\n` +
        `Methodology: ${d.analysis.methodology}\n` +
        `Results: ${d.analysis.results}\n` +
        `Limitations: ${d.analysis.limitations}`
    )
    .join('\n\n---\n\n');

  const prompt = `Compare the following academic research papers based on their analysis data. ` +
    `Identify shared themes, methodological differences, conflicting results, and provide an overall conclusion.\n\n` +
    `Data:\n${docsText}`;

  return callGeminiStructured<ComparisonOutput>(prompt, comparisonSchema as Schema, 'gemini-2.0-flash');
};
