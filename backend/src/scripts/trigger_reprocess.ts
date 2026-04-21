import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import path from 'path';
import * as dotenv from 'dotenv';
import { DocumentModel } from '../models/Document';

// Load Environment from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const DOCUMENT_PROCESSING_QUEUE = 'document-processing';

async function triggerReprocess() {
  const documentId = '69e08d33e9e54d8f55b7c6a2';
  
  try {
    console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI as string);
    
    const doc = await DocumentModel.findById(documentId);
    if (!doc) {
      console.error('Document not found');
      process.exit(1);
    }
    
    const userId = doc.userId.toString();
    const storageUrl = doc.storageUrl;
    const storagePath = storageUrl.startsWith('local://') 
      ? storageUrl.replace('local://', '') 
      : storageUrl.split('/').slice(4).join('/');

    console.log(`Triggering reprocess for doc ${documentId}, user ${userId}, path ${storagePath}`);

    // 2. Reset status in DB
    await DocumentModel.findByIdAndUpdate(documentId, {
        status: 'processing',
        errorMessage: undefined,
    });

    // 3. Add to BullMQ
    const redisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };
    const connection = new IORedis(redisOptions);
    const docQueue = new Queue(DOCUMENT_PROCESSING_QUEUE, { connection });

    await docQueue.add(
      'process-document',
      { documentId, userId, storagePath },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );

    console.log('Successfully queued job!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

triggerReprocess();
