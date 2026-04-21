import express from 'express';
import { getAnalysis, getAnalysisByDocument, startAnalysis, compareDocumentsAnalysisEndpoint } from '../controllers/analysisController';
import { validateRequest } from '../middleware/validationMiddleware';
import { AnalysisStartSchema, ComparisonRequestSchema } from '../utils/validationSchemas';
import { aiEndpointLimiter } from '../middleware/rateLimiter';
import { usageGate } from '../middleware/usageGate';
import { planGate } from '../middleware/planGate';

const router = express.Router();

router.get('/document/:id', getAnalysisByDocument);
router.get('/:id', getAnalysis);
router.post('/start', validateRequest(AnalysisStartSchema), aiEndpointLimiter, usageGate('analysis'), startAnalysis);
// Compare requires Pro plan
router.post('/compare', planGate('PRO'), validateRequest(ComparisonRequestSchema), aiEndpointLimiter, usageGate('analysis'), compareDocumentsAnalysisEndpoint);

export default router;
