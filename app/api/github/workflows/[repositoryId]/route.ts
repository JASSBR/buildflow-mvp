import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { Octokit } from '@octokit/rest'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repositoryId: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params object
    const { repositoryId } = await params

    // Get the repository from database
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .eq('user_id', session.user.id)
      .single()

    if (repoError || !repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Get user's GitHub token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('github_token')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile?.github_token) {
      return NextResponse.json({ error: 'GitHub token not found' }, { status: 400 })
    }

    // Initialize Octokit
    const octokit = new Octokit({
      auth: profile.github_token,
    })

    // Parse full_name to get owner and repo
    const [owner, repo] = repository.full_name.split('/')

    // Fetch workflows from GitHub API
    const { data: githubWorkflows } = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo,
    })

    // Process and store workflows in database
    const processedWorkflows = []

    for (const workflow of githubWorkflows.workflows) {
      // Get workflow file content
      let workflowContent = null
      try {
        const { data: fileContent } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: workflow.path,
        })

        if ('content' in fileContent) {
          workflowContent = Buffer.from(fileContent.content, 'base64').toString('utf8')
        }
      } catch (contentError) {
        console.error(`Error fetching workflow content for ${workflow.path}:`, contentError)
      }

      // Upsert workflow in database
      const { data: dbWorkflow, error: workflowError } = await supabase
        .from('workflows')
        .upsert({
          repository_id: repository.id,
          github_workflow_id: workflow.id,
          workflow_name: workflow.name,
          file_path: workflow.path,
          workflow_content: workflowContent ? { content: workflowContent } : null,
          is_active: workflow.state === 'active',
          last_analyzed: new Date().toISOString(),
        }, {
          onConflict: 'repository_id,file_path',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (!workflowError && dbWorkflow) {
        processedWorkflows.push({
          id: dbWorkflow.id,
          github_workflow_id: workflow.id,
          workflow_name: workflow.name,
          file_path: workflow.path,
          state: workflow.state,
          created_at: workflow.created_at,
          updated_at: workflow.updated_at,
          html_url: workflow.html_url,
          badge_url: workflow.badge_url,
        })
      }
    }

    return NextResponse.json({
      success: true,
      workflows: processedWorkflows,
      repository: {
        id: repository.id,
        name: repository.name,
        full_name: repository.full_name,
      },
    })

  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repositoryId: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params object
    const { repositoryId } = await params

    // Get the repository
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .eq('user_id', session.user.id)
      .single()

    if (repoError || !repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Update last_sync_at timestamp
    await supabase
      .from('repositories')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', repository.id)

    return NextResponse.json({
      success: true,
      message: 'Workflows sync initiated',
    })

  } catch (error) {
    console.error('Error syncing workflows:', error)
    return NextResponse.json(
      { error: 'Failed to sync workflows' },
      { status: 500 }
    )
  }
}