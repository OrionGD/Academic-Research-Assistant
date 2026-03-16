import express from 'express';
import { createChat, streamChat, getChatHistory, deleteChatHistory } from '../controllers/chatController';
import { validateRequest } from '../middleware/validationMiddleware';
import { ChatRequestSchema } from '../utils/validationSchemas';
import { aiEndpointLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post('/', aiEndpointLimiter, validateRequest(ChatRequestSchema), createChat);
router.post('/stream', aiEndpointLimiter, validateRequest(ChatRequestSchema), streamChat);
router.get('/history/:sessionId', getChatHistory);
router.delete('/history/:sessionId', deleteChatHistory);

export default router;
