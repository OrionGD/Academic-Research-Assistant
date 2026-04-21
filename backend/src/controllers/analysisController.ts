import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import { AnalysisResult } from '../models/AnalysisResult';
import { DocumentModel } from '../models/Document';
import { runDocumentComparisonPipeline } from '../pipelines/documentComparison.pipeline';
import { DOCUMENT_ANALYSIS_QUEUE } from '../queues/queueNames';
import { logger } from '../utils/logger';
import { requireAuth, createUserFilter, assertUserOwnsResource, getUserId } from '../utils/userAuth';

// Use host/port connection so REDIS_HOST & REDIS_PORT env vars are respected inside Docker
const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
} as any;
const analysisQueue = new Queue(DOCUMENT_ANALYSIS_QUEUE, { connection });

/**
 * GET /api/analysis/:id
 * Retrieve analysis results for a specific analysis ID
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Verifies user owns the analysis result
 */
export const getAnalysis = requireAuth(async (req, res, next, user) => {
  try {
    const { id: analysisId } = req.params;
    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }

    // Query-level isolation: only find analysis owned by this user
    const analysis = await AnalysisResult.findOne(
      createUserFilter(user, { _id: analysisId })
    ).lean();

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    logger.error(
      `[AnalysisController] Error fetching analysis for userId: ${user._id}, endpoint: ${req.originalUrl}, timestamp: ${new Date().toISOString()}`,
      error
    );
    next(error);
  }
});

/**
 * GET /api/analysis/document/:id
 * Retrieve analysis results for a specific document ID
 *
 * Security: Verifies user owns the analysis result (linked to their document)
 */
export const getAnalysisByDocument = requireAuth(async (req, res, next, user) => {
  try {
    const { id: documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    // Query analysis by documentId and userId for isolation
    const analysis = await AnalysisResult.findOne(
      createUserFilter(user, { documentId: documentId })
    ).lean();

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not yet available for this document' });
    }

    res.json(analysis);
  } catch (error) {
    logger.error(
      `[AnalysisController] Error fetching analysis for docId: ${req.params.id}, userId: ${user._id}`,
      error
    );
    next(error);
  }
});

/**
 * POST /api/analysis/start
 * Queue a document for analysis processing
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Verifies user owns the document before queuing analysis
 */
export const startAnalysis = requireAuth(async (req, res, next, user) => {
  try {
    const { documentId, fullText } = req.body;
    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    // Verify user owns the document (query-level isolation)
    const doc = await DocumentModel.findOne(
      createUserFilter(user, { _id: documentId })
    );

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Queue the analysis job
    await analysisQueue.add(
      'analyze-document',
      {
        documentId,
        userId: user._id,
        fullText: fullText || '',
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
      `[AnalysisController] Error queuing analysis for userId: ${user._id}, endpoint: ${req.originalUrl}, timestamp: ${new Date().toISOString()}`,
      error
    );
    next(error);
  }
});

/**
 * POST /api/analysis/compare
 * Compare multiple documents and return comparison analysis
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Verifies user owns all documents before comparison
 */
export const compareDocumentsAnalysisEndpoint = requireAuth(async (req, res, next, user) => {
  try {
    const { documentIds } = req.body;
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
      return res.status(400).json({ error: 'At least two document IDs are required' });
    }

    // Verify user owns all documents being compared (security check)
    const userDocuments = await DocumentModel.find(
      createUserFilter(user, { _id: { $in: documentIds } })
    ).lean();

    if (userDocuments.length !== documentIds.length) {
      logger.warn(
        `[Security] User ${user._id} attempted to compare documents they don't own. Provided: ${documentIds.length}, Owned: ${userDocuments.length}`
      );
      return res.status(403).json({
        error: 'Forbidden: You do not have access to all specified documents',
      });
    }

    // Run the comparison pipeline with user isolation
    const result = await runDocumentComparisonPipeline(documentIds, user._id);
    res.json(result);
  } catch (error) {
    logger.error(
      `[AnalysisController] Error comparing documents for userId: ${user._id}, endpoint: ${req.originalUrl}, timestamp: ${new Date().toISOString()}`,
      error
    );
    next(error);
  }
});
