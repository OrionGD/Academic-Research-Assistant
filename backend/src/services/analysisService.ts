import { Schema } from '@google/genai';
import { callGeminiStructured } from './geminiService';

export interface AnalysisOutput {
  summary: string;
  methodology: string;
  keyContributions: string[];
  keyConcepts: { term: string; definition: string }[];
  importantQuotes: { text: string; page: string | number }[];
  results: string;
  limitations: string;
  confidenceScore?: number;
}

const analysisSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    methodology: { type: 'string' },
    keyContributions: { type: 'array', items: { type: 'string' } },
    keyConcepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          definition: { type: 'string' }
        },
        required: ['term', 'definition']
      }
    },
    importantQuotes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          page: { type: 'string' }
        },
        required: ['text', 'page']
      }
    },
    results: { type: 'string' },
    limitations: { type: 'string' },
    confidenceScore: { type: 'number' },
  },
  required: ['summary', 'methodology', 'keyContributions', 'keyConcepts', 'importantQuotes', 'results'],
};

const ANALYSIS_PROMPT = (text: string) => `You are an expert academic paper reviewer.
Analyze the following research paper text and extract the following structured information:

- summary: A comprehensive 2-3 paragraph overview of the paper
- keyInsights: An array of 5-8 key contributions or findings (each as a short string)
- methodology: Description of the research methods, experiments, or approach
- results: Summary of the main results and quantitative findings
- limitations: Limitations acknowledged or apparent in the paper
- futureWork: Future research directions suggested
- confidenceScore: Your confidence in the accuracy of this analysis (0.0 to 1.0)

Paper Text:
${text.substring(0, 500000)}`;

export const analyzeDocumentText = async (text: string): Promise<AnalysisOutput> => {
  return callGeminiStructured<AnalysisOutput>(
    ANALYSIS_PROMPT(text),
    analysisSchema as Schema,
    'gemini-2.0-flash'
  );
};
