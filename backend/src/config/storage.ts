import { Storage } from '@google-cloud/storage';
import { logger } from '../utils/logger';

let storage: Storage | null = null;
let bucketName: string | null = null;

export const initializeStorage = () => {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    bucketName = process.env.STORAGE_BUCKET || null;

    if (!bucketName) {
      logger.warn('STORAGE_BUCKET is not defined in environment variables');
    }

    if (projectId && clientEmail && privateKey) {
      storage = new Storage({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        projectId,
      });
      logger.info('Google Cloud Storage initialized successfully');
    } else {
      logger.warn('Storage credentials are incomplete.');
    }
  } catch (error) {
    logger.error('Storage initialization error:', error);
  }
};

export const getStorageBucket = () => {
  if (!storage || !bucketName) {
    throw new Error('Storage or bucket is not initialized');
  }
  return storage.bucket(bucketName);
};
