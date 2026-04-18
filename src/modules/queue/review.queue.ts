import { Queue, Job } from 'bullmq';
import { config } from '../../config/index.js';

export interface IReviewJob {
  organizationId: number;
  installationId: number;
  owner: string;
  repo: string;
  pullNumber: number;
  commitSha?: string; // Optional if manual trigger
  manualTrigger?: boolean;
}

export class ReviewQueue {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('pr-review-queue', {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  async addJob(data: IReviewJob) {
    // Enforce idempotency: repo:pr:commitSHA
    const jobId = `${data.repo}:${data.pullNumber}:${data.commitSha || 'latest'}`;
    
    await this.queue.add('review', data, {
      jobId,
      // Concurrency control per organization can be handled via 'group' if using BullMQ Pro
      // Or by checking active jobs in the worker logic (Standard BullMQ)
      // For now we use the standard approach.
    });
  }
}

export const reviewQueue = new ReviewQueue();
