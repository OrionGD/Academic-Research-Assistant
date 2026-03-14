import { Request, Response, NextFunction } from 'express';
import { runSemanticSearchPipeline } from '../pipelines/semanticSearch.pipeline';
import { DocumentModel } from '../models/Document';

export const executeSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, documentIds } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    let docObjIds;
    if (documentIds && Array.isArray(documentIds)) {
        // Validate user owns these documents
        const validDocs = await DocumentModel.find({ _id: { $in: documentIds }, userId: req.user._id }, '_id');
        docObjIds = validDocs.map(d => d._id);
    }

    const searchResults = await runSemanticSearchPipeline(query, docObjIds, 5);

    res.json(searchResults);
  } catch (error) {
    next(error);
  }
};
