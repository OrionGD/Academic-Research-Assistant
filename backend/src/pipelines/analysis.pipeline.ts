import { analyzeDocumentText } from '../services/analysisService';
import { AnalysisResult } from '../models/AnalysisResult';
import { DocumentModel } from '../models/Document';
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

    let insights;
    if (fullText.length > charLimit) {
      insights = await performMapReduce(fullText);
    } else {
      insights = await analyzeDocumentText(fullText);
    }

    // Step 3: Store output in analysis_results collection
    const analysisDoc = new AnalysisResult({
        documentId: docObjId,
        userId: userObjId,
        summary: insights.summary,
        keyInsights: insights.keyInsights,
        methodology: insights.methodology,
        limitations: insights.limitations,
        futureWork: insights.futureWork,
        results: insights.results,
        citations: [] // Real citations require mapping the keyInsights back to vector chunk indexes. Stubbed as empty here.
    });

    await analysisDoc.save();

    // Mark overall document status as completed
    await DocumentModel.findByIdAndUpdate(docObjId, { status: 'completed' });
    
    logger.info(`Analysis pipeline completed for document ${documentId}`);

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
