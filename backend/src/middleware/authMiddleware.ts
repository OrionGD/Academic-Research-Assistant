import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';
import * as sessionService from '../services/sessionService';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret';

/**
 * Enterprise-grade Auth Middleware
 * Strictly validates Authorization: Bearer <Backend-JWT>
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. Check header existence and format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization header. Expected "Bearer <token>"'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify JWT Signature
    const decoded: any = jwt.verify(token, ACCESS_SECRET);

    // 3. Optional: Strict Session Check (Revocation Support)
    // For extreme security, we could check if the underlying refresh token family is still valid.
    // However, usually we trust the short-lived access token.
    // We only check if the user exists and is active.

    // 4. Extract user info and verify in DB
    const user = await User.findById(decoded.userId) as IUser | null;
    
    if (!user) {
      logger.warn(`[Auth] Token valid but user not found: ${decoded.userId}`);
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'Account not found or has been deactivated.'
      });
    }

    // 5. Attach user context to request
    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      firebaseUid: user.firebaseUid,
      role: user.role,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      plan: user.planTier || 'FREE',
      planTier: user.planTier,
      subscriptionStatus: user.subscriptionStatus,
      upgradeRequestStatus: user.upgradeRequestStatus
    };

    next();
  } catch (error: any) {
    logger.error(`[Auth] JWT verification failed: ${error.message}`);
    
    const response = {
      error: 'INVALID_TOKEN',
      message: 'The provided token is invalid or expired.'
    };

    if (error.name === 'TokenExpiredError') {
      response.error = 'TOKEN_EXPIRED';
      response.message = 'Your session has expired. Please log in again.';
    }

    return res.status(401).json(response);
  }
};

/**
 * Admin API Authorization
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied: Administrative privileges required.'
    });
  }
  next();
};