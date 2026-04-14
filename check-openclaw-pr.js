import { Octokit } from '@octokit/rest';

async function checkOpenClawPR() {
  try {
    // Try to initialize Octokit without auth first for public repos
    const octokit = new Octokit();

    console.log('Checking OpenClaw PR #65906...');

    // Common possibilities for OpenClaw repository
    const possibleRepos = [
      'openclaw/openclaw',
      'OpenClaw/OpenClaw',
      'microsoft/openclaw',
      'open-claw/openclaw'
    ];

    for (const repo of possibleRepos) {
      try {
        const [owner, repoName] = repo.split('/');
        console.log(`\nTrying repository: ${repo}`);

        // Check if repository exists
        const { data: repoData } = await octokit.rest.repos.get({
          owner,
          repo: repoName
        });

        console.log(`Found repository: ${repoData.full_name}`);
        console.log(`Description: ${repoData.description}`);

        // Check for PR #65906
        const { data: prData } = await octokit.rest.pulls.get({
          owner,
          repo: repoName,
          pull_number: 65906
        });

        console.log(`\nFound PR #65906: ${prData.title}`);
        console.log(`Status: ${prData.state}`);
        console.log(`Author: ${prData.user.login}`);
        console.log(`Created: ${prData.created_at}`);
        console.log(`Updated: ${prData.updated_at}`);

        // Get PR comments
        const { data: comments } = await octokit.rest.issues.listComments({
          owner,
          repo: repoName,
          issue_number: 65906
        });

        console.log(`\nTotal comments: ${comments.length}`);

        if (comments.length > 0) {
          console.log('\nRecent comments:');
          const recentComments = comments.slice(-3); // Show last 3 comments
          for (const comment of recentComments) {
            console.log(`- ${comment.user.login} (${comment.created_at}): ${comment.body.substring(0, 100)}...`);
          }
        }

        return { repo, prData, comments };

      } catch (error) {
        if (error.status === 404) {
          console.log(`Repository ${repo} not found or PR #65906 doesn't exist`);
        } else {
          console.log(`Error checking ${repo}:`, error.message);
        }
      }
    }

    console.log('\nCould not find OpenClaw PR #65906 in any of the common repository patterns.');
    return null;

  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Run the check
checkOpenClawPR().then(result => {
  if (result) {
    console.log('\n✅ Successfully checked OpenClaw PR #65906');
  } else {
    console.log('\n❌ Could not find or access OpenClaw PR #65906');
  }
});