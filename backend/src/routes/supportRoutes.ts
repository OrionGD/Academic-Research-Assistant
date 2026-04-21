import express from 'express';
import {
  sendMessage,
  getHistory,
  adminReply,
  getAdminInbox,
  markAsRead
} from '../controllers/supportChatController';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = express.Router();

// ── User Support Ticket Endpoints ──────────────────────────────────────────
// GET  /api/support        — list tickets / chat history for this user
router.get('/', getHistory);

// POST /api/support        — create a new support ticket / send a message
router.post('/', sendMessage);

// Alias routes (legacy compatibility)
router.post('/chat', sendMessage);
router.get('/chat', getHistory);

// ── Admin Endpoints ────────────────────────────────────────────────────────
router.get('/admin/inbox', adminMiddleware, getAdminInbox);
router.post('/admin/reply', adminMiddleware, adminReply);
router.patch('/admin/read/:userId', adminMiddleware, markAsRead);

export default router;
