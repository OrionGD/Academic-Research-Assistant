import { Request, Response, NextFunction } from 'express';
import { DocumentModel } from '../models/Document';
import { logger } from '../utils/logger';
import { requireAuth, createUserFilter, getUserId } from '../utils/userAuth';

// Configuration now resolved inside handlers to ensure fresh process.env access during dev reload

/**
 * POST /api/search
 * Execute semantic search across user's documents
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Search is limited to documents owned by the authenticated user
 *
 * Features:
 * - Validates user owns all specified documents before searching
 * - Enforces multi-tenant isolation at query level
 * - Delegates to ML service for semantic search
 */
export const executeSearch = requireAuth(async (req, res, next, user) => {
  try {
    const { query, documentIds, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const userId = getUserId(user);

    // Validate that user owns ALL specified documents (multi-tenant isolation)
    let validatedDocumentIds: string[] | undefined;
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      // Query: Find documents owned by this user that match the provided IDs
      const userOwnedDocs = await DocumentModel.find(
        createUserFilter(user, { _id: { $in: documentIds } })
      ).lean();

      // Security check: user must own all documents they're trying to search
      if (userOwnedDocs.length !== documentIds.length) {
        logger.warn(
          `[Security] User ${userId} attempted to search documents they don't own. Requested: ${documentIds.length}, Owned: ${userOwnedDocs.length}`
        );
        return res.status(403).json({
          error: 'Forbidden: You do not have access to all specified documents',
        });
      }

      // Use only the user-owned documents
      validatedDocumentIds = userOwnedDocs.map((d) => d._id.toString());
    }

    // Build payload for ML service
    const searchPayload: Record<string, any> = {
      query,
      limit: Math.min(limit, 20),
      userId,
    };

    if (validatedDocumentIds && validatedDocumentIds.length > 0) {
      searchPayload.documentIds = validatedDocumentIds;
    }

    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const ML_SERVICE_API_KEY = process.env.ML_SERVICE_API_KEY || '';

    // Call ML service for semantic search
    let mlResponse: any;
    try {
      mlResponse = await fetch(`${ML_SERVICE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ML_SERVICE_API_KEY,
        },
        body: JSON.stringify(searchPayload),
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchError: any) {
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        return res.status(504).json({ error: 'Search service timed out' });
      }
      logger.error(`[SearchController] ML fetch failed: ${fetchError.message}`);
      return res.status(503).json({ 
        error: 'Search service currently unavailable (connection refused)',
        details: process.env.NODE_ENV === 'development' ? fetchError.message : undefined
      });
    }

    if (!mlResponse.ok) {
      const err = await mlResponse.text();
      logger.error(`[SearchController] ML service error: ${mlResponse.status} ${err}`);
      return res.status(502).json({ error: 'Search service returned an error' });
    }

    const searchResults = await mlResponse.json();
    res.json(searchResults);
  } catch (error: any) {
    next(error);
  }
});
