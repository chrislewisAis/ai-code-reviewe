import mongoose from 'mongoose';

const contentDNASchema = new mongoose.Schema({
  entity: { type: String, required: true },
  category: { type: String, required: true }, // definition, benefits, faq, statistics
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  embedding: [Number],
  source: String,
  qualityScore: Number,
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

contentDNASchema.index({ entity: 1, category: 1 });

export const ContentDNA = mongoose.model('ContentDNA', contentDNASchema);
