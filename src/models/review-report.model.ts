import mongoose, { Schema, Document } from 'mongoose';

export interface IReviewReport extends Document {
  organizationId: mongoose.Types.ObjectId;
  repositoryId: number;
  pullNumber: number;
  commitSha: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results: {
    agent: string;
    suggestions: Array<{
      file: string;
      line: number;
      message: string;
      severity: 'info' | 'warning' | 'critical';
    }>;
  }[];
  summary: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewReportSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    repositoryId: { type: Number, required: true },
    pullNumber: { type: Number, required: true },
    commitSha: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
    results: [
      {
        agent: String,
        suggestions: [
          {
            file: String,
            line: Number,
            message: String,
            severity: { type: String, enum: ['info', 'warning', 'critical'] },
          },
        ],
      },
    ],
    summary: String,
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
    },
    error: String,
  },
  { timestamps: true }
);

ReviewReportSchema.index({ repositoryId: 1, pullNumber: 1, commitSha: 1 }, { unique: true });

export const ReviewReport = mongoose.model<IReviewReport>('ReviewReport', ReviewReportSchema);
