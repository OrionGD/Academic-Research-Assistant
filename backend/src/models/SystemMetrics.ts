import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemMetrics extends Document {
  date: Date;
  activeUsers: number;
  documentsProcessed: number;
  queriesExecuted: number;
  apiCallsCount: number;
  storageBytes: number;
  errorCount: number;
  averageLatencyMs: number;
  createdAt: Date;
  updatedAt: Date;
}

const SystemMetricsSchema = new Schema<ISystemMetrics>(
  {
    date: { type: Date, required: true, unique: true, index: true },
    activeUsers: { type: Number, default: 0 },
    documentsProcessed: { type: Number, default: 0 },
    queriesExecuted: { type: Number, default: 0 },
    apiCallsCount: { type: Number, default: 0 },
    storageBytes: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    averageLatencyMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SystemMetrics = mongoose.model<ISystemMetrics>('SystemMetrics', SystemMetricsSchema);
