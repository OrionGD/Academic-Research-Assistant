import mongoose, { Document, Schema } from 'mongoose';
import { PlanTier } from './User';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  razorpaySubscriptionId: string;
  razorpayOrderId?: string;
  razorpayPlanId: string;
  planTier: PlanTier;
  billingInterval: 'month' | 'year';
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  amountInr: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    razorpaySubscriptionId: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String },
    razorpayPlanId: { type: String, required: true },
    planTier: { type: String, enum: ['FREE', 'BASIC', 'STANDARD', 'PRO'], required: true },
    billingInterval: { type: String, enum: ['month', 'year'], required: true },
    status: { type: String, required: true },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },
    amountInr: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
