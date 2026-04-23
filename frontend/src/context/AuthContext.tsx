import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService } from '../shared/services/api/authService';
import { User, UsageSummary, SubscriptionInfo, PlanLimits } from '../types/api';
import { getUsage, getSubscription } from '../shared/services/api/billingService';
import { toast } from 'sonner';

const PLAN_LIMITS_MAP: Record<string, PlanLimits> = {
  FREE: { maxMonthlyUploads: 5, maxStorageMb: 50, maxMonthlyQueries: 20, apiAccess: false, maxApiKeys: 0 },
  BASIC: { maxMonthlyUploads: 50, maxStorageMb: 500, maxMonthlyQueries: 200, apiAccess: true, maxApiKeys: 2 },
  STANDARD: { maxMonthlyUploads: 200, maxStorageMb: 5000, maxMonthlyQueries: 1000, apiAccess: true, maxApiKeys: 3 },
  PRO: { maxMonthlyUploads: -1, maxStorageMb: -1, maxMonthlyQueries: -1, apiAccess: true, maxApiKeys: 5 },
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  subscription: SubscriptionInfo | null;
  usage: UsageSummary | null;
  planLimits: PlanLimits;
  planTier: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  guestCredits: number;
  guestId: string | null;
  isGuest: boolean;
  login: (email: string, pass: string) => Promise<string | void>;
  signup: (email: string, pass: string, name: string) => Promise<string | void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [guestCredits, setGuestCredits] = useState(100);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  const planTier = (user?.planTier || 'FREE') as 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  const planLimits = PLAN_LIMITS_MAP[planTier] || PLAN_LIMITS_MAP.FREE;

  const uploadsRemaining = usage
    ? planLimits.maxMonthlyUploads === -1
      ? Infinity
      : Math.max(0, planLimits.maxMonthlyUploads - usage.uploads.used)
    : planLimits.maxMonthlyUploads;

  const canUpload = planLimits.maxMonthlyUploads === -1 || uploadsRemaining > 0;
  const canQuery = planLimits.maxMonthlyQueries === -1 || (usage ? usage.queries.used < planLimits.maxMonthlyQueries : true);

  const loadBillingData = useCallback(async () => {
    try {
      const [subData, usageData] = await Promise.all([
        getSubscription().catch(() => null),
        getUsage().catch(() => null),
      ]);
      if (subData) setSubscription(subData);
      if (usageData) setUsage(usageData);
    } catch {
      // Non-critical
    }
  }, []);

  // Initialize: Check for active session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await authService.getMe();
        if (data.user) {
          setUser(data.user);
          setIsGuest(false);
          setGuestId(null);
          loadBillingData();
        } else if (data.isGuest) {
          setIsGuest(true);
          setGuestId(data.guestId);
          setGuestCredits(data.guestCredits);
        }
      } catch (err) {
        // Not logged in
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [loadBillingData]);

  const login = async (email: string, pass: string) => {
    const response = await authService.login({ email, password: pass });
    setUser(response.user);
    setIsGuest(false);
    toast.success('Successfully logged in!');
    loadBillingData();
    return response.redirectTo;
  };

  const signup = async (email: string, pass: string, name: string) => {
    const response = await authService.register({ email, password: pass, name });
    toast.success('Account created! Please login.');
    return response.redirectTo;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    setSubscription(null);
    setUsage(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const refreshUsage = async () => {
    await loadBillingData();
  };

  return (
    <AuthContext.Provider value={{
      user, loading, subscription, usage, planLimits, planTier,
      guestCredits, guestId, isGuest,
      login, signup, logout, refreshUser, refreshUsage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function usePlanAccess(required: 'BASIC' | 'STANDARD' | 'PRO'): boolean {
  const { planTier } = useAuth();
  const rank: Record<string, number> = { FREE: 0, BASIC: 1, STANDARD: 2, PRO: 3 };
  return (rank[planTier] || 0) >= (rank[required] || 0);
}
