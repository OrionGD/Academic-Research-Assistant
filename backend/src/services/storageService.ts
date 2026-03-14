import { getStorageBucket } from '../config/storage';
import { logger } from '../utils/logger';

export const downloadFileToBuffer = async (filePath: string): Promise<Buffer> => {
  try {
    const bucket = getStorageBucket();
    // Assuming filePath is something like "documents/{userId}/{filename}" 
    // If it's a full URL, we'd need to parse it or use axios to download
    // For GCS, reading directly from the bucket using the file object is most efficient
    
    let path = filePath;
    // Strip URL prefix if present
    if (path.startsWith('https://storage.googleapis.com/')) {
        const parts = path.split('/');
        // The path in bucket is everything after the bucket name
        // Parts: ["https:", "", "storage.googleapis.com", "bucket-name", "documents", "userId", "filename"]
        path = parts.slice(4).join('/');
    }

    const file = bucket.file(path);
    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    logger.error(`Error downloading file ${filePath} from storage:`, error);
    throw new Error('Failed to download file for processing');
  }
};
