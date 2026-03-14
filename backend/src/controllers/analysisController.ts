import { Request, Response, NextFunction } from 'express';
import { AnalysisResult } from '../models/AnalysisResult';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { analysisQueueName } from '../workers/analysis.worker';
import { runDocumentComparisonPipeline } from '../pipelines/documentComparison.pipeline';
import { DocumentModel } from '../models/Document';

const redisConnection = new IORedis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
const analysisQueue = new Queue(analysisQueueName, { connection: redisConnection });

export const getAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysis = await AnalysisResult.findOne({ documentId: req.params.id, userId: req.user._id });
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json(analysis);
  } catch (error) {
    next(error);
  }
};

export const startAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId, fullText } = req.body;
    
    if (!fullText) {
       // Ideally we would fetch the text from chunks or storage.
       return res.status(400).json({ error: 'Full text must be provided to start analysis' });
    }

    await analysisQueue.add('analyze-document', {
      documentId,
      userId: req.user._id.toString(),
      fullText
    });

    res.status(202).json({ message: 'Analysis queued successfully' });
  } catch (error) {
    next(error);
  }
};

export const compareDocumentsAnalysisEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { documentIds } = req.body;
      if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
          return res.status(400).json({ error: 'At least two document IDs are required for comparison' });
      }

      const result = await runDocumentComparisonPipeline(documentIds, req.user._id.toString());
      res.json(result);
  } catch (error) {
      next(error);
  }
}
