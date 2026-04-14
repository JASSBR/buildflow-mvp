import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Octokit } from '@octokit/rest'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's GitHub token from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('github_token')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile?.github_token) {
      return NextResponse.json({ error: 'GitHub token not found' }, { status: 400 })
    }

    // Initialize Octokit with user's token
    const octokit = new Octokit({
      auth: profile.github_token,
    })

    // Fetch user's repositories from GitHub
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    })

    // Filter repositories that have GitHub Actions workflows
    const reposWithActions = []

    for (const repo of repos) {
      try {
        // Check if repository has .github/workflows directory
        const { data: workflows } = await octokit.rest.actions.listRepoWorkflows({
          owner: repo.owner.login,
          repo: repo.name,
        })

        if (workflows.total_count > 0) {
          reposWithActions.push({
            github_repo_id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            default_branch: repo.default_branch,
            html_url: repo.html_url,
            clone_url: repo.clone_url,
            workflows_count: workflows.total_count,
          })
        }
      } catch {
        // Skip repositories where we can't access workflows
        continue
      }
    }

    return NextResponse.json({
      success: true,
      repositories: reposWithActions,
    })

  } catch (error) {
    console.error('Error fetching GitHub repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const body = await request.json()

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { github_repo_id, name, full_name, description, private: isPrivate, default_branch, html_url, clone_url } = body

    if (!github_repo_id || !name || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert or update repository in database
    const { data: repository, error: insertError } = await supabase
      .from('repositories')
      .upsert({
        user_id: session.user.id,
        github_repo_id,
        name,
        full_name,
        description,
        private: isPrivate,
        default_branch,
        html_url,
        clone_url,
        connected_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id,github_repo_id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error connecting repository:', insertError)
      return NextResponse.json(
        { error: 'Failed to connect repository' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      repository,
    })

  } catch (error) {
    console.error('Error connecting repository:', error)
    return NextResponse.json(
      { error: 'Failed to connect repository' },
      { status: 500 }
    )
  }
}