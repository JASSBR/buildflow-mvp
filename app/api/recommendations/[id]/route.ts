import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const body = await request.json()

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the recommendation with workflow and repository info
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select(`
        *,
        workflows (
          id,
          workflow_name,
          repositories (
            user_id,
            full_name
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (recError || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Verify user owns the workflow
    if (recommendation.workflows.repositories.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { status, implementation_notes } = body

    // Validate status
    const validStatuses = ['pending', 'implemented', 'dismissed', 'in_progress']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'implemented') {
      updateData.implemented_at = new Date().toISOString()
    } else if (status === 'dismissed') {
      updateData.dismissed_at = new Date().toISOString()
    }

    if (implementation_notes) {
      updateData.implementation_notes = implementation_notes
    }

    // Update the recommendation
    const { data: updatedRecommendation, error: updateError } = await supabase
      .from('recommendations')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recommendation: updatedRecommendation,
    })

  } catch (error) {
    console.error('Error updating recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the recommendation with full details
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select(`
        *,
        workflows (
          id,
          workflow_name,
          file_path,
          average_duration,
          success_rate,
          repositories (
            user_id,
            name,
            full_name
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (recError || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Verify user owns the workflow
    if (recommendation.workflows.repositories.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      recommendation,
    })

  } catch (error) {
    console.error('Error fetching recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the recommendation to verify ownership
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select(`
        id,
        workflows!inner (
          repositories!inner (
            user_id
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (recError || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Verify user owns the workflow
    const workflow = Array.isArray(recommendation.workflows) ? recommendation.workflows[0] : recommendation.workflows
    const repository = Array.isArray(workflow.repositories) ? workflow.repositories[0] : workflow.repositories
    if (repository.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the recommendation
    const { error: deleteError } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete recommendation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Recommendation deleted successfully',
    })

  } catch (error) {
    console.error('Error deleting recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to delete recommendation' },
      { status: 500 }
    )
  }
}