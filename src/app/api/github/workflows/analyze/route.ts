import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    const { repository_id } = body;

    if (!repository_id) {
      return NextResponse.json(
        { error: 'repository_id is required' },
        { status: 400 }
      );
    }

    // Get repository from database
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repository_id)
      .eq('user_id', user.id)
      .single();

    if (repoError || !repository) {
      return NextResponse.json(
        { error: 'Repository not found or not authorized' },
        { status: 404 }
      );
    }

    // Get GitHub access token
    const { data: { session } } = await supabase.auth.getSession();
    const githubToken = session?.provider_token;

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub access token not found' },
        { status: 401 }
      );
    }

    // Parse owner and repo from full_name
    const [owner, repoName] = repository.full_name.split('/');

    // Create GitHub client and analyze workflows
    const githubClient = createGitHubClient(githubToken);

    // Get all workflows for the repository
    const workflows = await githubClient.getRepositoryWorkflows(owner, repoName);

    if (workflows.length === 0) {
      return NextResponse.json({
        message: 'No workflows found in this repository',
        workflows: [],
        analysis: null
      });
    }

    // Analyze each workflow
    const workflowAnalysis = await Promise.all(
      workflows.map(async (workflow) => {
        try {
          // Get recent workflow runs for analysis
          const runs = await githubClient.getWorkflowRuns(owner, repoName, workflow.id, 20);

          if (runs.length === 0) {
            return {
              workflow,
              runs: [],
              analysis: {
                average_duration: 0,
                median_duration: 0,
                success_rate: 0,
                total_runs: 0,
                recent_runs: 0
              }
            };
          }

          // Calculate performance metrics
          const successfulRuns = runs.filter(run => run.conclusion === 'success');
          const durations = runs
            .filter(run => run.duration > 0)
            .map(run => run.duration)
            .sort((a, b) => a - b);

          const averageDuration = durations.length > 0
            ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
            : 0;

          const medianDuration = durations.length > 0
            ? durations[Math.floor(durations.length / 2)]
            : 0;

          const successRate = runs.length > 0
            ? Math.round((successfulRuns.length / runs.length) * 100)
            : 0;

          return {
            workflow,
            runs: runs.slice(0, 10), // Return only latest 10 runs
            analysis: {
              average_duration: averageDuration,
              median_duration: medianDuration,
              success_rate: successRate,
              total_runs: runs.length,
              recent_runs: runs.length
            }
          };

        } catch (error) {
          console.error(`Error analyzing workflow ${workflow.name}:`, error);
          return {
            workflow,
            runs: [],
            analysis: {
              average_duration: 0,
              median_duration: 0,
              success_rate: 0,
              total_runs: 0,
              recent_runs: 0
            },
            error: 'Failed to analyze workflow'
          };
        }
      })
    );

    // Store workflow analysis results in database
    const workflowInserts = workflowAnalysis.map(({ workflow, analysis }) => ({
      repository_id: repository.id,
      github_workflow_id: workflow.id,
      workflow_name: workflow.name,
      file_path: workflow.path,
      average_duration: analysis.average_duration,
      median_duration: analysis.median_duration,
      success_rate: analysis.success_rate,
      last_analyzed: new Date().toISOString(),
      workflow_state: workflow.state
    }));

    // Upsert workflows (insert or update if exists)
    const { error: upsertError } = await supabase
      .from('workflows')
      .upsert(workflowInserts, {
        onConflict: 'repository_id,github_workflow_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error storing workflow analysis:', upsertError);
      // Continue execution, don't fail the entire request
    }

    // Update repository last_sync_at
    await supabase
      .from('repositories')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', repository_id);

    // Calculate overall repository metrics
    const totalDuration = workflowAnalysis.reduce((sum, w) => sum + w.analysis.average_duration, 0);
    const averageSuccessRate = workflowAnalysis.length > 0
      ? Math.round(workflowAnalysis.reduce((sum, w) => sum + w.analysis.success_rate, 0) / workflowAnalysis.length)
      : 0;

    const repositoryAnalysis = {
      total_workflows: workflows.length,
      total_average_duration: Math.round(totalDuration / workflows.length) || 0,
      overall_success_rate: averageSuccessRate,
      analyzed_at: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'Workflow analysis completed successfully',
      repository: {
        id: repository.id,
        name: repository.name,
        full_name: repository.full_name
      },
      workflows: workflowAnalysis,
      summary: repositoryAnalysis
    });

  } catch (error) {
    console.error('Error analyzing workflows:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze workflows',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}