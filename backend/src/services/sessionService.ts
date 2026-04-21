import { redis } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Enterprise-grade Session Management Service
 * Tracks JWT ID (jti) families in Redis to support:
 * 1. Refresh token rotation
 * 2. Token reuse detection
 * 3. Immediate session revocation
 */

const SESSION_PREFIX = 'session:';

/**
 * Register a new session/refresh token family
 * @param userId User MongoDB ID
 * @param jti Unique JWT ID
 * @param ttl Time to live in seconds (matches refresh token expiry)
 */
export async function createSession(userId: string, jti: string, ttl: number): Promise<void> {
  const key = `${SESSION_PREFIX}${userId}:${jti}`;
  // Store the status of this jti. 'valid' means it can be used to refresh.
  await redis.set(key, 'valid', 'EX', ttl);
  logger.info(`[Session] Created session for user ${userId}, jti: ${jti}`);
}

/**
 * Verify if a jti is valid for a given user
 * @returns 'valid' | 'used' | 'revoked' | 'not_found'
 */
export async function getSessionStatus(userId: string, jti: string): Promise<'valid' | 'used' | 'revoked' | 'not_found'> {
  const key = `${SESSION_PREFIX}${userId}:${jti}`;
  const status = await redis.get(key);
  
  if (!status) return 'not_found';
  return status as 'valid' | 'used' | 'revoked';
}

/**
 * Mark a jti as used and register a new one (Rotation)
 */
export async function rotateSession(userId: string, oldJti: string, newJti: string, ttl: number): Promise<void> {
  const oldKey = `${SESSION_PREFIX}${userId}:${oldJti}`;
  const newKey = `${SESSION_PREFIX}${userId}:${newJti}`;

  // Atomic rotation: Mark old as used, set new as valid
  const multi = redis.multi();
  multi.set(oldKey, 'used', 'EX', 60); // Keep old jti for 60s to handle race conditions/retries
  multi.set(newKey, 'valid', 'EX', ttl);
  
  await multi.exec();
  logger.info(`[Session] Rotated session for user ${userId}: ${oldJti} -> ${newJti}`);
}

/**
 * Revoke a specific session
 */
export async function revokeSession(userId: string, jti: string): Promise<void> {
  const key = `${SESSION_PREFIX}${userId}:${jti}`;
  await redis.del(key);
  logger.info(`[Session] Revoked session for user ${userId}, jti: ${jti}`);
}

/**
 * Emergency: Revoke ALL sessions for a user (Security Breach Response)
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  const pattern = `${SESSION_PREFIX}${userId}:*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);
    logger.warn(`[Session] SECURITY BREACH: Revoked ${keys.length} sessions for user ${userId}`);
  }
}
