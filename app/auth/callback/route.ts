import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(requestUrl.origin)
  }

  const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed`)
  }

  // Persist the GitHub provider token so API routes can call the GitHub
  // API on behalf of the user. provider_token is only returned here — it
  // is not included in subsequent getSession() calls.
  if (data.session?.provider_token && data.user) {
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        github_token: data.session.provider_token,
        github_refresh_token: data.session.provider_refresh_token ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (upsertError) {
      console.error('Failed to persist GitHub token:', upsertError)
    }
  }

  return response
}
