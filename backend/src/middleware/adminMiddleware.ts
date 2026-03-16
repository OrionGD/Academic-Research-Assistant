import { Request, Response, NextFunction } from 'express';

/**
 * adminMiddleware
 *
 * ⚠️  DEBUG OVERRIDE ACTIVE ─────────────────────────────────────────────────
 * The role check is temporarily relaxed to allow ALL authenticated users to
 * reach /api/admin/* endpoints for testing and debugging purposes.
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
  // Any authenticated request (req.user is set by authMiddleware) is allowed through.
  // The authMiddleware upstream already ensures req.user exists; this check is a
  // safety net in case the route stack changes.
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }

  // TODO: restore before going to production:
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Forbidden: Admin access required' });
  // }

  next();
};
