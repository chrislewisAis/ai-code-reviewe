import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  expiresAt: { type: Date, required: true }
});

const costLogSchema = new mongoose.Schema({
  agentName: String,
  model: String,
  promptTokens: Number,
  completionTokens: Number,
  cost: Number, // USD
  workflowId: String,
  timestamp: { type: Date, default: Date.now }
});

export const AICache = mongoose.model('AICache', cacheSchema);
export const CostLog = mongoose.model('CostLog', costLogSchema);
