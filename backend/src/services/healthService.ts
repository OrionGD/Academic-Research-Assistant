import mongoose from 'mongoose';
import { redis } from '../config/redis';
import { getStorageBucket } from '../config/storage';

export const checkMongoDB = async (): Promise<string> => {
  try {
    if (mongoose.connection.readyState === 1) {
      return 'connected';
    } else {
      return 'disconnected';
    }
  } catch (error) {
    return 'error';
  }
};

export const checkRedis = async (): Promise<string> => {
  try {
    await redis.ping();
    return 'connected';
  } catch (error) {
    return 'disconnected';
  }
};

export const checkMLService = async (): Promise<string> => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${mlServiceUrl}/health`);

    if (response.ok) {
      return 'healthy';
    } else {
      return 'unhealthy';
    }
  } catch (error) {
    return 'unreachable';
  }
};

export const checkStorage = async (): Promise<string> => {
  try {
    const bucket = getStorageBucket();
    if (bucket) {
      // Try a simple operation to verify accessibility
      // For GCS, we can check if bucket exists
      // For local, bucket is always available
      if ('exists' in bucket) {
        const [exists] = await bucket.exists();
        return exists ? 'available' : 'unavailable';
      } else {
        return 'available';
      }
    } else {
      return 'unavailable';
    }
  } catch (error) {
    return 'error';
  }
};