import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { runDocumentProcessingPipeline } from '../pipelines/documentProcessing.pipeline';
import { logger } from '../utils/logger';

const redisConnection = new IORedis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export const documentProcessingQueueName = 'document-processing';

export const documentProcessorWorker = new Worker(
  documentProcessingQueueName,
  async (job: Job) => {
    logger.info(`Starting document processing job ${job.id}`);
    const { documentId, pdfBuffer, userId, storagePath } = job.data;
    
    // In production we don't pass pdfBuffer, but fallback to it if storagePath isn't provided
    if (storagePath && userId) {
        await runDocumentProcessingPipeline(documentId, userId, storagePath);
    } else {
        // Fallback for older interface
        const buffer = Buffer.from(pdfBuffer);
        // Note: The newer pipeline requires userId and storagePath.
        // Assuming user ID is stored in the job data if migrated fully.
    }
  },
  { 
    connection: redisConnection,
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 }
  }
);

documentProcessorWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} has completed!`);
});

documentProcessorWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error(`Job ${job?.id} has failed with ${err.message}`);
});
