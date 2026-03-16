import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import { DocumentModel } from '../models/Document';
import { DocumentChunk } from '../models/DocumentChunk';
import { AnalysisResult } from '../models/AnalysisResult';
import { getStorageBucket } from '../config/storage';
import { DOCUMENT_PROCESSING_QUEUE } from '../queues/queueNames';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Use host/port connection so REDIS_HOST & REDIS_PORT env vars are respected inside Docker
const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
} as any;
const docQueue = new Queue(DOCUMENT_PROCESSING_QUEUE, { connection });

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user._id.toString();
    const title = req.body.title || originalname.replace(/\.pdf$/i, '');
    const filename = `${uuidv4()}-${originalname}`;
    const storagePath = `documents/${userId}/${filename}`;

    // Upload to Google Cloud Storage
    let bucket: ReturnType<typeof getStorageBucket>;
    try {
      bucket = getStorageBucket();
    } catch (storageInitErr: any) {
      logger.error('[DocumentController] Storage not initialised:', storageInitErr.message);
      return res.status(503).json({ error: 'Storage service is not configured. Contact an administrator.' });
    }

    const file = bucket.file(storagePath);
    try {
      await file.save(buffer, { metadata: { contentType: mimetype } });
    } catch (gcsErr: any) {
      const status = gcsErr?.response?.status ?? gcsErr?.code;
      if (status === 404) {
        logger.error(`[DocumentController] GCS bucket not found:`, gcsErr.message);
        return res.status(503).json({
          error: 'Storage bucket not found. Please initialise Firebase Storage and ensure STORAGE_BUCKET is correct.',
        });
      }
      throw gcsErr; // re-throw unexpected errors
    }

    const storageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Create document record in MongoDB
    const newDoc = new DocumentModel({
      userId: req.user._id,
      title,
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size,
      storageUrl,
      status: 'processing',
    });
    await newDoc.save();

    const documentId = newDoc._id.toString();

    // Queue async processing job via BullMQ (non-blocking)
    await docQueue.add(
      'process-document',
      { documentId, userId, storagePath },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    logger.info(`[DocumentController] Queued processing job for document ${documentId}`);

    res.status(201).json({
      message: 'Document uploaded successfully. Processing started.',
      document: newDoc,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      DocumentModel.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      documents,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentModel.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(document);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    // Delete associated chunks and analysis results
    await Promise.all([
      DocumentChunk.deleteMany({ documentId: document._id }),
      AnalysisResult.deleteMany({ documentId: document._id }),
    ]);

    // Delete from GCS (non-blocking)
    try {
      const bucket = getStorageBucket();
      const storagePath = document.storageUrl
        .replace(`https://storage.googleapis.com/${bucket.name}/`, '');
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch (storageErr) {
      logger.warn(`[DocumentController] Could not delete GCS file for doc ${document._id}:`, storageErr);
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const compareDocuments = async (req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ error: 'Use POST /api/analysis/compare instead' });
};

export const reprocessDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentModel.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const storagePath = document.storageUrl
      .replace(`https://storage.googleapis.com/${getStorageBucket().name}/`, '');

    await DocumentModel.findByIdAndUpdate(document._id, { status: 'processing', errorMessage: undefined });

    await docQueue.add(
      'process-document',
      { documentId: document._id.toString(), userId: req.user._id.toString(), storagePath },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    res.json({ message: 'Reprocessing queued', documentId: document._id });
  } catch (error) {
    next(error);
  }
};
