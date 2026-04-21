import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalysisResult extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  summary: string;
  methodology: string;
  keyContributions: string[];
  keyConcepts: { term: string; definition: string }[];
  importantQuotes: { text: string; page: string | number }[];
  results: string;
  limitations: string;
  citations: { chunkId: mongoose.Types.ObjectId; context: string }[];
  confidenceScore: number;
  modelVersion: string;
  processingTime: number; // ms
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisResultSchema = new Schema<IAnalysisResult>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    summary: { type: String, required: true },
    methodology: { type: String, default: '' },
    keyContributions: [{ type: String }],
    keyConcepts: [{
      term: { type: String },
      definition: { type: String }
    }],
    importantQuotes: [{
      text: { type: String },
      page: { type: Schema.Types.Mixed }
    }],
    results: { type: String, default: '' },
    limitations: { type: String, default: '' },
    citations: [{
      chunkId: { type: Schema.Types.ObjectId, ref: 'DocumentChunk' },
      context: { type: String }
    }],
    confidenceScore: { type: Number, min: 0, max: 1, default: 0 },
    modelVersion: { type: String, default: 'gemini-2.0-flash' },
    processingTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AnalysisResult = mongoose.model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);
