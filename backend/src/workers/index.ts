/**
 * Workers Entry Point
 *
 * Starts all BullMQ workers as a single long-running process.
 * Run with: npm run workers
 *
 * Workers run separately from the Express API server so they don't block
 * HTTP request handling and can be scaled independently.
 */
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/mongodb';
import { initializeFirebase } from '../config/firebase';
import { logger } from '../utils/logger';

// Import workers (they self-register their event listeners on instantiation)
import { documentProcessorWorker } from './documentProcessor.worker';
import { analysisWorker } from './analysis.worker';
import { vectorIndexerWorker } from './vectorIndexer.worker';
import { metricsCollectorWorker } from './metricsCollector.worker';

async function startWorkers() {
  logger.info('Initializing ARAS Workers...');

  await connectDB();
  initializeFirebase();

  logger.info('✓ MongoDB connected');
  logger.info(`✓ DocumentProcessor worker ready (concurrency: 2)`);
  logger.info(`✓ Analysis worker ready (concurrency: 3)`);
  logger.info(`✓ VectorIndexer worker ready (concurrency: 5)`);
  logger.info(`✓ MetricsCollector worker ready (concurrency: 1)`);
  logger.info('All workers running. Waiting for jobs...');
}

startWorkers().catch((err) => {
  logger.error('Failed to start workers:', err);
  process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down workers...');
  await Promise.all([
    documentProcessorWorker.close(),
    analysisWorker.close(),
    vectorIndexerWorker.close(),
    metricsCollectorWorker.close(),
  ]);
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
