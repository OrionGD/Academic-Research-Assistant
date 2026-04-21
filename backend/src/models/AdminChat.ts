import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminChat extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
}

const AdminChatSchema = new Schema<IAdminChat>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AdminChat = mongoose.model<IAdminChat>('AdminChat', AdminChatSchema);
