import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Recommendation generation logic
function generateRecommendations(workflow: any, builds: any[], workflowContent?: string) {
  const recommendations = []

  // Analyze average build time
  if (workflow.average_duration > 300) { // > 5 minutes
    recommendations.push({
      type: 'caching',
      category: 'performance',
      title: 'Implement dependency caching',
      description: 'Your builds are taking longer than average. Implementing dependency caching can reduce build times significantly.',
      implementation_guide: `Add caching to your workflow:
\`\`\`yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: \${{ runner.os }}-node-\${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      \${{ runner.os }}-node-
\`\`\``,
      potential_savings: Math.round(workflow.average_duration * 0.3), // Estimate 30% savings
      potential_savings_percentage: 30,
      priority: 1, // High priority
    })
  }

  // Analyze success rate
  if (workflow.success_rate < 90) {
    recommendations.push({
      type: 'reliability',
      category: 'reliability',
      title: 'Improve build reliability',
      description: `Your build success rate is ${workflow.success_rate}%. Consider adding retry mechanisms and better error handling.`,
      implementation_guide: `Add retry logic for flaky steps:
\`\`\`yaml
- name: Install dependencies
  run: npm install
  timeout-minutes: 10
  # Add retries using continue-on-error
\`\`\``,
      potential_savings: 0,
      potential_savings_percentage: 0,
      priority: 1, // High priority for reliability
    })
  }

  // Analyze parallelization opportunities
  if (workflowContent) {
    const hasSequentialJobs = workflowContent.includes('needs:')
    const jobCount = (workflowContent.match(/\n\s*\w+:/g) || []).length

    if (jobCount > 1 && !hasSequentialJobs) {
      recommendations.push({
        type: 'parallelization',
        category: 'performance',
        title: 'Optimize job parallelization',
        description: 'Your workflow has multiple jobs that could potentially run in parallel to reduce overall build time.',
        implementation_guide: `Review job dependencies and parallelize independent jobs:
\`\`\`yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps: [...]

  lint:
    runs-on: ubuntu-latest
    steps: [...]

  deploy:
    runs-on: ubuntu-latest
    needs: [test, lint]  # Only deploy after test and lint pass
    steps: [...]
\`\`\``,
        potential_savings: Math.round(workflow.average_duration * 0.2), // Estimate 20% savings
        potential_savings_percentage: 20,
        priority: 2, // Medium priority
      })
    }
  }

  // Analyze runner optimization
  const recentBuilds = builds.slice(0, 10) // Last 10 builds
  const hasLongRunningJobs = recentBuilds.some(build =>
    build.jobs_data?.some((job: any) => job.duration > 600) // > 10 minutes
  )

  if (hasLongRunningJobs) {
    recommendations.push({
      type: 'resource_optimization',
      category: 'performance',
      title: 'Consider using larger runners',
      description: 'You have jobs that run for extended periods. Larger GitHub runners might provide better performance.',
      implementation_guide: `Consider upgrading to larger runners for resource-intensive jobs:
\`\`\`yaml
jobs:
  build:
    runs-on: ubuntu-latest-4-cores  # Or ubuntu-latest-8-cores
    steps: [...]
\`\`\``,
      potential_savings: Math.round(workflow.average_duration * 0.25), // Estimate 25% savings
      potential_savings_percentage: 25,
      priority: 2, // Medium priority
    })
  }

  // Analyze dependency optimization
  if (workflowContent && workflowContent.includes('npm install')) {
    if (!workflowContent.includes('npm ci')) {
      recommendations.push({
        type: 'dependency_optimization',
        category: 'performance',
        title: 'Use npm ci for faster installs',
        description: 'Replace "npm install" with "npm ci" for faster and more reliable dependency installation in CI environments.',
        implementation_guide: `Replace npm install with npm ci:
\`\`\`yaml
- name: Install dependencies
  run: npm ci  # Instead of npm install
\`\`\``,
        potential_savings: 30, // Estimate 30 seconds savings
        potential_savings_percentage: Math.round((30 / workflow.average_duration) * 100),
        priority: 2, // Medium priority
      })
    }
  }

  // Analyze build frequency patterns
  const dailyBuilds = builds.filter(build => {
    const buildDate = new Date(build.completed_at)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return buildDate > oneDayAgo
  })

  if (dailyBuilds.length > 20) { // More than 20 builds per day
    recommendations.push({
      type: 'resource_optimization',
      category: 'cost',
      title: 'Optimize build triggering',
      description: 'You have a high frequency of builds. Consider optimizing when builds are triggered to reduce costs.',
      implementation_guide: `Optimize build triggers:
\`\`\`yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
      - '*.md'
  pull_request:
    paths-ignore:
      - 'docs/**'
      - '*.md'
\`\`\``,
      potential_savings: 0,
      potential_savings_percentage: 0,
      priority: 3, // Low priority
    })
  }

  return recommendations
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the workflow with repository info
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select(`
        *,
        repositories (
          user_id,
          full_name
        )
      `)
      .eq('id', params.workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Verify user owns the repository
    if (workflow.repositories.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get recent builds for analysis
    const { data: builds, error: buildsError } = await supabase
      .from('builds')
      .select('*')
      .eq('workflow_id', workflow.id)
      .order('completed_at', { ascending: false })
      .limit(50)

    if (buildsError) {
      return NextResponse.json({ error: 'Failed to fetch builds' }, { status: 500 })
    }

    // Extract workflow content if available
    const workflowContent = workflow.workflow_content?.content

    // Generate recommendations
    const recommendations = generateRecommendations(workflow, builds || [], workflowContent)

    // Store recommendations in database
    const savedRecommendations = []

    for (const rec of recommendations) {
      // Check if similar recommendation already exists
      const { data: existingRec, error: checkError } = await supabase
        .from('recommendations')
        .select('id')
        .eq('workflow_id', workflow.id)
        .eq('type', rec.type)
        .eq('title', rec.title)
        .eq('status', 'pending')
        .single()

      if (!existingRec) {
        // Create new recommendation
        const { data: savedRec, error: saveError } = await supabase
          .from('recommendations')
          .insert({
            workflow_id: workflow.id,
            type: rec.type,
            category: rec.category,
            title: rec.title,
            description: rec.description,
            implementation_guide: rec.implementation_guide,
            potential_savings: rec.potential_savings,
            potential_savings_percentage: rec.potential_savings_percentage,
            priority: rec.priority,
            status: 'pending',
          })
          .select()
          .single()

        if (!saveError && savedRec) {
          savedRecommendations.push(savedRec)
        }
      } else {
        // Get existing recommendation
        const { data: existingRecData } = await supabase
          .from('recommendations')
          .select('*')
          .eq('id', existingRec.id)
          .single()

        if (existingRecData) {
          savedRecommendations.push(existingRecData)
        }
      }
    }

    return NextResponse.json({
      success: true,
      recommendations: savedRecommendations,
      workflow: {
        id: workflow.id,
        workflow_name: workflow.workflow_name,
        file_path: workflow.file_path,
      },
      analysis: {
        builds_analyzed: builds?.length || 0,
        average_duration: workflow.average_duration,
        success_rate: workflow.success_rate,
        recommendations_generated: savedRecommendations.length,
      },
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing recommendations for the workflow
    const { data: recommendations, error: recsError } = await supabase
      .from('recommendations')
      .select(`
        *,
        workflows (
          workflow_name,
          repositories (
            user_id,
            full_name
          )
        )
      `)
      .eq('workflow_id', params.workflowId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (recsError) {
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
    }

    // Verify user owns the workflow
    if (recommendations.length > 0 && recommendations[0].workflows.repositories.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      recommendations,
    })

  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}