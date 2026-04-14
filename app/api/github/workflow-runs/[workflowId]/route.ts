import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Octokit } from '@octokit/rest'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await params
    const supabase = createServerComponentClient({ cookies })

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the workflow from database with repository info
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select(`
        *,
        repositories (
          user_id,
          full_name,
          github_repo_id
        )
      `)
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Verify user owns the repository
    if (workflow.repositories.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
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

    // Parse repository info
    const [owner, repo] = workflow.repositories.full_name.split('/')

    // Fetch recent workflow runs from GitHub API
    const { data: workflowRuns } = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflow.github_workflow_id,
      per_page: 50, // Get recent 50 runs
      status: 'completed', // Only get completed runs for analysis
    })

    // Process and store workflow runs
    const processedRuns = []

    for (const run of workflowRuns.workflow_runs) {
      // Calculate duration in seconds
      const duration = run.updated_at && run.run_started_at ?
        Math.round((new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()) / 1000) :
        null

      // Fetch jobs for this run to get detailed timing
      let jobsData = null
      try {
        const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
          owner,
          repo,
          run_id: run.id,
        })

        jobsData = jobs.jobs.map(job => ({
          id: job.id,
          name: job.name,
          status: job.status,
          conclusion: job.conclusion,
          duration: job.completed_at && job.started_at ?
            Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000) :
            null,
          runner_name: job.runner_name,
          runner_os: job.labels?.find(label => ['ubuntu', 'windows', 'macos'].some(os => label.includes(os))),
        }))

        // Store individual jobs in workflow_jobs table
        for (const job of jobs.jobs) {
          const jobDuration = job.completed_at && job.started_at ?
            Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000) :
            null

          await supabase
            .from('workflow_jobs')
            .upsert({
              build_id: null, // Will be set after build is created
              github_job_id: job.id,
              job_name: job.name,
              runner_name: job.runner_name,
              runner_os: job.labels?.find(label => ['ubuntu', 'windows', 'macos'].some(os => label.includes(os))),
              duration: jobDuration,
              status: job.status,
              conclusion: job.conclusion,
              steps_data: { steps: job.steps },
              started_at: job.started_at,
              completed_at: job.completed_at,
            }, {
              onConflict: 'github_job_id',
              ignoreDuplicates: false,
            })
        }

      } catch (jobsError) {
        console.error(`Error fetching jobs for run ${run.id}:`, jobsError)
      }

      // Store workflow run in builds table
      const { data: build, error: buildError } = await supabase
        .from('builds')
        .upsert({
          workflow_id: workflow.id,
          github_run_id: run.id,
          run_number: run.run_number,
          duration,
          status: run.status,
          conclusion: run.conclusion,
          event: run.event,
          branch: run.head_branch,
          commit_sha: run.head_sha,
          jobs_data: jobsData,
          completed_at: run.updated_at,
        }, {
          onConflict: 'github_run_id',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (!buildError && build) {
        // Update workflow_jobs with build_id
        if (jobsData) {
          for (const jobData of jobsData) {
            await supabase
              .from('workflow_jobs')
              .update({ build_id: build.id })
              .eq('github_job_id', jobData.id)
          }
        }

        processedRuns.push({
          id: build.id,
          github_run_id: run.id,
          run_number: run.run_number,
          duration,
          status: run.status,
          conclusion: run.conclusion,
          event: run.event,
          branch: run.head_branch,
          commit_sha: run.head_sha,
          html_url: run.html_url,
          completed_at: run.updated_at,
          jobs_count: jobsData?.length || 0,
        })
      }
    }

    // Calculate workflow statistics
    const completedRuns = processedRuns.filter(run => run.duration !== null)
    const durations = completedRuns.map(run => run.duration)

    const stats = {
      total_runs: processedRuns.length,
      completed_runs: completedRuns.length,
      average_duration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
      median_duration: durations.length > 0 ? durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)] : null,
      success_rate: processedRuns.length > 0 ?
        Math.round((processedRuns.filter(run => run.conclusion === 'success').length / processedRuns.length) * 100) : 0,
    }

    // Update workflow with calculated statistics
    await supabase
      .from('workflows')
      .update({
        average_duration: stats.average_duration,
        median_duration: stats.median_duration,
        success_rate: stats.success_rate,
        total_runs: stats.total_runs,
        last_analyzed: new Date().toISOString(),
      })
      .eq('id', workflow.id)

    return NextResponse.json({
      success: true,
      workflow_runs: processedRuns,
      statistics: stats,
      workflow: {
        id: workflow.id,
        workflow_name: workflow.workflow_name,
        file_path: workflow.file_path,
      },
    })

  } catch (error) {
    console.error('Error fetching workflow runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs' },
      { status: 500 }
    )
  }
}