import mongoose, { Document, Schema } from 'mongoose';

export interface IDocumentChunkMetadata {
  pageNumber?: number;
  section?: string;
  tokenCount?: number;
  [key: string]: any;
}

export interface IDocumentChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
  metadata: IDocumentChunkMetadata;
  createdAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    chunkText: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: {
      pageNumber: { type: Number },
      section: { type: String },
      tokenCount: { type: Number },
    },
  },
  { timestamps: true }
);

DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export const DocumentChunk = mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
