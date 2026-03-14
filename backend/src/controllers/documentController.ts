import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { DocumentModel } from '../models/Document';
import { getStorageBucket } from '../config/storage';
import { documentProcessingQueueName } from '../workers/documentProcessor.worker';
import { v4 as uuidv4 } from 'uuid';

const redisConnection = new IORedis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
const docQueue = new Queue(documentProcessingQueueName, { connection: redisConnection });

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user._id;
    const title = req.body.title || originalname;
    const filename = `${uuidv4()}-${originalname}`;

    // Upload to Storage
    const bucket = getStorageBucket();
    const file = bucket.file(`documents/${userId}/${filename}`);
    await file.save(buffer, {
      metadata: { contentType: mimetype },
    });
    
    // Make public or get signed URL (simplified for example)
    const storageUrl = `https://storage.googleapis.com/${bucket.name}/documents/${userId}/${filename}`;

    const newDoc = new DocumentModel({
      userId,
      title,
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size,
      storageUrl,
      status: 'processing'
    });

    await newDoc.save();

    // Enqueue document processing job
    await docQueue.add('process-document', {
      documentId: newDoc._id.toString(),
      userId: userId.toString(),
      storagePath: storageUrl
    });

    res.status(201).json({ message: 'Document uploaded successfully', document: newDoc });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const documents = await DocumentModel.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
    const total = await DocumentModel.countDocuments({ userId: req.user._id });

    res.json({
        documents,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total
    });
  } catch (error) {
   next(error);
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentModel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentModel.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    
    // Also delete chunks, analysis, etc (can use Mongoose middleware or just do it here)
    // and delete from storage bucket

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const compareDocuments = async (req: Request, res: Response, next: NextFunction) => {
  // Can be implemented by queuing a comparison job or calling the pipeline directly
  // See analysisController
  res.status(501).json({ error: 'Not implemented, see analysis endpoints' });
};
