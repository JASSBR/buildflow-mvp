#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * CI/CD Monitoring Script
 * Scans all personal GitHub repos for failed workflow runs
 * Creates fix tasks in Paperclip when failures are detected
 */
class CICDMonitor {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    });

    this.paperclipConfig = {
      apiUrl: process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:4200',
      apiKey: process.env.PAPERCLIP_API_KEY,
      agentId: process.env.PAPERCLIP_AGENT_ID,
      companyId: process.env.PAPERCLIP_COMPANY_ID,
      runId: process.env.PAPERCLIP_RUN_ID,
      projectId: process.env.PAPERCLIP_PROJECT_ID || 'b030539e-5d3c-42ec-ab68-bca52145061a'
    };

    this.checkedRepos = new Set();
    this.failedWorkflows = [];
  }

  /**
   * Main monitoring function
   */
  async monitor() {
    console.log('🔍 Starting CI/CD monitoring scan...');
    console.log(`📅 Scan time: ${new Date().toISOString()}`);

    try {
      // Get authenticated user to identify personal repos
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      console.log(`👤 Monitoring repos for user: ${user.login}`);

      // Get all personal repositories
      const repos = await this.getAllPersonalRepos(user.login);
      console.log(`📁 Found ${repos.length} personal repositories`);

      // Check each repository for workflow failures
      for (const repo of repos) {
        await this.checkRepoWorkflows(repo);
      }

      // Generate report and create fix tasks
      await this.generateReport();

    } catch (error) {
      console.error('❌ Error during monitoring:', error.message);
      await this.createErrorTask(error);
    }
  }

  /**
   * Get all personal repositories for the authenticated user
   */
  async getAllPersonalRepos(username) {
    const repos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      try {
        const { data } = await this.octokit.rest.repos.listForUser({
          username,
          type: 'owner', // Only repos owned by the user
          sort: 'updated',
          direction: 'desc',
          per_page: perPage,
          page
        });

        if (data.length === 0) break;

        // Filter for non-archived, non-private repos with actions enabled
        const activeRepos = data.filter(repo =>
          !repo.archived &&
          !repo.disabled &&
          repo.has_issues // Basic indicator that repo is active
        );

        repos.push(...activeRepos);
        page++;

      } catch (error) {
        console.error(`Error fetching repos page ${page}:`, error.message);
        break;
      }
    }

    return repos;
  }

  /**
   * Check workflow runs for a specific repository
   */
  async checkRepoWorkflows(repo) {
    const repoKey = `${repo.owner.login}/${repo.name}`;

    if (this.checkedRepos.has(repoKey)) return;
    this.checkedRepos.add(repoKey);

    try {
      console.log(`🔍 Checking workflows for ${repoKey}...`);

      // Get workflow runs from the last 24 hours
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const { data: workflowRuns } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
        owner: repo.owner.login,
        repo: repo.name,
        status: 'completed',
        per_page: 50,
        created: `>${since.toISOString()}`
      });

      // Filter for failed runs
      const failedRuns = workflowRuns.workflow_runs.filter(run =>
        run.conclusion === 'failure' ||
        run.conclusion === 'cancelled' ||
        run.conclusion === 'timed_out'
      );

      if (failedRuns.length > 0) {
        console.log(`❌ Found ${failedRuns.length} failed workflow runs in ${repoKey}`);

        for (const run of failedRuns) {
          await this.analyzeFailedWorkflow(repo, run);
        }
      } else {
        console.log(`✅ No recent failures in ${repoKey}`);
      }

    } catch (error) {
      if (error.status === 404) {
        console.log(`⚠️  Actions not available for ${repoKey}`);
      } else {
        console.error(`Error checking workflows for ${repoKey}:`, error.message);
      }
    }
  }

  /**
   * Analyze a failed workflow run
   */
  async analyzeFailedWorkflow(repo, workflowRun) {
    const repoKey = `${repo.owner.login}/${repo.name}`;

    try {
      // Get workflow run jobs
      const { data: jobs } = await this.octokit.rest.actions.listJobsForWorkflowRun({
        owner: repo.owner.login,
        repo: repo.name,
        run_id: workflowRun.id
      });

      const failedJobs = jobs.jobs.filter(job => job.conclusion === 'failure');

      for (const job of failedJobs) {
        // Get job logs
        try {
          const { data: logs } = await this.octokit.rest.actions.downloadJobLogsForWorkflowRun({
            owner: repo.owner.login,
            repo: repo.name,
            job_id: job.id
          });

          const failure = {
            repo: repoKey,
            repoUrl: repo.html_url,
            workflowName: workflowRun.name,
            workflowUrl: workflowRun.html_url,
            jobName: job.name,
            conclusion: workflowRun.conclusion,
            createdAt: workflowRun.created_at,
            headCommit: workflowRun.head_commit,
            logs: logs || 'Logs not available',
            errorSummary: this.extractErrorSummary(logs)
          };

          this.failedWorkflows.push(failure);

        } catch (logError) {
          console.log(`⚠️  Could not fetch logs for job ${job.name}: ${logError.message}`);

          // Still record the failure even without logs
          this.failedWorkflows.push({
            repo: repoKey,
            repoUrl: repo.html_url,
            workflowName: workflowRun.name,
            workflowUrl: workflowRun.html_url,
            jobName: job.name,
            conclusion: workflowRun.conclusion,
            createdAt: workflowRun.created_at,
            headCommit: workflowRun.head_commit,
            logs: 'Logs not accessible',
            errorSummary: `${job.name} failed - logs not accessible`
          });
        }
      }

    } catch (error) {
      console.error(`Error analyzing workflow run ${workflowRun.id}:`, error.message);
    }
  }

  /**
   * Extract error summary from workflow logs
   */
  extractErrorSummary(logs) {
    if (!logs || typeof logs !== 'string') {
      return 'Error details not available';
    }

    const errorPatterns = [
      /Error: (.+)/gi,
      /Failed: (.+)/gi,
      /ERROR: (.+)/gi,
      /✗ (.+)/gi,
      /❌ (.+)/gi,
      /Build failed: (.+)/gi,
      /Test failed: (.+)/gi
    ];

    const errors = [];

    for (const pattern of errorPatterns) {
      const matches = logs.match(pattern);
      if (matches) {
        errors.push(...matches.slice(0, 3)); // Limit to first 3 matches per pattern
      }
    }

    if (errors.length === 0) {
      // Fallback: look for common failure indicators
      const lines = logs.split('\n');
      const errorLines = lines.filter(line =>
        line.toLowerCase().includes('error') ||
        line.toLowerCase().includes('failed') ||
        line.includes('❌') ||
        line.includes('✗')
      ).slice(0, 5);

      return errorLines.length > 0 ? errorLines.join('\n') : 'Workflow failed - specific error not identified';
    }

    return errors.slice(0, 5).join('\n'); // Limit to 5 errors max
  }

  /**
   * Generate monitoring report and create fix tasks
   */
  async generateReport() {
    console.log('\n📊 MONITORING REPORT');
    console.log('====================');
    console.log(`⏰ Scan completed at: ${new Date().toISOString()}`);
    console.log(`📁 Repositories checked: ${this.checkedRepos.size}`);
    console.log(`❌ Failed workflows found: ${this.failedWorkflows.length}`);

    if (this.failedWorkflows.length === 0) {
      console.log('✅ All workflows are passing!');
      return;
    }

    // Group failures by repository
    const failuresByRepo = {};
    for (const failure of this.failedWorkflows) {
      if (!failuresByRepo[failure.repo]) {
        failuresByRepo[failure.repo] = [];
      }
      failuresByRepo[failure.repo].push(failure);
    }

    console.log('\n🔥 FAILURES BY REPOSITORY:');
    for (const [repo, failures] of Object.entries(failuresByRepo)) {
      console.log(`\n${repo}:`);
      for (const failure of failures) {
        console.log(`  - ${failure.workflowName} / ${failure.jobName} (${failure.conclusion})`);
        console.log(`    💬 ${failure.errorSummary.split('\n')[0]}`);
        console.log(`    🔗 ${failure.workflowUrl}`);
      }

      // Create fix task for each repository with failures
      await this.createFixTask(repo, failures);
    }
  }

  /**
   * Create a Paperclip task to fix workflow failures
   */
  async createFixTask(repo, failures) {
    if (!this.paperclipConfig.apiKey || !this.paperclipConfig.companyId) {
      console.log(`⚠️  Paperclip not configured - skipping task creation for ${repo}`);
      return;
    }

    const errorSummaries = failures.map(f => `- ${f.workflowName}/${f.jobName}: ${f.errorSummary.split('\n')[0]}`).join('\n');

    const title = `Fix CI/CD failures in ${repo}`;
    const description = `## 🔥 Workflow Failures Detected

Repository: **${repo}**
Failed workflows: **${failures.length}**
Detected: **${new Date().toISOString()}**

### Failures Summary:
${errorSummaries}

### Action Items:
1. Review failed workflow logs: ${failures[0].workflowUrl}
2. Identify root cause of failures
3. Fix underlying issues (dependencies, tests, configuration)
4. Ensure all workflows pass before closing

### Workflow Links:
${failures.map(f => `- [${f.workflowName}](${f.workflowUrl})`).join('\n')}

*This task was automatically created by CI/CD monitoring.*`;

    try {
      const response = await fetch(`${this.paperclipConfig.apiUrl}/api/companies/${this.paperclipConfig.companyId}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.paperclipConfig.apiKey}`,
          'Content-Type': 'application/json',
          'X-Paperclip-Run-Id': this.paperclipConfig.runId
        },
        body: JSON.stringify({
          title,
          description,
          status: 'todo',
          priority: 'high',
          projectId: this.paperclipConfig.projectId,
          assigneeAgentId: this.paperclipConfig.agentId,
          billingCode: 'ci-cd-maintenance'
        })
      });

      if (response.ok) {
        const task = await response.json();
        console.log(`✅ Created fix task: ${task.identifier} - ${title}`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to create fix task: ${error}`);
      }

    } catch (error) {
      console.error(`❌ Error creating fix task for ${repo}:`, error.message);
    }
  }

  /**
   * Create an error task when monitoring itself fails
   */
  async createErrorTask(error) {
    if (!this.paperclipConfig.apiKey || !this.paperclipConfig.companyId) {
      return;
    }

    const title = 'CI/CD monitoring system error';
    const description = `## ⚠️ Monitoring System Error

**Error:** ${error.message}
**Time:** ${new Date().toISOString()}
**Stack:** \`\`\`
${error.stack || 'Stack trace not available'}
\`\`\`

### Action Items:
1. Check GitHub API authentication
2. Verify Paperclip API connectivity
3. Review monitoring script configuration
4. Fix any configuration or permission issues

*This error task was automatically created by CI/CD monitoring.*`;

    try {
      await fetch(`${this.paperclipConfig.apiUrl}/api/companies/${this.paperclipConfig.companyId}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.paperclipConfig.apiKey}`,
          'Content-Type': 'application/json',
          'X-Paperclip-Run-Id': this.paperclipConfig.runId
        },
        body: JSON.stringify({
          title,
          description,
          status: 'todo',
          priority: 'critical',
          projectId: this.paperclipConfig.projectId,
          assigneeAgentId: this.paperclipConfig.agentId,
          billingCode: 'system-maintenance'
        })
      });

      console.log('✅ Created error task for monitoring system failure');

    } catch (createError) {
      console.error('❌ Failed to create error task:', createError.message);
    }
  }
}

// Run monitoring if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new CICDMonitor();
  await monitor.monitor();
}

export default CICDMonitor;