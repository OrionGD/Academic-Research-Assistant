import express from 'express';
import {
  getSystemMetrics,
  getUsers,
  deleteUser,
  getUpgradeRequests,
  approveUpgrade,
  rejectUpgrade,
  getChatHistory
} from '../controllers/adminController';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  updateUserRole,
  getSettings,
  updateSettings,
  getAuditLogs
} from '../controllers/adminEnterpriseController';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = express.Router();

// All admin routes require admin role
// (authMiddleware already applied globally in server.ts, adminMiddleware checks role)
router.use(adminMiddleware);

// ── Index ────────────────────────────────────────────────────────────────────
// GET  /api/admin        → system overview / metrics
router.get('/', getSystemMetrics);

// ── Stats ───────────────────────────────────────────────────────────────────
// GET  /api/admin/stats  → alias for system metrics
router.get('/stats', getSystemMetrics);

// ── User Management ──────────────────────────────────────────────────────────
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);

// ── Upgrade Requests ─────────────────────────────────────────────────────────
router.get('/upgrade-requests', getUpgradeRequests);
router.post('/approve-upgrade/:requestId', approveUpgrade);
router.post('/reject-upgrade/:requestId', rejectUpgrade);

// ── System Metrics ───────────────────────────────────────────────────────────
router.get('/system-metrics', getSystemMetrics);

// ── Enterprise Extensions ─────────────────────────────────────────────────────
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.patch('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

router.get('/audit-logs', getAuditLogs);

// ── Chat History ─────────────────────────────────────────────────────────────
router.get('/chat-history/:userId', getChatHistory);

export default router;
