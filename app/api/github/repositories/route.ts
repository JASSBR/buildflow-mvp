import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getSupabaseServerClient } from '@/lib/supabase-server'

async function getGithubToken(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('github_token')
    .eq('id', userId)
    .maybeSingle()
  return data?.github_token ?? null
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await getGithubToken(supabase, session.user.id)
    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token not found. Please sign in again to grant repository access.' },
        { status: 400 }
      )
    }

    const octokit = new Octokit({ auth: token })

    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    })

    const reposWithActions = []
    for (const repo of repos) {
      try {
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
        continue
      }
    }

    return NextResponse.json({ success: true, repositories: reposWithActions })
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error)
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { github_repo_id, name, full_name, description, private: isPrivate, default_branch, html_url, clone_url } = body

    if (!github_repo_id || !name || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Failed to connect repository' }, { status: 500 })
    }

    return NextResponse.json({ success: true, repository })
  } catch (error) {
    console.error('Error connecting repository:', error)
    return NextResponse.json({ error: 'Failed to connect repository' }, { status: 500 })
  }
}
