import { Request, Response, NextFunction } from 'express';
import { DocumentModel } from '../models/Document';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_API_KEY = process.env.ML_SERVICE_API_KEY || '';

export const executeSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, documentIds, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const userId = req.user._id.toString();

    // Validate that user owns the specified documents (multi-tenant isolation)
    let validatedDocumentIds: string[] | undefined;
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      const validDocs = await DocumentModel.find(
        { _id: { $in: documentIds }, userId: req.user._id },
        '_id'
      ).lean();
      validatedDocumentIds = validDocs.map((d) => d._id.toString());
    }

    const searchPayload: Record<string, any> = {
      query,
      limit: Math.min(limit, 20),
      userId,
    };
    if (validatedDocumentIds && validatedDocumentIds.length > 0) {
      searchPayload.documentIds = validatedDocumentIds;
    }

    const response = await fetch(`${ML_SERVICE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ML_SERVICE_API_KEY,
      },
      body: JSON.stringify(searchPayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error(`[SearchController] ML service error: ${response.status} ${err}`);
      return res.status(502).json({ error: 'Search service unavailable' });
    }

    const searchResults = await response.json();
    res.json(searchResults);
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: 'Search service timed out' });
    }
    next(error);
  }
};
