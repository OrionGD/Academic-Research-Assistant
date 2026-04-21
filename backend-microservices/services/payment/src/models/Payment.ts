import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentEvent {
  type: string;
  timestamp: Date;
  metadata?: any;
}

export interface IPayment extends Document {
  userId: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number; // in paise
  plan: string;
  billingCycle: 'monthly' | 'annual';
  status: 'created' | 'attempted' | 'paid' | 'failed' | 'refunded';
  currency: string;
  events: IPaymentEvent[];
  lastPaymentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  userId: { type: String, required: true },
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, unique: true, sparse: true }, // Replay attack protection
  signature: { type: String },
  amount: { type: Number, required: true },
  plan: { type: String, required: true },
  billingCycle: { type: String, enum: ['monthly', 'annual'], required: true },
  status: { 
    type: String, 
    enum: ['created', 'attempted', 'paid', 'failed', 'refunded'], 
    default: 'created' 
  },
  currency: { type: String, default: 'INR' },
  events: [{
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }
  }],
  lastPaymentAt: { type: Date },
}, { timestamps: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
