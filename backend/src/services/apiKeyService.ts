import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ApiKey } from '../models/ApiKey';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const KEY_PREFIX = 'aras_sk_';
const SALT_ROUNDS = 10;

export interface GeneratedKeyResult {
  rawKey: string;      // shown once to user
  prefix: string;      // stored for display
  name: string;
}

/**
 * Generate a new API key for a user.
 * The raw key is returned ONCE — never stored in plaintext.
 */
export async function generateApiKey(
  userId: string,
  name: string
): Promise<GeneratedKeyResult> {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.planTier || user.planTier === 'FREE') {
    throw new Error('API key access requires BASIC or higher plan');
  }

  // Count existing active keys
  const existingCount = await ApiKey.countDocuments({ userId, isActive: true });
  const maxKeys = user.planTier === 'PRO' ? 5 : user.planTier === 'STANDARD' ? 3 : 2;
  if (existingCount >= maxKeys) {
    throw new Error(`Maximum of ${maxKeys} API keys allowed on ${user.planTier} plan`);
  }

  // Generate 32-byte random key
  const rawSuffix = crypto.randomBytes(32).toString('hex');
  const rawKey = `${KEY_PREFIX}${rawSuffix}`;
  const prefix = rawKey.substring(0, 16); // "aras_sk_" + first 8 chars of suffix

  const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);

  await ApiKey.create({
    userId,
    name,
    keyHash,
    prefix,
    isActive: true,
  });

  logger.info(`[ApiKey] Generated key "${name}" for user ${userId}`);
  return { rawKey, prefix, name };
}

/**
 * Validate an API key and return the associated user.
 * Used by the dual-auth middleware.
 */
export async function validateApiKey(rawKey: string): Promise<{ userId: string } | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) return null;

  const prefix = rawKey.substring(0, 16);
  const keys = await ApiKey.find({ prefix, isActive: true });

  for (const key of keys) {
    const valid = await bcrypt.compare(rawKey, key.keyHash);
    if (valid) {
      // Update last used
      key.lastUsedAt = new Date();
      await key.save();
      return { userId: key.userId.toString() };
    }
  }

  return null;
}

/**
 * List all active API keys for a user (without the hash).
 */
export async function listApiKeys(userId: string) {
  return ApiKey.find({ userId, isActive: true })
    .select('name prefix lastUsedAt createdAt')
    .sort({ createdAt: -1 });
}

/**
 * Revoke an API key by prefix.
 */
export async function revokeApiKey(userId: string, prefix: string): Promise<boolean> {
  const result = await ApiKey.findOneAndUpdate(
    { userId, prefix, isActive: true },
    { isActive: false, revokedAt: new Date() }
  );

  if (result) {
    logger.info(`[ApiKey] Revoked key "${prefix}" for user ${userId}`);
  }

  return !!result;
}
