import { Octokit } from '@octokit/rest';

async function getPRDetails() {
  try {
    const octokit = new Octokit();

    console.log('Getting detailed information for OpenClaw PR #65906...\n');

    // Get PR details
    const { data: prData } = await octokit.rest.pulls.get({
      owner: 'openclaw',
      repo: 'openclaw',
      pull_number: 65906
    });

    console.log(`PR #${prData.number}: ${prData.title}`);
    console.log(`Author: ${prData.user.login}`);
    console.log(`Status: ${prData.state} (${prData.mergeable_state})`);
    console.log(`Created: ${prData.created_at}`);
    console.log(`Last updated: ${prData.updated_at}`);
    console.log(`\nDescription:\n${prData.body}\n`);

    // Get all comments with full details
    const { data: comments } = await octokit.rest.issues.listComments({
      owner: 'openclaw',
      repo: 'openclaw',
      issue_number: 65906
    });

    console.log(`\n=== ALL COMMENTS (${comments.length}) ===\n`);

    comments.forEach((comment, index) => {
      console.log(`Comment #${index + 1}`);
      console.log(`Author: ${comment.user.login}`);
      console.log(`Created: ${comment.created_at}`);
      console.log(`Updated: ${comment.updated_at}`);
      console.log(`Body:\n${comment.body}`);
      console.log('\n' + '='.repeat(60) + '\n');
    });

    // Get review comments (if any)
    const { data: reviewComments } = await octokit.rest.pulls.listReviewComments({
      owner: 'openclaw',
      repo: 'openclaw',
      pull_number: 65906
    });

    if (reviewComments.length > 0) {
      console.log(`\n=== REVIEW COMMENTS (${reviewComments.length}) ===\n`);

      reviewComments.forEach((comment, index) => {
        console.log(`Review Comment #${index + 1}`);
        console.log(`Author: ${comment.user.login}`);
        console.log(`File: ${comment.path}:${comment.position}`);
        console.log(`Created: ${comment.created_at}`);
        console.log(`Body:\n${comment.body}`);
        console.log('\n' + '='.repeat(60) + '\n');
      });
    }

    return { prData, comments, reviewComments };

  } catch (error) {
    console.error('Error getting PR details:', error.message);
    return null;
  }
}

// Run the detailed check
getPRDetails().then(result => {
  if (result) {
    console.log('\n✅ Retrieved detailed PR information');
  } else {
    console.log('\n❌ Failed to retrieve PR details');
  }
});