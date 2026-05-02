import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: String,
  type: { type: String, enum: ['pillar', 'cluster'], required: true },
  parentPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  clusterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  keywords: [String],
  tags: [String],
  category: String,
  status: { type: String, enum: ['draft', 'scheduled', 'published', 'failed'], default: 'draft' },
  wpPostId: Number,
  scheduledAt: Date,
  seoData: {
    metaTitle: String,
    metaDesc: String,
    focusKeyword: String,
    score: Number
  },
  metrics: {
    position: Number,
    traffic: Number,
    lastChecked: Date
  }
}, { timestamps: true });

export const Post = mongoose.model('Post', postSchema);
