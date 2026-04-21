import mongoose, { Schema, Document } from 'mongoose';

export interface IFailedEvent extends Document {
  type: string;
  payload: any;
  status: 'pending' | 'completed' | 'dead';
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FailedEventSchema: Schema = new Schema({
  type: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'dead'], 
    default: 'pending' 
  },
  retryCount: { type: Number, default: 0 },
  lastError: { type: String },
}, { timestamps: true });

export const FailedEvent = mongoose.model<IFailedEvent>('FailedEvent', FailedEventSchema);
