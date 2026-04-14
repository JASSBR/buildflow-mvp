import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';

async function postComment() {
  try {
    const octokit = new Octokit();

    // Read comment content from file
    const commentBody = readFileSync('./pr-comment.md', 'utf8');

    const response = await octokit.rest.issues.createComment({
      owner: 'openclaw',
      repo: 'openclaw',
      issue_number: 65906,
      body: commentBody
    });

    console.log('✅ Comment posted successfully!');
    console.log('Comment ID:', response.data.id);
    console.log('Comment URL:', response.data.html_url);
    return response.data;

  } catch (error) {
    console.error('❌ Error posting comment:', error.message);
    if (error.status === 401) {
      console.log('💡 Note: Public repo comment requires authentication');
      console.log('💡 This is expected for unauthenticated requests to post comments');
    }
    return null;
  }
}

postComment();