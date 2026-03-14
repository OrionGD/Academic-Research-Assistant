import { compareDocumentsAnalysis } from '../services/comparisonService';
import { AnalysisResult } from '../models/AnalysisResult';
import { DocumentModel } from '../models/Document';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const runDocumentComparisonPipeline = async (
  documentIds: string[],
  userId: string
) => {
  try {
    const docObjIds = documentIds.map(id => new mongoose.Types.ObjectId(id));
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Step 1: Retrieve analysis results and documents
    const documentsData = await Promise.all(
        docObjIds.map(async (docId) => {
            const doc = await DocumentModel.findOne({ _id: docId, userId: userObjId });
            const analysis = await AnalysisResult.findOne({ documentId: docId });

            if (!doc) {
                throw new Error(`Document ${docId} not found or unauthorized`);
            }
            if (!analysis) {
                // We should theoretically wait or fail, but let's error for now since comparison requires analysis
                throw new Error(`Analysis results not found for document ${docId}. Please ensure it finishes processing first.`);
            }

            return { doc, analysis };
        })
    );

    // Step 2 & 3: Run comparison reasonings
    const comparisonOutput = await compareDocumentsAnalysis(documentsData);

    logger.info(`Document comparison completed for ${documentIds.length} documents.`);

    return comparisonOutput;

  } catch (error: any) {
    logger.error('Document comparison pipeline error:', error);
    throw error;
  }
};
