/**
 * Document Processor Worker
 *
 * Picks up document-processing jobs from BullMQ.
 * Flow:
 *  1. Download PDF from Google Cloud Storage
 *  2. Forward to ML service /process-document (PDF extraction + chunking + Gemini embeddings)
 *  3. Queue document analysis job with extracted full text
 *  4. Update document status in MongoDB
 *
 * Run as a separate process: npm run workers
 */
import { Worker, Job, Queue } from 'bullmq';
import { DocumentModel } from '../models/Document';
import { downloadFileToBuffer } from '../services/storageService';
import { DOCUMENT_PROCESSING_QUEUE, DOCUMENT_ANALYSIS_QUEUE } from '../queues/queueNames';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

import IORedis from 'ioredis';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
const ML_SERVICE_API_KEY = process.env.ML_SERVICE_API_KEY || '';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const analysisQueue = new Queue(DOCUMENT_ANALYSIS_QUEUE, { connection });

export const documentProcessingQueueName = DOCUMENT_PROCESSING_QUEUE;

export const documentProcessorWorker = new Worker(
  DOCUMENT_PROCESSING_QUEUE,
  async (job: Job) => {
    const { documentId, userId, storagePath } = job.data;
    if (!documentId || !userId || !storagePath) {
      throw new Error('documentId, userId, and storagePath are required');
    }

    logger.info(`[DocumentWorker] Job ${job.id} — processing doc ${documentId}`);
    await job.updateProgress(5);

    // Step 1: Download PDF from GCS
    const pdfBuffer = await downloadFileToBuffer(storagePath);
    await job.updateProgress(20);

    // Step 2: Send to ML service for extraction, chunking, and embedding
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }),
      `document_${documentId}.pdf`
    );
    formData.append(
      'metadata',
      JSON.stringify({ documentId, userId })
    );

    logger.info(`[DocumentWorker] Forwarding doc ${documentId} to ML service`);

    const mlResponse = await fetch(`${ML_SERVICE_URL}/process-document`, {
      method: 'POST',
      headers: { 'X-API-Key': ML_SERVICE_API_KEY },
      body: formData,
      signal: AbortSignal.timeout(300_000), // 5 min timeout for large PDFs
    });

    if (!mlResponse.ok) {
      const errText = await mlResponse.text();
      throw new Error(`ML service processing failed (${mlResponse.status}): ${errText}`);
    }

    const mlResult = await mlResponse.json();
    await job.updateProgress(70);

    logger.info(
      `[DocumentWorker] ML processing done for ${documentId}: ` +
      `${mlResult.chunksProcessed} chunks, ${mlResult.embeddingDimensions} dims`
    );

    // Update document metadata from ML extraction results
    const docUpdate: Record<string, any> = {};
    if (mlResult.pageCount) docUpdate.pageCount = mlResult.pageCount;

    if (Object.keys(docUpdate).length > 0) {
      await DocumentModel.findByIdAndUpdate(documentId, docUpdate);
    }

    // Step 3: Queue analysis job with extracted full text
    const fullText = mlResult.fullText || '';
    await analysisQueue.add(
      'analyze-document',
      { documentId, userId, fullText },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    await job.updateProgress(90);
    logger.info(`[DocumentWorker] Queued analysis for doc ${documentId}`);
    await job.updateProgress(100);
  },
  { connection, concurrency: 2 }
);

documentProcessorWorker.on('completed', (job) =>
  logger.info(`[DocumentWorker] Job ${job.id} completed`)
);

documentProcessorWorker.on('failed', async (job: Job | undefined, err: Error) => {
  logger.error(`[DocumentWorker] Job ${job?.id} failed: ${err.message}`);
  if (job?.data?.documentId) {
    await DocumentModel.findByIdAndUpdate(job.data.documentId, {
      status: 'failed',
      errorMessage: err.message,
    }).catch(() => {});
  }
});

documentProcessorWorker.on('error', (err) =>
  logger.error('[DocumentWorker] Worker error:', err)
);
