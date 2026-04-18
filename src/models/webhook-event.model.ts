import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  githubId: string; // GitHub Delivery ID
  event: string;
  action: string;
  repositoryId: number;
  processed: boolean;
  createdAt: Date;
}

const WebhookEventSchema: Schema = new Schema(
  {
    githubId: { type: String, required: true, unique: true },
    event: { type: String, required: true },
    action: { type: String, required: true },
    repositoryId: { type: Number, required: true },
    processed: { type: Boolean, default: false },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // Auto-delete after 24h
  },
  { timestamps: true }
);

WebhookEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
