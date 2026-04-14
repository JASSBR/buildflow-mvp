import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's connected repositories
    const { data: repositories, error: reposError } = await supabase
      .from('repositories')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('connected_at', { ascending: false })

    if (reposError) {
      console.error('Error fetching repositories:', reposError)
      return NextResponse.json(
        { error: 'Failed to fetch repositories' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      repositories: repositories || [],
    })

  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}