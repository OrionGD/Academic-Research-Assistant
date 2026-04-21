import mongoose, { Document, Schema } from 'mongoose';

export type UsageEventType = 'upload' | 'query' | 'analysis' | 'export' | 'api_call';

export interface IUsageEvent extends Document {
  userId: mongoose.Types.ObjectId;
  eventType: UsageEventType;
  metadata?: Record<string, any>;
  periodMonth: string; // e.g. "2026-04" for easy monthly grouping
  createdAt: Date;
}

const UsageEventSchema = new Schema<IUsageEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventType: {
      type: String,
      enum: ['upload', 'query', 'analysis', 'export', 'api_call'],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
    periodMonth: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Compound index for fast monthly aggregation per user
UsageEventSchema.index({ userId: 1, periodMonth: 1, eventType: 1 });

export const UsageEvent = mongoose.model<IUsageEvent>('UsageEvent', UsageEventSchema);
