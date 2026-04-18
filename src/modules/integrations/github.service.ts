import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import { config } from '../../config/index.js';

// @ts-ignore
const CustomOctokit = Octokit.plugin(retry);

export class GitHubService {
  private app: App;

  constructor() {
    this.app = new App({
      appId: config.github.appId,
      privateKey: config.github.privateKey,
      webhooks: {
        secret: config.github.webhookSecret,
      },
      Octokit: CustomOctokit as any,
    });
  }

  async getInstallationOctokit(installationId: number): Promise<Octokit> {
    return (await this.app.getInstallationOctokit(installationId)) as unknown as Octokit;
  }

  async getPullRequestDiff(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<string> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: {
        format: 'diff',
      },
    });

    return data as unknown as string;
  }

  async postPullRequestComment(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
    body: string
  ): Promise<void> {
    const octokit = await this.getInstallationOctokit(installationId);
    
    // Handle large comments by truncating or splitting
    // GitHub has a 65536 character limit
    const MAX_COMMENT_LENGTH = 65000;
    const commentBody = body.length > MAX_COMMENT_LENGTH 
      ? body.substring(0, MAX_COMMENT_LENGTH) + '\n\n... (comment truncated due to size limits)' 
      : body;

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: commentBody,
    });
  }
}

export const githubService = new GitHubService();
