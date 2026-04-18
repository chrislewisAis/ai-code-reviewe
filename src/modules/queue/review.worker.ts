import { Worker, Job } from 'bullmq';
import { config } from '../../config/index.js';
import { IReviewJob } from './review.queue.js';
import { githubService } from '../integrations/github.service.js';
import { Organization } from '../../models/organization.model.js';
import { ReviewReport } from '../../models/review-report.model.js';
import { socketService } from '../realtime/socket.service.js';
import { workflow } from '../orchestration/langgraph.workflow.js';

export class ReviewWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'pr-review-queue',
      async (job: Job<IReviewJob>) => {
        try {
          return await this.processJob(job);
        } catch (error: any) {
          console.error(`Job ${job.id} failed:`, error);
          throw error; // Will trigger retry
        }
      },
      {
        connection: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
        },
        concurrency: 10, // Global concurrency
        stalledInterval: 30000,
      }
    );

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} permanently failed: ${err.message}`);
      // Log to MongoDB or external monitoring
    });
  }

  private async processJob(job: Job<IReviewJob>) {
    const { organizationId, installationId, owner, repo, pullNumber } = job.data;
    let { commitSha } = job.data;

    // 1. Fetch Organization & Check Limits
    const org = await Organization.findOne({ githubId: organizationId });
    if (!org) throw new Error('Organization not found');

    // 2. If manual trigger or missing SHA, fetch latest from GitHub
    if (!commitSha) {
      const octokit = await githubService.getInstallationOctokit(installationId);
      const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });
      commitSha = pr.head.sha;
    }

    // Emit Progress
    socketService.emitToRepo(repo, 'review:started', { pullNumber, commitSha });

    // 2. Fetch Diff
    const diff = await githubService.getPullRequestDiff(installationId, owner, repo, pullNumber);

    // 3. Diff Size Check
    if (diff.length > (org.limits.maxDiffSize || config.limits.maxDiffSize)) {
      await this.handleError(job, 'Diff size exceeds limit', org._id as any);
      return;
    }

    // 4. Execute LangGraph Workflow
    socketService.emitToRepo(repo, 'review:progress', { pullNumber, step: 'analyzing' });
    
    const result = await workflow.execute({
      diff,
      orgId: org._id as any,
      featureFlags: org.featureFlags,
    });

    // 5. Aggregate and Store Findings
    const report = await ReviewReport.create({
      organizationId: org._id,
      repositoryId: job.data.organizationId,
      pullNumber,
      commitSha: commitSha || 'latest',
      status: 'completed',
      results: result.findings,
      summary: result.summary,
      tokenUsage: result.tokenUsage,
    });

    // 6. Update Org Usage
    await Organization.updateOne(
      { _id: org._id },
      { 
        $inc: { 
          'usage.tokensThisMonth': result.tokenUsage.totalTokens,
          'usage.jobsThisMonth': 1
        } 
      }
    );

    // 7. Post Comments to GitHub
    socketService.emitToRepo(repo, 'review:progress', { pullNumber, step: 'posting_comments' });
    
    await githubService.postPullRequestComment(
      installationId,
      owner,
      repo,
      pullNumber,
      result.summary
    );

    socketService.emitToRepo(repo, 'review:completed', { pullNumber, reportId: report._id });
    
    return { reportId: report._id };
  }

  private async handleError(job: Job, message: string, orgId: string) {
    await ReviewReport.create({
      organizationId: orgId,
      repositoryId: job.data.organizationId,
      pullNumber: job.data.pullNumber,
      commitSha: job.data.commitSha || 'latest',
      status: 'failed',
      error: message,
    });
    
    socketService.emitToRepo(job.data.repo, 'review:failed', { pullNumber: job.data.pullNumber, error: message });
  }
}
