import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import path from 'path';

// Load environment from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

/**
 * Standard Redis connection options for ARAS.
 * Optimized for Redis running in WSL with Node.js on Windows.
 */
export const getRedisOptions = (): RedisOptions => ({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  connectTimeout: 5000,
  family: 4, // Force IPv4 to avoid WSL resolution issues
  maxRetriesPerRequest: null, // Required for BullMQ
});

/**
 * Shared Redis client instance for general caching and health checks.
 */
export const redis = new Redis(getRedisOptions());

// Connection Logging
redis.on('connect', () => {
  logger.info('✓ Redis connected');
});

redis.on('error', (err) => {
  logger.error(`✗ Redis error: ${err.message}`);
});

export default redis;
