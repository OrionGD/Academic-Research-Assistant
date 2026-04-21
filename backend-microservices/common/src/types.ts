/**
 * Shared Type Definitions
 */

export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'premium';

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// Event Structure for Future Kafka Migration
export interface ServiceEvent<T = any> {
  type: string;
  version: string;
  timestamp: string;
  sender: string;
  data: T;
}

export enum EventType {
  USER_UPGRADED = 'USER_UPGRADED',
  USER_REGISTERED = 'USER_REGISTERED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED'
}
