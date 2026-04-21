import { RequestUser } from '../utils/userAuth';

/**
 * Global Express Request Interface Extension
 *
 * Extends Express Request to include:
 * - user: RequestUser - Authenticated user (may be undefined in unauthenticated routes)
 *
 * Usage in controllers:
 *   // Option 1: Using type guard (recommended)
 *   const user = assertUser(req.user);
 *
 *   // Option 2: Using wrapper function (cleanest)
 *   export const myEndpoint = requireAuth(async (req, res, next, user) => {
 *     // user is guaranteed to be RequestUser here
 *   });
 */
declare module 'express-serve-static-core' {
  interface Request {
    /**
     * Authenticated user, guaranteed to be RequestUser after auth middleware
     * May be undefined in routes without auth middleware
     *
     * Type guard with assertUser(req.user) to narrow type
     */
    user?: RequestUser;
  }
}
