import { User } from '../models/User';
import { UsageEvent, UsageEventType } from '../models/UsageEvent';
import { PLAN_LIMITS, PlanTierKey } from '../config/razorpay';
import { logger } from '../utils/logger';

/** Custom error thrown when a user exceeds their plan limit */
export class PlanLimitExceededError extends Error {
  constructor(
    public readonly limitType: string,
    public readonly current: number,
    public readonly limit: number,
    public readonly planTier: string
  ) {
    super(`Plan limit exceeded: ${limitType} (${current}/${limit}) on ${planTier} plan`);
    this.name = 'PlanLimitExceededError';
  }
}

/** Get current period month string "YYYY-MM" */
function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Check if user is within plan limits for a given event type.
 * If within limits, records the usage event and increments the counter.
 * Throws PlanLimitExceededError if limit is reached.
 */
export async function checkAndIncrementUsage(
  userId: string,
  eventType: UsageEventType,
  metadata?: Record<string, any>
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const limits = PLAN_LIMITS[user.planTier as PlanTierKey] || PLAN_LIMITS.FREE;

  if (eventType === 'upload') {
    const limit = limits.maxMonthlyUploads;
    if (limit !== -1 && user.monthlyUploads >= limit) {
      throw new PlanLimitExceededError('uploads', user.monthlyUploads, limit, user.planTier);
    }
    user.monthlyUploads += 1;
  } else if (eventType === 'query' || eventType === 'analysis') {
    const limit = limits.maxMonthlyQueries;
    if (limit !== -1 && user.monthlyQueries >= limit) {
      throw new PlanLimitExceededError('queries', user.monthlyQueries, limit, user.planTier);
    }
    user.monthlyQueries += 1;
  }

  await user.save();

  // Record event for analytics
  await UsageEvent.create({
    userId,
    eventType,
    metadata,
    periodMonth: currentPeriodMonth(),
  });

  logger.debug(`[Usage] ${eventType} recorded for user ${userId} (plan: ${user.planTier})`);
}

/** Get current usage summary for a user */
export async function getUserUsageSummary(userId: string) {
  const user = await User.findById(userId).select(
    'planTier monthlyUploads monthlyQueries storageUsedMb currentPeriodEnd'
  );
  if (!user) throw new Error('User not found');

  const limits = PLAN_LIMITS[user.planTier as PlanTierKey] || PLAN_LIMITS.FREE;

  return {
    planTier: user.planTier,
    uploads: {
      used: user.monthlyUploads,
      limit: limits.maxMonthlyUploads,
      percentage:
        limits.maxMonthlyUploads === -1
          ? 0
          : Math.round((user.monthlyUploads / limits.maxMonthlyUploads) * 100),
    },
    queries: {
      used: user.monthlyQueries,
      limit: limits.maxMonthlyQueries,
      percentage:
        limits.maxMonthlyQueries === -1
          ? 0
          : Math.round((user.monthlyQueries / limits.maxMonthlyQueries) * 100),
    },
    storage: {
      usedMb: user.storageUsedMb,
      limitMb: limits.maxStorageMb,
      percentage:
        limits.maxStorageMb === -1
          ? 0
          : Math.round((user.storageUsedMb / limits.maxStorageMb) * 100),
    },
    currentPeriodEnd: user.currentPeriodEnd,
  };
}

/** Reset monthly usage counters — called by Razorpay webhook on payment captured */
export async function resetMonthlyUsage(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    monthlyUploads: 0,
    monthlyQueries: 0,
  });
  logger.info(`[Usage] Reset monthly counters for user ${userId}`);
}

/** Increment storage usage for a user */
export async function incrementStorageUsage(userId: string, fileSizeMb: number): Promise<void> {
  await User.findByIdAndUpdate(userId, { $inc: { storageUsedMb: fileSizeMb } });
}

/** Decrement storage usage when a document is deleted */
export async function decrementStorageUsage(userId: string, fileSizeMb: number): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $inc: { storageUsedMb: Math.max(0, -fileSizeMb) },
  });
}
