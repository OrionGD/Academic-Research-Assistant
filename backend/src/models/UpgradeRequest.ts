import mongoose, { Document, Schema } from 'mongoose';

export interface IUpgradeRequest extends Document {
  userId: mongoose.Types.ObjectId;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const UpgradeRequestSchema = new Schema<IUpgradeRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
  },
  { timestamps: true }
);

export const UpgradeRequest = mongoose.model<IUpgradeRequest>('UpgradeRequest', UpgradeRequestSchema);
