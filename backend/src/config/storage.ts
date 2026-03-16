import { Storage, Bucket } from '@google-cloud/storage';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Local storage fallback (dev, or when GCS is not configured)
const LOCAL_STORAGE_ROOT = process.env.LOCAL_STORAGE_PATH
  ? path.resolve(process.env.LOCAL_STORAGE_PATH)
  : path.resolve(process.cwd(), 'local_storage');

let storage: Storage | null = null;
let bucket: Bucket | LocalBucket | null = null;
let isGcs = false;

class LocalBucket {
  public name = 'local';

  constructor(private root: string) {
    fs.mkdirSync(this.root, { recursive: true });
  }

  file(filePath: string) {
    const fullPath = path.join(this.root, filePath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });

    return {
      name: filePath,
      async save(buffer: Buffer, options?: { metadata?: any }) {
        await fs.promises.writeFile(fullPath, buffer);
      },
      async download() {
        const buffer = await fs.promises.readFile(fullPath);
        return [buffer];
      },
      async delete(options?: any) {
        try {
          await fs.promises.unlink(fullPath);
        } catch (err: any) {
          if (err.code === 'ENOENT') return;
          throw err;
        }
      },
    };
  }
}

export const initializeStorage = () => {
  // In development, always use local storage to avoid GCS issues
  if (process.env.NODE_ENV === 'development') {
    bucket = new LocalBucket(LOCAL_STORAGE_ROOT);
    isGcs = false;
    logger.info('Using local storage for development');
    return;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const bucketName = process.env.STORAGE_BUCKET;

    if (projectId && clientEmail && privateKey && bucketName) {
      storage = new Storage({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        projectId,
      });
      bucket = storage.bucket(bucketName);
      isGcs = true;
      logger.info('Google Cloud Storage initialized successfully (bucket: %s)', bucketName);
    } else {
      // Fallback to local filesystem storage for development / missing config.
      bucket = new LocalBucket(LOCAL_STORAGE_ROOT);
      isGcs = false;
      logger.warn('Google Cloud Storage not configured; falling back to local storage at %s', LOCAL_STORAGE_ROOT);
    }
  } catch (error) {
    logger.error('Storage initialization error:', error);
    // Ensure we still have a usable local storage option
    bucket = new LocalBucket(LOCAL_STORAGE_ROOT);
    isGcs = false;
    logger.warn('Falling back to local storage at %s', LOCAL_STORAGE_ROOT);
  }
};

export const getStorageBucket = () => {
  if (!bucket) {
    throw new Error('Storage is not initialized');
  }
  return bucket;
};

export const getStorageUrl = (storagePath: string) => {
  const bucketName = isGcs && bucket ? (bucket as Bucket).name : 'local';
  if (isGcs) {
    return `https://storage.googleapis.com/${bucketName}/${storagePath}`;
  }
  return `local://${storagePath}`;
};

export const normalizeStoragePath = (storageUrl: string): string => {
  if (storageUrl.startsWith('https://storage.googleapis.com/')) {
    const parts = storageUrl.split('/');
    return parts.slice(4).join('/');
  }
  if (storageUrl.startsWith('local://')) {
    return storageUrl.replace(/^local:\/\//, '');
  }
  return storageUrl;
};
