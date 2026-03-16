import mongoose from 'mongoose';
import { User } from '../models/User';
import { logger } from './logger';

/**
 * Creates or retrieves a dev user for development/testing.
 * In production, this is never called.
 */
export async function getOrCreateDevUser() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev user cannot be used in production');
  }

  try {
    // Try to find existing dev user
    let devUser = await User.findOne({ email: 'dev@local' });

    if (!devUser) {
      // Create new dev user with proper ObjectId
      devUser = await User.create({
        firebaseUid: 'dev-user',
        email: 'dev@local',
        name: 'Dev User',
        role: 'admin',
        documentCount: 0,
      });
      logger.info(`[DevUser] Created new dev user: ${devUser._id}`);
    } else {
      logger.info(`[DevUser] Using existing dev user: ${devUser._id}`);
    }

    return devUser;
  } catch (error) {
    logger.error('[DevUser] Failed to create/retrieve dev user:', error);
    // Return a fallback object with a valid ObjectId
    const fallbackId = new mongoose.Types.ObjectId('000000000000000000000001');
    return {
      _id: fallbackId,
      firebaseUid: 'dev-user',
      email: 'dev@local',
      name: 'Dev User',
      role: 'admin',
      documentCount: 0,
    };
  }
}
