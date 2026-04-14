import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's GitHub access token from session
    const { data: { session } } = await supabase.auth.getSession();
    const githubToken = session?.provider_token;

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub access token not found. Please reconnect your GitHub account.' },
        { status: 401 }
      );
    }

    // Create GitHub client and fetch repositories
    const githubClient = createGitHubClient(githubToken);
    const repositories = await githubClient.getUserRepositories();

    // Check which repositories have workflows
    const repositoriesWithWorkflows = await Promise.all(
      repositories.map(async (repo) => {
        const [owner, repoName] = repo.full_name.split('/');
        const hasWorkflows = await githubClient.hasWorkflows(owner, repoName);
        return {
          ...repo,
          has_workflows: hasWorkflows
        };
      })
    );

    // Filter to only show repositories with workflows
    const workflowRepositories = repositoriesWithWorkflows.filter(repo => repo.has_workflows);

    return NextResponse.json({
      repositories: workflowRepositories,
      total: workflowRepositories.length
    });

  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch repositories from GitHub',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { repository_id, name, full_name, description, private: isPrivate, default_branch, html_url, clone_url } = body;

    if (!repository_id || !name || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: repository_id, name, full_name' },
        { status: 400 }
      );
    }

    // Check if repository is already connected
    const { data: existingRepo } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_repo_id', repository_id)
      .single();

    if (existingRepo) {
      return NextResponse.json(
        { error: 'Repository is already connected' },
        { status: 409 }
      );
    }

    // Insert new repository connection
    const { data: newRepo, error: insertError } = await supabase
      .from('repositories')
      .insert({
        user_id: user.id,
        github_repo_id: repository_id,
        name,
        full_name,
        description,
        private: isPrivate,
        default_branch,
        html_url,
        clone_url,
        connected_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting repository:', insertError);
      return NextResponse.json(
        { error: 'Failed to connect repository' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Repository connected successfully',
      repository: newRepo
    }, { status: 201 });

  } catch (error) {
    console.error('Error connecting repository:', error);
    return NextResponse.json(
      { error: 'Failed to connect repository' },
      { status: 500 }
    );
  }
}