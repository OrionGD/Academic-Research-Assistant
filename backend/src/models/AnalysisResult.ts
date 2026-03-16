import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalysisResult extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  summary: string;
  keyInsights: string[];
  methodology: string;
  results: string;
  limitations: string;
  futureWork: string;
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
    keyInsights: [{ type: String }],
    methodology: { type: String, default: '' },
    results: { type: String, default: '' },
    limitations: { type: String, default: '' },
    futureWork: { type: String, default: '' },
    citations: [{
      chunkId: { type: Schema.Types.ObjectId, ref: 'DocumentChunk' },
      context: { type: String }
    }],
    confidenceScore: { type: Number, min: 0, max: 1, default: 0 },
    modelVersion: { type: String, default: 'gemini-1.5-flash' },
    processingTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AnalysisResult = mongoose.model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);
