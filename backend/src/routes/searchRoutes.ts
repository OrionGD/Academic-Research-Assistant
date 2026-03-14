import express from 'express';
import { executeSearch } from '../controllers/searchController';
import { validateRequest } from '../middleware/validationMiddleware';
import { SearchRequestSchema } from '../utils/validationSchemas';

const router = express.Router();

router.post('/', validateRequest(SearchRequestSchema), executeSearch);

export default router;
