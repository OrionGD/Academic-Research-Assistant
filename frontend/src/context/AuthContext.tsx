import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService } from '../services/api/authService';
import { User, UsageSummary, SubscriptionInfo, PlanLimits } from '../types/api';
import { getUsage, getSubscription } from '../services/billingService';
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
  // SaaS additions
  subscription: SubscriptionInfo | null;
  usage: UsageSummary | null;
  planLimits: PlanLimits;
  planTier: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  canUpload: boolean;
  canQuery: boolean;
  uploadsRemaining: number;
  // Methods
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
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
    const token = localStorage.getItem('aras_token');
    if (!token) return;
    try {
      const [subData, usageData] = await Promise.all([
        getSubscription().catch(() => null),
        getUsage().catch(() => null),
      ]);
      if (subData) setSubscription(subData);
      if (usageData) setUsage(usageData);
    } catch {
      // Billing data is non-critical — fail silently
    }
  }, []);

  useEffect(() => {
    // Migration: Clear old Firebase-related data if not yet migrated
    const MIGRATION_KEY = 'aras_auth_migrated_v1';
    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.clear();
      localStorage.setItem(MIGRATION_KEY, 'true');
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem('aras_user');
    const token = localStorage.getItem('aras_token');
    if (storedUser && token) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      // Load billing in background
      loadBillingData();
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const response = await authService.login({ email, password: pass });
    localStorage.setItem('aras_token', response.token);
    localStorage.setItem('aras_user', JSON.stringify(response.user));
    setUser(response.user);
    toast.success('Successfully logged in!');
    // Load billing after login
    loadBillingData();
  };

  const signup = async (email: string, pass: string, name: string) => {
    const response = await authService.register({ email, password: pass, name });
    localStorage.setItem('aras_token', response.token);
    localStorage.setItem('aras_user', JSON.stringify(response.user));
    setUser(response.user);
    toast.success('Account created successfully!');
    loadBillingData();
  };

  const logout = () => {
    localStorage.removeItem('aras_token');
    localStorage.removeItem('aras_user');
    setUser(null);
    setSubscription(null);
    setUsage(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authService.getProfile();
      localStorage.setItem('aras_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
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
      canUpload, canQuery, uploadsRemaining,
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

/** Convenience hook for plan access check */
export function usePlanAccess(required: 'BASIC' | 'STANDARD' | 'PRO'): boolean {
  const { planTier } = useAuth();
  const rank: Record<string, number> = { FREE: 0, BASIC: 1, STANDARD: 2, PRO: 3 };
  return (rank[planTier] || 0) >= (rank[required] || 0);
}
