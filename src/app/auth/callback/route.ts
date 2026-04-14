import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the code for a session
    const { data: _data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed`)
    }

    // Successfully authenticated, redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }

  // No code present, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}