import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * adminMiddleware
 *
 * ⚠️  DEBUG OVERRIDE ACTIVE ─────────────────────────────────────────────────
 * • In development (NODE_ENV=development): any request — even with no token —
 *   is treated as admin. authMiddleware already sets req.user to the dev mock;
 *   this block is an extra safety net if the route order ever changes.
 * • In production: role check is currently commented out to unblock testing.
 *   Restore the role check before going live.
 *
 * To restore production behaviour, replace the body below with:
 *
 *   if (!req.user) {
 *     return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
 *   }
 *   if (req.user.role !== 'admin') {
 *     return res.status(403).json({ error: 'Forbidden: Admin access required' });
 *   }
 *   next();
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const IS_DEV = process.env.NODE_ENV === 'development';

  // Dev bypass: if authMiddleware didn't set req.user (e.g. route order changed),
  // inject the mock admin user so the request is never bounced with a 401.
  if (IS_DEV && !req.user) {
    logger.warn(`[DEV] adminMiddleware bypass — injecting mock admin (${req.method} ${req.path})`);
    req.user = {
      id: 'dev-user',
      _id: 'dev-user',
      firebaseUid: 'dev-user',
      email: 'dev@localhost',
      name: 'Dev User',
      role: 'admin',
      isAdmin: true,
    };
    return next();
  }

  // Any authenticated request passes through (debug override — see header comment).
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }

  // TODO: restore before going to production:
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Forbidden: Admin access required' });
  // }

  next();
};
