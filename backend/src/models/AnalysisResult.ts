import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalysisResult extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  summary: string;
  keyInsights: string[];
  methodology: string;
  limitations: string;
  futureWork: string;
  citations: { chunkId: mongoose.Types.ObjectId; context: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisResultSchema = new Schema<IAnalysisResult>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    summary: { type: String, required: true },
    keyInsights: [{ type: String }],
    methodology: { type: String },
    limitations: { type: String },
    futureWork: { type: String },
    citations: [{
      chunkId: { type: Schema.Types.ObjectId, ref: 'DocumentChunk' },
      context: { type: String }
    }],
  },
  { timestamps: true }
);

export const AnalysisResult = mongoose.model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);
