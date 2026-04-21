import { Router } from 'express';
import { createKey, getKeys, deleteKey } from '../controllers/apiKeyController';
import { planGate } from '../middleware/planGate';

const router = Router();

// GET /api/keys       — list user's API keys (available to all authenticated users)
router.get('/', getKeys);

// POST /api/keys      — create new API key (requires STANDARD plan or higher)
router.post('/', planGate('STANDARD'), createKey);

// DELETE /api/keys/:prefix  — delete an API key (requires STANDARD plan or higher)
router.delete('/:prefix', planGate('STANDARD'), deleteKey);

export default router;
