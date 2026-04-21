import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { User, IUser } from '../models/User';
import { signToken } from '../../../common/src/jwt';
import { EventBus } from '../../../common/src/events';
import { EventType } from '../../../common/src/types';

const eventBus = new EventBus('auth-service');
const GRACE_PERIOD_DAYS = 3;

/**
 * 🛡️ HELPER: Enforce Subscription Lifecycle (Grace Period Logic)
 */
const enforceSubscription = async (user: IUser): Promise<IUser> => {
  if (user.plan === 'free' || !user.subscriptionExpiresAt) return user;

  const now = dayjs();
  const expiry = dayjs(user.subscriptionExpiresAt);
  const deadline = expiry.add(GRACE_PERIOD_DAYS, 'day');

  if (now.isAfter(deadline)) {
    console.warn(`[AuthService] Downgrading user ${user.email}: Expired on ${expiry.format('YYYY-MM-DD')} (Grace period ended)`);
    user.plan = 'free';
    user.subscriptionExpiresAt = undefined;
    await user.save();
  } else if (now.isAfter(expiry)) {
    console.info(`[AuthService] User ${user.email} in grace period (Expired ${expiry.format('YYYY-MM-DD')})`);
  }

  return user;
};

// 🚀 Listen for upgrades from Payment Service
eventBus.subscribe(EventType.USER_UPGRADED, async (data) => {
  const { userId, plan, billingCycle, transactionId } = data;
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[AuthService] Upgrade error: User ${userId} not found`);
      return;
    }

    // SAFEGUARD: Prevent duplicate active subscriptions
    if (user.plan === 'premium' && user.subscriptionExpiresAt && dayjs().isBefore(dayjs(user.subscriptionExpiresAt))) {
      console.log(`[AuthService] User ${user.email} already has an active subscription. Skipping upgrade.`);
      return;
    }

    const duration = billingCycle === 'annual' ? 365 : 30;
    const expiresAt = dayjs().add(duration, 'day').toDate();

    user.plan = plan === 'premium' ? 'premium' : 'free';
    user.billingCycle = billingCycle;
    user.subscriptionExpiresAt = expiresAt;
    user.lastPaymentAt = new Date();
    
    await user.save();
    console.log(`[AuthService] UPGRADED_USER: ${user.email} | Plan: ${plan} | Cycle: ${billingCycle} | Expires: ${expiresAt}`);
  } catch (err) {
    console.error('[AuthService] Event processing error:', err);
  }
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name });

    const token = signToken({ id: user.id, email: user.email, role: user.role, plan: user.plan });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, plan: user.plan } });
    
    await eventBus.publish(EventType.USER_REGISTERED, { userId: user.id, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password!))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Enforce expiry check on login
    user = await enforceSubscription(user);

    const token = signToken({ id: user.id, email: user.email, role: user.role, plan: user.plan });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, plan: user.plan } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    let user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Enforce expiry check on profile fetch
    user = await enforceSubscription(user);

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
