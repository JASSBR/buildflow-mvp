import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';

async function postGreptileResponse() {
  try {
    // Try without auth first (some repos allow public comments)
    const octokit = new Octokit();

    console.log('Reading response content...');
    const responseContent = readFileSync('./greptile-response.md', 'utf-8');

    console.log('Posting response to OpenClaw PR #65906...');

    const response = await octokit.rest.issues.createComment({
      owner: 'openclaw',
      repo: 'openclaw',
      issue_number: 65906,
      body: responseContent
    });

    console.log('✅ Response posted successfully!');
    console.log(`Comment URL: ${response.data.html_url}`);
    console.log(`Comment ID: ${response.data.id}`);

    return response.data;

  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      console.log('❌ Authentication required to post comments');
      console.log('This is expected for public repos - the comment needs to be posted by someone with repo access');
      console.log('\nPrepared comment content has been saved to greptile-response.md');
      console.log('The PR author or a collaborator can copy and post this response.');
      return null;
    } else {
      console.error('Error posting comment:', error.message);
      return null;
    }
  }
}

// Run the posting
postGreptileResponse().then(result => {
  if (result) {
    console.log('\n🎉 Successfully posted comprehensive response to greptile-apps feedback!');
  } else {
    console.log('\n📝 Response content prepared and ready for manual posting by PR collaborators.');
  }
});