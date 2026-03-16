import { Worker, Job } from 'bullmq';
import { METRICS_QUEUE } from '../queues/queueNames';
import { SystemMetrics } from '../models/SystemMetrics';
import { User } from '../models/User';
import { DocumentModel } from '../models/Document';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import IORedis from 'ioredis';

dotenv.config();

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export const metricsCollectorWorker = new Worker(
  METRICS_QUEUE,
  async (job: Job) => {
    logger.info(`[MetricsCollector] Job ${job.id} — collecting system metrics...`);

    const usersCount = await User.countDocuments();
    const docsCount = await DocumentModel.countDocuments({ status: 'completed' });
    const errorsCount = await DocumentModel.countDocuments({ status: 'failed' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await SystemMetrics.findOneAndUpdate(
      { date: today },
      {
        $set: {
          activeUsers: usersCount,
          documentsProcessed: docsCount,
          errorCount: errorsCount,
        },
      },
      { upsert: true, new: true }
    );

    logger.info(`[MetricsCollector] Collected metrics for ${today.toISOString()}`);
  },
  { connection, concurrency: 1 }
);

metricsCollectorWorker.on('completed', (job) =>
  logger.info(`[MetricsCollector] Job ${job.id} done`)
);

metricsCollectorWorker.on('failed', (job: Job | undefined, err: Error) =>
  logger.error(`[MetricsCollector] Job ${job?.id} failed: ${err.message}`)
);

metricsCollectorWorker.on('error', (err) => logger.error('[MetricsCollector] Error:', err));
