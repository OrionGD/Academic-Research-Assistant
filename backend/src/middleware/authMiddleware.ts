import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { User } from '../models/User';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: any; // To hold Mongoose User document
      firebaseUser?: admin.auth.DecodedIdToken;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || '',
        role: 'user', // default role
      });
      logger.info(`New user created: ${user._id}`);
    }

    req.user = user;
    next();
  } catch (error: any) {
    logger.error('Authentication Error:', error.message || error);
    
    // Distinguish between expired tokens vs invalid tokens if necessary
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
