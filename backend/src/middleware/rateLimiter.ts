import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request } from 'express';
import { redis } from '../config/redis';

const IS_DEV = process.env.NODE_ENV !== 'production';

// Common store for distributed rate limiting
const store = new RedisStore({
  // @ts-expect-error - ioredis compatibility
  sendCommand: (...args: string[]) => redis.call(...args),
});

/**
 * Strategy: Distributed Layered Rate Limiting
 */

function userOrIpKey(req: Request): string {
  return (req as any).user?.userId || req.ip || 'anonymous';
}

// ── Auth Limiter (Relaxed) ──────────────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: IS_DEV ? 100 : 20, 
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: {
    error: 'TOO_MANY_AUTH_ATTEMPTS',
    message: 'Too many authentication attempts. Please try again in 5 minutes.',
  }
});

// ── Public API Limiter (Moderate) ──────────────────────────────────────────
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: {
    error: 'PUBLIC_RATE_LIMIT',
    message: 'Too many requests to public APIs.'
  }
});

// ── User API Limiter (Strict per-user) ─────────────────────────────────────
export const userApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: (req: Request) => {
    const plan = (req as any).user?.planTier || 'FREE';
    switch (plan) {
      case 'PRO': return 100;
      case 'STANDARD': return 50;
      case 'BASIC': return 30;
      default: return 15;
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: userOrIpKey,
  message: {
    error: 'USER_RATE_LIMIT',
    message: 'API rate limit exceeded. Upgrade your plan for higher limits.',
  },
  skip: (req) => IS_DEV
});

// ── Admin API Limiter (Strict) ──────────────────────────────────────────────
export const adminApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: userOrIpKey,
  message: {
    error: 'ADMIN_RATE_LIMIT',
    message: 'Admin operation limit reached.'
  }
});

// ── AI/Heavy Ingestion Limiter ──────────────────────────────────────────────
export const aiHeavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: Request) => {
    const plan = (req as any).user?.planTier || 'FREE';
    return plan === 'PRO' ? 50 : 5;
  },
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: userOrIpKey,
  message: {
    error: 'AI_LATENCY_PROTECTION',
    message: 'High-intensity request limit reached. Please wait.'
  },
  skip: () => IS_DEV
});

// ── Backward Compatibility Aliases ────────────────────────────────────────
export const apiLimiter = userApiLimiter;
export const aiEndpointLimiter = aiHeavyLimiter;
export const uploadLimiter = aiHeavyLimiter;
