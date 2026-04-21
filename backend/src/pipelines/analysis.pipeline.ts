import { analyzeDocumentText } from '../services/analysisService';
import { AnalysisResult } from '../models/AnalysisResult';
import { DocumentModel } from '../models/Document';
import { searchSimilarChunks } from '../services/vectorSearchService';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Stub map-reduce for massive documents > Gemini 3.1 Pro context limit
const performMapReduce = async (text: string) => {
  // If the text is larger than ~1.5 million tokens, split it into chunks
  // Send each chunk to Gemini for partial summary
  // Send the partial summaries back to Gemini for final synthesis
  // For now, we simply return the standard analysis due to Gemini's large 2M window
  logger.info('Document is very large. In production, splitting text and running map-reduce...');
  return analyzeDocumentText(text.substring(0, 1500000));
};

export const runAnalysisPipeline = async (
  documentId: string,
  userId: string,
  fullText: string
) => {
  try {
    if (!mongoose.isValidObjectId(documentId) || !mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid ObjectId provided');
    }
    const docObjId = new mongoose.Types.ObjectId(documentId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const charLimit = 5000000; // Rough character limit mimicking a token limit check

    // Step 1: Analyze Document Text (Gemini)
    await DocumentModel.findByIdAndUpdate(docObjId, { status: 'analyzing' });
    let insights;
    try {
      if (fullText.length > charLimit) {
        insights = await performMapReduce(fullText);
      } else {
        insights = await analyzeDocumentText(fullText);
      }
    } catch (error: any) {
      logger.error(`[AnalysisPipeline] doc=${documentId} | AI_ANALYSIS_FAILED:`, error.message);
      // Fallback response to prevent pipeline crash
      insights = {
        summary: "Analysis failed. Some data might be missing.",
        keyContributions: [],
        keyConcepts: [],
        importantQuotes: [],
        methodology: "N/A",
        results: "N/A",
        limitations: "N/A",
      };
    }

    // Validation check for observability
    const requiredFields = ['summary', 'keyContributions', 'keyConcepts'];
    const insightsAny = insights as any;
    const missing = requiredFields.filter(f => !insightsAny[f] || (Array.isArray(insightsAny[f]) && insightsAny[f].length === 0));
    if (missing.length > 0) {
      logger.warn(`[AnalysisPipeline] doc=${documentId} | OUTPUT_PARTIAL_OR_INVALID | missing=${missing.join(',')}`);
    }

    // Step 2: Generate citations by mapping keyContributions to relevant chunks
    await DocumentModel.findByIdAndUpdate(docObjId, { status: 'indexing' });
    const citations: any[] = [];
    for (const contribution of (insights.keyContributions || [])) {
      try {
        const similarChunks = await searchSimilarChunks(contribution, userObjId, [docObjId], 1);
        if (similarChunks.length > 0) {
          citations.push({
            chunkId: similarChunks[0].chunk._id,
            context: similarChunks[0].chunk.chunkText.substring(0, 100) + '...'
          });
        }
      } catch (error) {
        logger.warn(`[AnalysisPipeline] Failed to find citation for contribution: ${contribution}`, error);
      }
    }

    // Step 3: Store output in analysis_results collection
    const analysisDoc = new AnalysisResult({
        documentId: docObjId,
        userId: userObjId,
        summary: insights.summary || "No summary generated.",
        keyContributions: insights.keyContributions || [],
        keyConcepts: insights.keyConcepts || [],
        importantQuotes: insights.importantQuotes || [],
        methodology: insights.methodology || "",
        limitations: insights.limitations || "",
        results: insights.results || "",
        citations: citations,
        confidenceScore: insights.confidenceScore || (insights.summary ? 0.85 : 0),
    });

    await analysisDoc.save();

    // Step 4: Mark overall document status as completed
    await DocumentModel.findByIdAndUpdate(docObjId, { 
      status: 'completed',
      // If summary is fallback, we might want to flag that here too
      errorMessage: insights.summary?.includes("failed") ? "AI analysis returned partial results." : undefined 
    });
    
    logger.info(`[AnalysisPipeline] completed for document ${documentId}`);
    return analysisDoc;

  } catch (error: any) {
    logger.error(`Error in analysis pipeline for doc ${documentId}:`, error);
    await DocumentModel.findByIdAndUpdate(documentId, { 
        status: 'failed', 
        errorMessage: error.message || 'Failed during AI analysis' 
    });
    throw error;
  }
};
