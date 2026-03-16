import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Global limiter: 100 req / 15 min per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for AI-heavy endpoints: 20 req / 15 min per IP
export const aiEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI endpoint rate limit reached. Please wait before trying again.' },
  keyGenerator: (req) => {
    // Prefer user ID; fall back to IPv6-safe IP key
    return (req as any).user?._id?.toString() || ipKeyGenerator(req.ip ?? '');
  },
});

// Upload limiter: 10 uploads / 60 min per user
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit reached. Max 10 uploads per hour.' },
  keyGenerator: (req) => {
    return (req as any).user?._id?.toString() || ipKeyGenerator(req.ip ?? '');
  },
});
