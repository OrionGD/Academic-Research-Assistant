import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageUrl: { type: String, required: true },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
