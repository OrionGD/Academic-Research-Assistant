import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { runAnalysisPipeline } from '../pipelines/analysis.pipeline';
import { logger } from '../utils/logger';

const redisConnection = new IORedis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export const analysisQueueName = 'document-analysis';

export const analysisWorker = new Worker(
  analysisQueueName,
  async (job: Job) => {
    logger.info(`Starting analysis job ${job.id}`);
    const { documentId, userId, fullText } = job.data;
    
    await runAnalysisPipeline(documentId, userId, fullText);
  },
  { 
    connection: redisConnection,
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 }
  }
);

analysisWorker.on('completed', (job) => {
  logger.info(`Analysis Job ${job.id} has completed!`);
});

analysisWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error(`Analysis Job ${job?.id} has failed with ${err.message}`);
});
