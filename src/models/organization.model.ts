import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  githubId: number;
  login: string;
  installationId: number;
  plan: 'free' | 'pro' | 'enterprise';
  limits: {
    concurrency: number;
    maxTokensPerMonth: number;
    maxDiffSize: number;
  };
  usage: {
    tokensThisMonth: number;
    jobsThisMonth: number;
  };
  featureFlags: {
    securityAgent: boolean;
    performanceAgent: boolean;
    architectureAgent: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema(
  {
    githubId: { type: Number, required: true, unique: true },
    login: { type: String, required: true },
    installationId: { type: Number, required: true },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    limits: {
      concurrency: { type: Number, default: 2 },
      maxTokensPerMonth: { type: Number, default: 1000000 },
      maxDiffSize: { type: Number, default: 512000 },
    },
    usage: {
      tokensThisMonth: { type: Number, default: 0 },
      jobsThisMonth: { type: Number, default: 0 },
    },
    featureFlags: {
      securityAgent: { type: Boolean, default: true },
      performanceAgent: { type: Boolean, default: true },
      architectureAgent: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
