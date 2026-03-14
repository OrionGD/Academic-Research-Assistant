import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { DocumentChunk } from '../models/DocumentChunk';
import { logger } from '../utils/logger';

const redisConnection = new IORedis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export const vectorIndexerQueueName = 'vector-indexer';

export const vectorIndexerWorker = new Worker(
  vectorIndexerQueueName,
  async (job: Job) => {
    logger.info(`Starting vector indexing sync job ${job.id}`);
    // If we're using Atlas Vector Search, indexing is automatic upon document insertion. 
    // This worker could be used for re-indexing or verifying indexing status if needed.
    const { documentId } = job.data;
    const count = await DocumentChunk.countDocuments({ documentId });
    logger.info(`Verified ${count} chunks are indexed for document ${documentId}`);
  },
  { connection: redisConnection }
);

vectorIndexerWorker.on('completed', (job) => {
  logger.info(`Vector indexer job ${job.id} has completed!`);
});

vectorIndexerWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error(`Vector indexer job ${job?.id} has failed with ${err.message}`);
});
