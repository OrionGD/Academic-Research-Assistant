import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

/**
 * Middleware factory: logs an audit entry after the request completes.
 *
 * Usage:
 *   router.delete('/:id', auditLog('DELETE_DOCUMENT', 'document'), handler)
 */
export function auditLog(action: string, resource: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Capture original end to hook after response
    const originalSend = res.send.bind(res);
    res.send = function (body: any) {
      // Only log successful operations (2xx/3xx)
      if (res.statusCode < 400) {
        AuditLog.create({
          userId: req.user?._id,
          userEmail: (req.user as any)?.email,
          action,
          resource,
          resourceId: req.params?.id || req.params?.requestId,
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
          },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch((err) => logger.error('[AuditLog] Failed to write audit log:', err));
      }
      return originalSend(body);
    };

    next();
  };
}
