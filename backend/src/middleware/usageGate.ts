import { Request, Response, NextFunction } from 'express';
import { checkAndIncrementUsage, PlanLimitExceededError } from '../services/usageService';
import { UsageEventType } from '../models/UsageEvent';
import { PLAN_LIMITS, PlanTierKey } from '../config/razorpay';

/**
 * Middleware factory: checks usage quota before processing the request.
 * Records the event and increments counters on success.
 *
 * Usage:
 *   router.post('/upload', usageGate('upload'), uploadHandler)
 */
export function usageGate(eventType: UsageEventType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      await checkAndIncrementUsage(userId, eventType);
      next();
    } catch (error) {
      if (error instanceof PlanLimitExceededError) {
        const userPlan = ((req.user as any)?.planTier || 'free') as PlanTierKey;
        const limits = PLAN_LIMITS[userPlan];

        return res.status(429).json({
          error: 'USAGE_LIMIT_REACHED',
          message: error.message,
          limitType: error.limitType,
          current: error.current,
          limit: error.limit,
          planTier: error.planTier,
          upgradeUrl: '/pricing',
          // Friendly hint thresholds (for frontend warnings)
          warningAt: error.limit > 0 ? Math.floor(error.limit * 0.8) : null,
        });
      }
      next(error);
    }
  };
}
