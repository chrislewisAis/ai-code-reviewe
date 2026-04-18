import crypto from 'crypto';
import { Request, Response } from 'express';
import { config } from '../../config/index.js';
import { WebhookEvent } from '../../models/webhook-event.model.js';
import { Organization } from '../../models/organization.model.js';
import { reviewQueue } from '../queue/review.queue.js';

export class GitHubWebhookHandler {
  async handle(req: Request, res: Response) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;

    if (!signature || !event || !deliveryId) {
      return res.status(400).send('Missing headers');
    }

    // 1. Verify Signature (HMAC SHA256)
    const hmac = crypto.createHmac('sha256', config.github.webhookSecret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

    if (!crypto.timingSafeEqual(Uint8Array.from(Buffer.from(signature)), Uint8Array.from(Buffer.from(digest)))) {
      return res.status(401).send('Invalid signature');
    }

    // 2. Prevent Replay Attacks / Deduplication
    const existingEvent = await WebhookEvent.findOne({ githubId: deliveryId });
    if (existingEvent) {
      return res.status(200).send('Event already processed');
    }

    const payload = req.body;
    const { repository, action, pull_request, installation } = payload;

    // We only care about PR opened or updated (synchronize)
    // Or manual trigger via comment (different event type 'issue_comment')
    if (event === 'pull_request' && (action === 'opened' || action === 'synchronize')) {
      await this.handlePullRequest(deliveryId, event, action, payload);
    } else if (event === 'issue_comment' && action === 'created') {
      await this.handleIssueComment(deliveryId, event, action, payload);
    }

    return res.status(202).send('Accepted');
  }

  private async handlePullRequest(deliveryId: string, event: string, action: string, payload: any) {
    const { repository, pull_request, installation } = payload;

    // Store event for deduplication
    await WebhookEvent.create({
      githubId: deliveryId,
      event,
      action,
      repositoryId: repository.id,
    });

    // Ensure Organization exists or update installationId
    await Organization.findOneAndUpdate(
      { githubId: repository.owner.id },
      { 
        login: repository.owner.login, 
        installationId: installation.id 
      },
      { upsert: true }
    );

    // Queue Job
    await reviewQueue.addJob({
      organizationId: repository.owner.id,
      installationId: installation.id,
      owner: repository.owner.login,
      repo: repository.name,
      pullNumber: pull_request.number,
      commitSha: pull_request.head.sha,
    });
  }

  private async handleIssueComment(deliveryId: string, event: string, action: string, payload: any) {
    const { repository, issue, comment, installation } = payload;

    if (!issue.pull_request) return; // Not a PR comment

    if (comment.body.trim() === '@ai-review run') {
      // Store event
      await WebhookEvent.create({
        githubId: deliveryId,
        event,
        action,
        repositoryId: repository.id,
      });

      // Fetch PR details to get the latest SHA (not in issue_comment payload)
      // This will be handled in the worker or we can fetch it here.
      // For simplicity, we queue with basic info and the worker will fetch the latest SHA.
      await reviewQueue.addJob({
        organizationId: repository.owner.id,
        installationId: installation.id,
        owner: repository.owner.login,
        repo: repository.name,
        pullNumber: issue.number,
        manualTrigger: true,
      });
    }
  }
}

export const githubWebhookHandler = new GitHubWebhookHandler();
