import { Octokit } from '@octokit/rest';

// GitHub API client with authentication
export class GitHubClient {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  // Get user's repositories
  async getUserRepositories() {
    try {
      const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        type: 'all'
      });

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        default_branch: repo.default_branch || 'main',
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        updated_at: repo.updated_at,
        language: repo.language,
        has_workflows: false // Will be determined by checking .github/workflows
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  // Get workflows for a specific repository
  async getRepositoryWorkflows(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.rest.actions.listRepoWorkflows({
        owner,
        repo,
      });

      return data.workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        url: workflow.url,
        html_url: workflow.html_url,
        badge_url: workflow.badge_url
      }));
    } catch (error) {
      console.error(`Error fetching workflows for ${owner}/${repo}:`, error);
      throw new Error(`Failed to fetch workflows for ${owner}/${repo}`);
    }
  }

  // Get workflow runs for analysis
  async getWorkflowRuns(owner: string, repo: string, workflowId: number, limit: number = 50) {
    try {
      const { data } = await this.octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        per_page: limit,
        status: 'completed'
      });

      return data.workflow_runs.map(run => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        workflow_id: run.workflow_id,
        created_at: run.created_at,
        updated_at: run.updated_at,
        run_started_at: run.run_started_at,
        duration: this.calculateDuration(run.run_started_at, run.updated_at),
        html_url: run.html_url,
        head_branch: run.head_branch,
        head_sha: run.head_sha?.substring(0, 8), // Short SHA
        triggering_actor: run.triggering_actor?.login
      }));
    } catch (error) {
      console.error(`Error fetching workflow runs for workflow ${workflowId}:`, error);
      throw new Error(`Failed to fetch workflow runs`);
    }
  }

  // Get workflow jobs for detailed analysis
  async getWorkflowJobs(owner: string, repo: string, runId: number) {
    try {
      const { data } = await this.octokit.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

      return data.jobs.map(job => ({
        id: job.id,
        run_id: job.run_id,
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        duration: this.calculateDuration(job.started_at, job.completed_at),
        runner_name: job.runner_name,
        runner_group_name: job.runner_group_name,
        html_url: job.html_url,
        steps: job.steps?.map(step => ({
          name: step.name,
          status: step.status,
          conclusion: step.conclusion,
          number: step.number,
          started_at: step.started_at,
          completed_at: step.completed_at,
          duration: this.calculateDuration(step.started_at, step.completed_at)
        })) || []
      }));
    } catch (error) {
      console.error(`Error fetching jobs for run ${runId}:`, error);
      throw new Error(`Failed to fetch workflow jobs`);
    }
  }

  // Get workflow content for parsing
  async getWorkflowContent(owner: string, repo: string, path: string) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if ('content' in data && data.content) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return {
          content,
          sha: data.sha,
          path: data.path,
          name: data.name
        };
      }

      throw new Error('Could not retrieve workflow content');
    } catch (error) {
      console.error(`Error fetching workflow content for ${path}:`, error);
      throw new Error(`Failed to fetch workflow content`);
    }
  }

  // Calculate duration between two timestamps
  private calculateDuration(startTime: string | null, endTime: string | null): number {
    if (!startTime || !endTime) return 0;

    const start = new Date(startTime);
    const end = new Date(endTime);

    return Math.floor((end.getTime() - start.getTime()) / 1000); // Duration in seconds
  }

  // Check if repository has GitHub Actions workflows
  async hasWorkflows(owner: string, repo: string): Promise<boolean> {
    try {
      const workflows = await this.getRepositoryWorkflows(owner, repo);
      return workflows.length > 0;
    } catch {
      return false; // If we can't access workflows, assume no workflows
    }
  }
}

// Helper function to create GitHub client from access token
export function createGitHubClient(accessToken: string): GitHubClient {
  return new GitHubClient(accessToken);
}

// Types for TypeScript support
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  html_url: string;
  clone_url: string;
  updated_at: string;
  language: string | null;
  has_workflows: boolean;
}

export interface WorkflowSummary {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
}

export interface WorkflowRun {
  id: number;
  name: string | null;
  status: string | null;
  conclusion: string | null;
  workflow_id: number;
  created_at: string;
  updated_at: string | null;
  run_started_at: string | null;
  duration: number;
  html_url: string;
  head_branch: string | null;
  head_sha: string | null;
  triggering_actor: string | null;
}

export interface WorkflowJob {
  id: number;
  run_id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration: number;
  runner_name: string | null;
  runner_group_name: string | null;
  html_url: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
  duration: number;
}