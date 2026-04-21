import { Request, Response, NextFunction } from 'express';
import { PLAN_LIMITS, PlanTierKey } from '../config/razorpay';

const PLAN_RANK: Record<PlanTierKey, number> = {
  FREE: 0,
  BASIC: 1,
  STANDARD: 2,
  PRO: 3,
};

/**
 * Middleware factory: blocks access if user's plan is below required tier.
 * 
 * Usage:
 *   router.get('/premium-feature', planGate('pro'), handler)
 */
export function planGate(requiredPlan: PlanTierKey) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPlan = ((req.user as any)?.planTier || 'FREE') as PlanTierKey;
    const userRank = PLAN_RANK[userPlan] ?? 0;
    const requiredRank = PLAN_RANK[requiredPlan] ?? 0;

    if (userRank < requiredRank) {
      const limits = PLAN_LIMITS[requiredPlan];
      return res.status(403).json({
        error: 'PLAN_UPGRADE_REQUIRED',
        message: `This feature requires the ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan or higher.`,
        currentPlan: userPlan,
        requiredPlan,
        upgradeUrl: '/pricing',
      });
    }

    next();
  };
}
