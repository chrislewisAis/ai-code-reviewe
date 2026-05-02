import express from 'express';
import { Post } from './models/Post.js';
import { CostLog } from './models/System.js';
import mongoose from 'mongoose';

const app = express();
const port = process.env.PORT || 3000;

// MNC Requirement: API Security
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.MONITOR_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid MNC API Key' });
  }
  next();
};

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use(authenticate); // Secure all metrics endpoints

app.get('/metrics/costs', async (req, res) => {
  const totalCost = await CostLog.aggregate([
    { $group: { _id: null, total: { $sum: "$cost" }, tokens: { $sum: { $add: ["$promptTokens", "$completionTokens"] } } } }
  ]);
  res.json(totalCost[0] || { total: 0, tokens: 0 });
});

app.get('/metrics/content', async (req, res) => {
  const count = await Post.countDocuments();
  const byType = await Post.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
  res.json({ total_articles: count, distribution: byType });
});

export function startMonitoringServer() {
  app.listen(port, () => {
    console.log(`[Enterprise] Monitoring API live at http://localhost:${port}`);
  });
}
