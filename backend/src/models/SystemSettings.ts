import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings extends Document {
  require2FA: boolean;
  restrictAIToPeerReviewed: boolean;
  language: string;
  maintenanceMode: boolean;
  allowedUploadOrigins: string[];
  maxUploadMB: number;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    require2FA: { type: Boolean, default: false },
    restrictAIToPeerReviewed: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    maintenanceMode: { type: Boolean, default: false },
    allowedUploadOrigins: [{ type: String }],
    maxUploadMB: { type: Number, default: 50 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
