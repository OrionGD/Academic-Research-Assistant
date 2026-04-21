import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  status: 'planning' | 'ongoing' | 'completed' | 'on-hold';
  supervisors: mongoose.Types.ObjectId[];
  collaborators: mongoose.Types.ObjectId[];
  milestones: { title: string; dueDate: Date; completed: boolean }[];
  associatedDocuments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['planning', 'ongoing', 'completed', 'on-hold'], default: 'planning' },
    supervisors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    milestones: [
      {
        title: { type: String },
        dueDate: { type: Date },
        completed: { type: Boolean, default: false }
      }
    ],
    associatedDocuments: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
