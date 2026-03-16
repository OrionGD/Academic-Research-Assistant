import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { User } from '../models/User';
import { logger } from '../utils/logger';

// Express Request augmentation lives in src/types/express.d.ts
// so it is available to all middleware without re-declaration.

const IS_DEV = process.env.NODE_ENV === 'development';

// ⚠️  DEV-ONLY bypass token — never accepted in production.
const DEV_BYPASS_TOKEN = 'dev-global-token';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // ── Development bypass ────────────────────────────────────────────────────
  // When NODE_ENV=development, requests with no token OR with the special
  // dev bypass token are treated as an authenticated admin user.
  // This lets curl / Postman / browser dev-tools hit the API without
  // going through the full Firebase auth flow.
  //
  // ⚠️  REMOVE or gate this block before deploying to production.
  // ─────────────────────────────────────────────────────────────────────────
  if (IS_DEV) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    // Allow: no token at all  OR  the well-known dev bypass token.
    if (!token || token === DEV_BYPASS_TOKEN) {
      logger.warn(`[DEV] Auth bypass — treating request as admin (${req.method} ${req.path})`);
      req.user = {
        id: 'dev-user',
        firebaseUid: 'dev-user',
        email: 'dev@localhost',
        name: 'Dev User',
        role: 'admin',
        isAdmin: true,
      };
      return next();
    }
    // If a real Bearer token is provided even in dev, fall through to normal
    // Firebase verification so real accounts are never accidentally bypassed.
  }

  // ── Normal Firebase auth flow ─────────────────────────────────────────────
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      // Respect any admin custom claim already set in Firebase on first creation
      const initialRole = decodedToken.admin === true ? 'admin' : 'user';
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || '',
        role: initialRole,
        lastLoginAt: new Date(),
      });
      logger.info(`New user created: ${user._id} (role: ${initialRole})`);
    } else {
      // Sync Firebase custom claim "admin: true" → MongoDB role (promotion only).
      const shouldBeAdmin = decodedToken.admin === true;
      const roleChanged = shouldBeAdmin && user.role !== 'admin';

      if (roleChanged) {
        user.role = 'admin';
        logger.info(`User promoted to admin via Firebase custom claim: ${user.email}`);
      }

      // Throttle lastLoginAt writes: update at most once per minute.
      const lastLogin = user.lastLoginAt;
      const loginStale = !lastLogin || Date.now() - lastLogin.getTime() > 60_000;

      if (roleChanged || loginStale) {
        user.lastLoginAt = new Date();
        await user.save();
      }
    }

    req.user = user;
    next();
  } catch (error: any) {
    logger.error('Authentication Error:', error.message || error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Unauthorized: Token expired. Please re-authenticate.' });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Unauthorized: Malformed token.' });
    }

    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
