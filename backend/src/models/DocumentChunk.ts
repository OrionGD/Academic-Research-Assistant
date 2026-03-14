import mongoose, { Document, Schema } from 'mongoose';

export interface IDocumentChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Added for multi-tenant isolation filtering
  chunkIndex: number;
  text: string; // Renamed to chunkText later, keeping `text` or `chunkText`. Will use chunkText.
  chunkText: string;
  embedding: number[];
  metadata: {
    pageNumber?: number;
    [key: string]: any;
  };
  createdAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    chunkText: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const DocumentChunk = mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
