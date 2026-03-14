import express from 'express';
import { getAnalysis, startAnalysis, compareDocumentsAnalysisEndpoint } from '../controllers/analysisController';
import { validateRequest } from '../middleware/validationMiddleware';
import { AnalysisStartSchema, ComparisonRequestSchema } from '../utils/validationSchemas';
import { aiEndpointLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/:id', getAnalysis);
router.post('/start', validateRequest(AnalysisStartSchema), aiEndpointLimiter, startAnalysis);
router.post('/compare', validateRequest(ComparisonRequestSchema), aiEndpointLimiter, compareDocumentsAnalysisEndpoint);

export default router;
