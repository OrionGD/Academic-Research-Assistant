const mongoose = require('mongoose');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DOCUMENT_PROCESSING_QUEUE = 'document-processing';

async function triggerReprocess() {
  const documentId = '69e08d33e9e54d8f55b7c6a2';
  
  try {
    // 1. Connect to DB to get storagePath and userId
    await mongoose.connect(process.env.MONGODB_URI);
    const { DocumentModel } = require('../dist/models/Document');
    
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
    doc.status = 'processing';
    doc.errorMessage = undefined;
    await doc.save();

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
