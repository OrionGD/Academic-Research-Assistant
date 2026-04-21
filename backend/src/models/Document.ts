import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  status: 'processing' | 'preprocessing' | 'analyzing' | 'indexing' | 'completed' | 'failed';
  errorMessage?: string;
  authors: string[];
  year?: number;
  abstract?: string;
  keywords: string[];
  pageCount?: number;
  classification?: 'healthy' | 'suspicious' | 'scanned';
  extractionSummary?: {
    totalChars: number;
    avgCharsPerPage: number;
  };
  language?: string;
  canView: boolean;
  canDownload: boolean;
  lastViewedAt?: Date;
  downloadCount: number;
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
    status: { type: String, enum: ['processing', 'preprocessing', 'analyzing', 'indexing', 'completed', 'failed'], default: 'processing' },
    errorMessage: { type: String },
    authors: [{ type: String }],
    year: { type: Number },
    abstract: { type: String },
    keywords: [{ type: String }],
    pageCount: { type: Number },
    classification: { type: String, enum: ['healthy', 'suspicious', 'scanned'] },
    extractionSummary: {
      totalChars: { type: Number },
      avgCharsPerPage: { type: Number },
    },
    language: { type: String, default: 'en' },
    canView: { type: Boolean, default: true },
    canDownload: { type: Boolean, default: true },
    lastViewedAt: { type: Date },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DocumentSchema.index({ userId: 1, status: 1 });
DocumentSchema.index({ userId: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
