import { getStorageBucket } from '../config/storage';
import { logger } from '../utils/logger';

export const downloadFileToBuffer = async (filePath: string): Promise<Buffer> => {
  try {
    const bucket = getStorageBucket();

    let normalizedPath = filePath;

    // Handle URLs from GCS (https://storage.googleapis.com/{bucket}/{path})
    if (normalizedPath.startsWith('https://storage.googleapis.com/')) {
      const parts = normalizedPath.split('/');
      normalizedPath = parts.slice(4).join('/');
    }

    // Handle local file URLs (local://documents/...) for local fallback storage.
    if (normalizedPath.startsWith('local://')) {
      normalizedPath = normalizedPath.replace(/^local:\/\//, '');
    }

    const file = bucket.file(normalizedPath);
    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    logger.error(`Error downloading file ${filePath} from storage:`, error);
    throw new Error('Failed to download file for processing');
  }
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const bucket = getStorageBucket();

    let normalizedPath = filePath;

    // Handle URLs from GCS (https://storage.googleapis.com/{bucket}/{path})
    if (normalizedPath.startsWith('https://storage.googleapis.com/')) {
      const parts = normalizedPath.split('/');
      normalizedPath = parts.slice(4).join('/');
    }

    // Handle local file URLs (local://documents/...) for local fallback storage.
    if (normalizedPath.startsWith('local://')) {
      normalizedPath = normalizedPath.replace(/^local:\/\//, '');
    }

    const file = bucket.file(normalizedPath);
    await file.delete();
    logger.info(`File deleted from storage: ${filePath}`);
  } catch (error) {
    logger.error(`Error deleting file ${filePath} from storage:`, error);
    // Don't throw, as file might not exist or already deleted
  }
};
