/**
 * Vector Indexer Worker
 *
 * Re-indexes document chunks that are missing embeddings or have wrong dimensions.
 * Useful for backfilling after an embedding model change.
 *
 * Run as a separate process: npm run workers
 */
import { Worker, Job } from 'bullmq';
import { DocumentChunk } from '../models/DocumentChunk';
import { generateEmbedding } from '../services/embeddingService';
import { VECTOR_INDEXER_QUEUE } from '../queues/queueNames';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export const vectorIndexerQueueName = VECTOR_INDEXER_QUEUE;

export const vectorIndexerWorker = new Worker(
  VECTOR_INDEXER_QUEUE,
  async (job: Job) => {
    const { chunkId } = job.data;
    if (!chunkId) throw new Error('chunkId is required');

    const chunk = await DocumentChunk.findById(chunkId);
    if (!chunk) throw new Error(`Chunk ${chunkId} not found`);

    // Skip if already indexed with the correct 768-dim embedding
    if (chunk.embedding?.length === 768) {
      logger.info(`[VectorIndexer] Chunk ${chunkId} already indexed (768 dims) — skipping`);
      return;
    }

    const embedding = await generateEmbedding(chunk.chunkText);
    await DocumentChunk.findByIdAndUpdate(chunkId, { embedding });

    logger.info(`[VectorIndexer] Re-indexed chunk ${chunkId} (${embedding.length} dims)`);
  },
  { connection, concurrency: 5 }
);

vectorIndexerWorker.on('completed', (job) =>
  logger.info(`[VectorIndexer] Job ${job.id} done`)
);

vectorIndexerWorker.on('failed', (job: Job | undefined, err: Error) =>
  logger.error(`[VectorIndexer] Job ${job?.id} failed: ${err.message}`)
);

vectorIndexerWorker.on('error', (err) => logger.error('[VectorIndexer] Error:', err));
