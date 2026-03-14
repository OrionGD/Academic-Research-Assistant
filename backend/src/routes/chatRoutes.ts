import express from 'express';
import { createChat, streamChat, deleteChatHistory } from '../controllers/chatController';
import { validateRequest } from '../middleware/validationMiddleware';
import { ChatRequestSchema } from '../utils/validationSchemas';

const router = express.Router();

router.post('/', validateRequest(ChatRequestSchema), createChat);
router.post('/stream', validateRequest(ChatRequestSchema), streamChat);
router.delete('/history/:sessionId', deleteChatHistory);

export default router;
