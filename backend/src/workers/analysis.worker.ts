/**
 * Analysis Worker
 *
 * Picks up document-analysis jobs from BullMQ.
 * Runs the Gemini-powered analysis pipeline and stores results in MongoDB.
 *
 * Run as a separate process: npm run workers
 */
import { Worker, Job } from 'bullmq';
import { runAnalysisPipeline } from '../pipelines/analysis.pipeline';
import { DocumentModel } from '../models/Document';
import { DOCUMENT_ANALYSIS_QUEUE } from '../queues/queueNames';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export const analysisQueueName = DOCUMENT_ANALYSIS_QUEUE;

export const analysisWorker = new Worker(
  DOCUMENT_ANALYSIS_QUEUE,
  async (job: Job) => {
    const { documentId, userId, fullText } = job.data;
    if (!documentId || !userId) throw new Error('documentId and userId are required');

    logger.info(`[AnalysisWorker] Job ${job.id} — analyzing doc ${documentId}`);
    await job.updateProgress(10);

    await runAnalysisPipeline(documentId, userId, fullText || '');
    await job.updateProgress(100);

    logger.info(`[AnalysisWorker] Job ${job.id} complete for doc ${documentId}`);
  },
  { connection, concurrency: 3 }
);

analysisWorker.on('completed', (job) =>
  logger.info(`[AnalysisWorker] Job ${job.id} done`)
);

analysisWorker.on('failed', async (job: Job | undefined, err: Error) => {
  logger.error(`[AnalysisWorker] Job ${job?.id} failed: ${err.message}`);
  if (job?.data?.documentId) {
    await DocumentModel.findByIdAndUpdate(job.data.documentId, {
      status: 'failed',
      errorMessage: `Analysis failed: ${err.message}`,
    }).catch(() => {});
  }
});

analysisWorker.on('error', (err) => logger.error('[AnalysisWorker] Error:', err));
