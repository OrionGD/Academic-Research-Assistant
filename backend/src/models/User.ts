import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'user' | 'admin' | 'researcher' | 'reviewer';
export type PlanTier = 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'inactive';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  name?: string;
  photoURL?: string;
  role: UserRole;
  planTier: PlanTier;
  authProviders: string[];
  // Legacy fields (kept for backward compat, Razorpay is source of truth)
  plan: PlanTier;
  upgradeRequestStatus: string;
  paymentStatus: string;
  // Razorpay
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  // Usage (reset monthly by webhook)
  monthlyUploads: number;
  monthlyQueries: number;
  storageUsedMb: number;
  // Profile
  lastLoginAt?: Date;
  documentCount: number;
  institution?: string;
  field?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    photoURL: { type: String },
    role: { type: String, enum: ['user', 'admin', 'researcher', 'reviewer'], default: 'user' },
    planTier: { type: String, enum: ['FREE', 'BASIC', 'STANDARD', 'PRO'], default: 'FREE' },
    authProviders: { type: [String], default: [] },
    // Legacy aliases
    plan: { type: String, enum: ['FREE', 'BASIC', 'STANDARD', 'PRO', 'premium'], default: 'FREE' },
    upgradeRequestStatus: { type: String, default: 'none' },
    paymentStatus: { type: String, default: 'pending' },
    // Razorpay
    razorpayCustomerId: { type: String, sparse: true, index: true },
    razorpaySubscriptionId: { type: String, sparse: true },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing', 'inactive'],
      default: 'inactive',
    },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    // Usage
    monthlyUploads: { type: Number, default: 0 },
    monthlyQueries: { type: Number, default: 0 },
    storageUsedMb: { type: Number, default: 0 },
    // Profile
    lastLoginAt: { type: Date },
    documentCount: { type: Number, default: 0 },
    institution: { type: String },
    field: { type: String },
    bio: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
