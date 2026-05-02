import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

// Define Queues
export const trendQueue = new Queue('trend_queue', { connection });
export const keywordQueue = new Queue('keyword_queue', { connection });
export const contentQueue = new Queue('content_queue', { connection });
export const seoQueue = new Queue('seo_queue', { connection });
export const publishQueue = new Queue('publish_queue', { connection });
export const updateQueue = new Queue('update_queue', { connection });

// Queue Configuration
const defaultWorkerOptions = {
  connection,
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 1000 }
};

export function startWorkers(handlers) {
  new Worker('trend_queue', handlers.trend, defaultWorkerOptions);
  new Worker('keyword_queue', handlers.keyword, defaultWorkerOptions);
  new Worker('content_queue', handlers.content, defaultWorkerOptions);
  new Worker('seo_queue', handlers.seo, defaultWorkerOptions);
  new Worker('publish_queue', handlers.publish, defaultWorkerOptions);
  new Worker('update_queue', handlers.update, defaultWorkerOptions);
  
  console.log('[Queues] Workers started.');
}
