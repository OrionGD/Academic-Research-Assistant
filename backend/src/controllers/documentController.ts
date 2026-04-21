import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import mongoose from 'mongoose';
import { DocumentModel } from '../models/Document';
import { DocumentChunk } from '../models/DocumentChunk';
import { AnalysisResult } from '../models/AnalysisResult';
import { getStorageBucket, getStorageUrl, normalizeStoragePath } from '../config/storage';
import { runDocumentComparisonPipeline } from '../pipelines/documentComparison.pipeline';
import { DOCUMENT_PROCESSING_QUEUE, DOCUMENT_ANALYSIS_QUEUE } from '../queues/queueNames';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { requireAuth, createUserFilter, assertUserOwnsResource, getUserId } from '../utils/userAuth';

// Use host/port connection so REDIS_HOST & REDIS_PORT env vars are respected inside Docker
const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
} as any;
const docQueue = new Queue(DOCUMENT_PROCESSING_QUEUE, { connection });
const analysisQueue = new Queue(DOCUMENT_ANALYSIS_QUEUE, { connection });

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/documents/upload
 * Upload a new document for processing
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Documents are isolated to the authenticated user's account
 */
export const uploadDocument = requireAuth(async (req, res, next, user) => {
  try {
    const userId = getUserId(user);
    logger.info('[DocumentController] Upload request', { userId, originalUrl: req.originalUrl });

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

    // Create document record in MongoDB (user-isolated)
    const newDoc = new DocumentModel({
      userId: user._id,
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
});

/**
 * GET /api/documents
 * List all documents for the authenticated user (with pagination)
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Only returns documents belonging to this user
 */
export const getDocuments = requireAuth(async (req, res, next, user) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    // createUserFilter ensures per-user data isolation at query level
    const filter = createUserFilter(user);

    const documents = await DocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await DocumentModel.countDocuments(filter);

    // Map each document to include a download URL
    const mappedDocuments = documents.map(doc => ({
      ...doc,
      fileUrl: `/api/documents/${doc._id}/download`
    }));

    res.json({
      documents: mappedDocuments,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    logger.error('[DocumentController] getDocuments error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

/**
 * GET /api/documents/:id
 * Retrieve a specific document by ID
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Verifies user owns the document at query AND assertion level
 */
export const getDocumentById = requireAuth(async (req, res, next, user) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // First layer: query-level isolation
    const document = await DocumentModel.findOne(
      createUserFilter(user, { _id: req.params.id })
    ).lean();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Optional: Second layer of verification for extra safety
    assertUserOwnsResource(document, user);

    res.json({
      ...document,
      fileUrl: `/api/documents/${document._id}/download`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document and its associated data
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Verifies user owns the document before deletion
 * Cleanup: Removes document, chunks, and analysis results
 */
export const deleteDocument = requireAuth(async (req, res, next, user) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // Query-level isolation: only find documents owned by this user
    const document = await DocumentModel.findOneAndDelete(
      createUserFilter(user, { _id: req.params.id })
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete associated chunks and analysis results (owned by user)
    await Promise.all([
      DocumentChunk.deleteMany({ documentId: document._id }),
      AnalysisResult.deleteMany({ documentId: document._id }),
    ]);

    // Delete from storage (non-blocking, non-critical)
    try {
      const bucket = getStorageBucket();
      const storagePath = normalizeStoragePath(document.storageUrl);
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch (storageErr) {
      logger.warn(`[DocumentController] Could not delete storage file for doc ${document._id}:`, storageErr);
      // Don't fail the entire request for storage cleanup failure
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/compare
 * Placeholder endpoint directing users to the correct API
 */
export const compareDocuments = (req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ error: 'Use POST /api/analysis/compare instead' });
};

/**
 * POST /api/documents/:id/reprocess
 * Requeue a document for processing
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Verifies user owns the document before reprocessing
 */
export const reprocessDocument = requireAuth(async (req, res, next, user) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // Query-level isolation: only find documents owned by this user
    const document = await DocumentModel.findOne(
      createUserFilter(user, { _id: req.params.id })
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const storagePath = normalizeStoragePath(document.storageUrl);

    // Update document status to 'processing' and clear any error messages
    await DocumentModel.findByIdAndUpdate(document._id, {
      status: 'processing',
      errorMessage: undefined,
    });

    // Queue the reprocessing job
    await docQueue.add(
      'process-document',
      {
        documentId: document._id.toString(),
        userId: user._id,
        storagePath,
      },
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
});
/**
 * GET /api/documents/:id/download
 * Download the original document file
 */
export const downloadDocument = requireAuth(async (req, res, next, user) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await DocumentModel.findOne(
      createUserFilter(user, { _id: req.params.id })
    ).lean();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.canDownload === false) {
      return res.status(403).json({ error: 'Download is not permitted for this document' });
    }

    // Increment download count asynchronously
    DocumentModel.updateOne({ _id: document._id }, { $inc: { downloadCount: 1 } }).catch(e => 
      logger.error(`Failed to increment download count for ${document._id}`, e)
    );

    const storagePath = normalizeStoragePath(document.storageUrl);
    const bucket = getStorageBucket();
    const file = bucket.file(storagePath);

    try {
      // In development/LocalBucket, download returns [Buffer]. 
      // In GCS, it also returns [Buffer] by default.
      const [buffer] = await file.download();
      
      res.setHeader('Content-Type', document.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.send(buffer);
      
    } catch (err: any) {
      logger.error(`[DocumentController] Download failed for doc ${document._id}:`, err);
      res.status(500).json({ error: 'Could not retrieve file from storage' });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:id/view
 * Retrieve metadata for a document view and its viewing URL
 */
export const viewDocument = requireAuth(async (req, res, next, user) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await DocumentModel.findOne(
      createUserFilter(user, { _id: req.params.id })
    ).lean();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.canView === false) {
      return res.status(403).json({ error: 'Viewing is not permitted for this document' });
    }

    await DocumentModel.updateOne(
      { _id: document._id }, 
      { $set: { lastViewedAt: new Date() } }
    );

    res.json({
      documentId: document._id,
      name: document.originalName,
      mimeType: document.mimeType,
      viewUrl: `/api/documents/${document._id}/content`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:id/content
 * Stream the raw file content for inline browser viewing
 */
export const streamDocumentContent = requireAuth(async (req, res, next, user) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await DocumentModel.findOne(
      createUserFilter(user, { _id: req.params.id })
    ).lean();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.canView === false) {
      return res.status(403).json({ error: 'Viewing is not permitted for this document' });
    }

    const storagePath = normalizeStoragePath(document.storageUrl);
    const bucket = getStorageBucket();
    const file = bucket.file(storagePath);

    try {
      const [buffer] = await file.download();
      
      res.setHeader('Content-Type', document.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      res.send(buffer);
      
    } catch (err: any) {
      logger.error(`[DocumentController] Content stream failed for doc ${document._id}:`, err);
      res.status(500).json({ error: 'Could not retrieve file content from storage' });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/:id/analyze
 * Alias to queue a document for analysis
 */
export const analyzeDocument = requireAuth(async (req, res, next, user) => {
  try {
    const documentId = req.params.id;
    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const doc = await DocumentModel.findOne(
      createUserFilter(user, { _id: documentId })
    );

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await analysisQueue.add(
      'analyze-document',
      {
        documentId,
        userId: user._id,
        fullText: '',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    res.status(202).json({ message: 'Analysis queued successfully', documentId });
  } catch (error) {
    logger.error(
      `[DocumentController] Error queuing analysis via alias for userId: ${user._id}, docId: ${req.params.id}`,
      error
    );
    next(error);
  }
});
