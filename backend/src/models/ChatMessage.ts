import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  message: string;
  sources?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    message: { type: String, required: true },
    sources: [{ type: Schema.Types.ObjectId, ref: 'DocumentChunk' }],
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
