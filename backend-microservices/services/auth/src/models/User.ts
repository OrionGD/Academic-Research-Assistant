import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'premium';
  billingCycle?: 'monthly' | 'annual';
  subscriptionExpiresAt?: Date;
  lastPaymentAt?: Date;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  billingCycle: { type: String, enum: ['monthly', 'annual'] },
  subscriptionExpiresAt: { type: Date },
  lastPaymentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);
