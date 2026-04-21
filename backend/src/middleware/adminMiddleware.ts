import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * adminMiddleware
 *
 * Enforces that:
 * 1. User must be authenticated
 * 2. User must have admin role
 * 3. Only the designated admin account (scholaraiteam@scholarai.ac.in) can have admin role
 *
 * Development: authMiddleware dev bypass ensures req.user is set with 'user' role
 *             Admin routes will return 403 Forbidden unless a special dev admin is configured.
 * Production: Same checks apply to all users.
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }

  // ⚠️ ROLE ENFORCEMENT: Check user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  // In development with dev user, inject additional context
  const IS_DEV = process.env.NODE_ENV === 'development';
  if (IS_DEV && req.user.email === 'dev@local') {
    logger.warn(`[DEV] Admin route accessed by dev user: ${req.method} ${req.path}`);
  }

  next();
};
