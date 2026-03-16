import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import { AnalysisResult } from '../models/AnalysisResult';
import { DocumentModel } from '../models/Document';
import { runDocumentComparisonPipeline } from '../pipelines/documentComparison.pipeline';
import { DOCUMENT_ANALYSIS_QUEUE } from '../queues/queueNames';

// Use host/port connection so REDIS_HOST & REDIS_PORT env vars are respected inside Docker
const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
} as any;
const analysisQueue = new Queue(DOCUMENT_ANALYSIS_QUEUE, { connection });

export const getAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    const analysis = await AnalysisResult.findOne({
      documentId,
      userId: req.user._id,
    }).lean();
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json(analysis);
  } catch (error) {
    next(error);
  }
};

export const startAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId, fullText } = req.body;
    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    // Ensure user owns the document
    const doc = await DocumentModel.findOne({ _id: documentId, userId: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await analysisQueue.add(
      'analyze-document',
      {
        documentId,
        userId: req.user._id.toString(),
        fullText: fullText || '',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    res.status(202).json({ message: 'Analysis queued successfully', documentId });
  } catch (error) {
    next(error);
  }
};

export const compareDocumentsAnalysisEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentIds } = req.body;
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
      return res.status(400).json({ error: 'At least two document IDs are required' });
    }

    const result = await runDocumentComparisonPipeline(documentIds, req.user._id.toString());
    res.json(result);
  } catch (error) {
    next(error);
  }
};
