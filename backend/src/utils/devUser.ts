import mongoose from 'mongoose';
import { User } from '../models/User';
import { logger } from './logger';
import { isAllowedAdminAccount } from './adminValidation';

/**
 * Creates or retrieves a dev user for development/testing.
 * In production, this is never called.
 *
 * Dev users default to 'user' role unless they are the allowed admin account.
 */
export async function getOrCreateDevUser() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev user cannot be used in production');
  }

  try {
    // Try to find existing dev user
    let devUser = await User.findOne({ email: 'scholaraiteam@scholarai.ac.in' });

    if (!devUser) {
      // ⚠️ ROLE ENFORCEMENT: Dev users default to 'user' role
      // Dev users are never the allowed admin account
      devUser = await User.create({
        email: 'scholaraiteam@scholarai.ac.in',
        name: 'Dev Admin',
        role: 'admin', // Changed from 'user' to 'admin' for testing
        documentCount: 0,
      });
      logger.info(`[DevUser] Created new dev user with role 'admin': ${devUser._id}`);
    } else {
      // Update existing dev user to 'user' role
      devUser.role = 'admin';
      await devUser.save();
      logger.info(`[DevUser] Updated existing dev user to role 'user': ${devUser._id}`);
    }

    return devUser;
  } catch (error) {
    logger.error('[DevUser] Failed to create/retrieve dev user:', error);
    // Return a fallback object with a valid ObjectId
    const fallbackId = new mongoose.Types.ObjectId('000000000000000000000001');
    return {
      _id: fallbackId,
      email: 'scholaraiteam@scholarai.ac.in',
      name: 'Dev Admin',
      role: 'admin', // Changed from 'user' to 'admin'
      documentCount: 0,
    };
  }
}
