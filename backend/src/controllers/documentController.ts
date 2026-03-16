import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import { DocumentModel } from '../models/Document';
import { DocumentChunk } from '../models/DocumentChunk';
import { AnalysisResult } from '../models/AnalysisResult';
import { getStorageBucket, getStorageUrl, normalizeStoragePath } from '../config/storage';
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
    const userId = req.user?._id?.toString();
    logger.info('[DocumentController] Upload request', { userId, originalUrl: req.originalUrl });

    if (!userId) {
      logger.error('[DocumentController] Upload failed: missing authenticated user');
      return res.status(401).json({ error: 'Unauthorized: user not authenticated' });
    }

    if (!req.file) {
      logger.warn('[DocumentController] Upload failed: no file attached');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const title = req.body.title || originalname.replace(/\.pdf$/i, '');
    const filename = `${uuidv4()}-${originalname}`;
    const storagePath = `documents/${userId}/${filename}`;

    // Upload to Google Cloud Storage (or local storage fallback)
    const bucket = getStorageBucket();

    const file = bucket.file(storagePath);

    try {
      await file.save(buffer, { metadata: { contentType: mimetype } });
    } catch (gcsErr: any) {
      const status = gcsErr?.response?.status ?? gcsErr?.code;
      if (status === 404) {
        logger.error(`[DocumentController] Storage bucket not found:`, gcsErr.message);
        return res.status(503).json({
          error: 'Storage bucket not found. Please initialise Firebase Storage and ensure STORAGE_BUCKET is correct.',
        });
      }

      logger.error('[DocumentController] Storage save failed:', gcsErr);
      return res.status(500).json({ error: 'Failed to save uploaded file. Please try again.' });
    }

    const storageUrl = getStorageUrl(storagePath);

    // Create document record in MongoDB
    const newDoc = new DocumentModel({
      userId,
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
    try {
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
    } catch (queueErr: any) {
      logger.error('[DocumentController] Failed to queue processing job:', queueErr);
      return res.status(503).json({
        error: 'Processing queue unavailable. Please try again later.',
      });
    }

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
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: user not authenticated' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      DocumentModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments({ userId }),
    ]);

    res.json({
      documents,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    logger.error('[DocumentController] getDocuments error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: user not authenticated' });
    }

    const document = await DocumentModel.findOne({
      _id: req.params.id,
      userId,
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

    // Delete from storage (non-blocking)
    try {
      const bucket = getStorageBucket();
      const storagePath = normalizeStoragePath(document.storageUrl);
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch (storageErr) {
      logger.warn(`[DocumentController] Could not delete storage file for doc ${document._id}:`, storageErr);
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

    const storagePath = normalizeStoragePath(document.storageUrl);

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
