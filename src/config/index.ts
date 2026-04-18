import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/ai-code-reviewer',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  github: {
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    defaultModel: process.env.DEFAULT_MODEL || 'openai/gpt-4o-mini',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'supersecret',
  },
  limits: {
    maxDiffSize: parseInt(process.env.MAX_DIFF_SIZE || '512000', 10), // Default 512KB
    maxTokensPerJob: parseInt(process.env.MAX_TOKENS_PER_JOB || '100000', 10),
  },
};

// Validate critical configs
const required = [
  'GITHUB_APP_ID',
  'GITHUB_PRIVATE_KEY',
  'GITHUB_WEBHOOK_SECRET',
  'OPENROUTER_API_KEY',
];

if (config.env === 'production') {
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Configuration Error: ${key} is required in production`);
    }
  });
}
