import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  senderRole: 'user' | 'admin';
  message: string;
  status: 'unread' | 'read';
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read'], default: 'unread', index: true },
  },
  { timestamps: true }
);

// Compound index for fast retrieval of a conversation between two parties
SupportMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

export const SupportMessage = mongoose.model<ISupportMessage>('SupportMessage', SupportMessageSchema);
