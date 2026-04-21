import { Router } from 'express';
import { requestUpgrade, getRequestStatus } from '../controllers/upgradeController';

const router = Router();

// GET /api/upgrade  — returns current upgrade request status (or null)
router.get('/', getRequestStatus);

// POST /api/upgrade/request
router.post('/request', requestUpgrade);

// GET /api/upgrade/status
router.get('/status', getRequestStatus);

export default router;
