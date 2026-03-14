import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemMetrics extends Document {
  date: Date;
  activeUsers: number;
  documentsProcessed: number;
  queriesExecuted: number;
  createdAt: Date;
  updatedAt: Date;
}

const SystemMetricsSchema = new Schema<ISystemMetrics>(
  {
    date: { type: Date, required: true, unique: true },
    activeUsers: { type: Number, default: 0 },
    documentsProcessed: { type: Number, default: 0 },
    queriesExecuted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SystemMetrics = mongoose.model<ISystemMetrics>('SystemMetrics', SystemMetricsSchema);
