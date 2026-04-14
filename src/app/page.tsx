'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' && session?.user) {
          // Create or update user profile
          const userMetadata = session.user.user_metadata
          await supabase.from('profiles').upsert({
            id: session.user.id,
            github_id: userMetadata?.user_id,
            email: session.user.email,
            name: userMetadata?.full_name || userMetadata?.name,
            avatar_url: userMetadata?.avatar_url,
            github_username: userMetadata?.user_name,
            updated_at: new Date().toISOString()
          })

          // Redirect to dashboard
          router.push('/dashboard')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user user:email repo actions:read',
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('Error signing in with GitHub:', error.message)
    }
  }

  // Redirect authenticated users to dashboard
  if (!loading && user) {
    router.push('/dashboard')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          BuildFlow - AI-Powered CI/CD Optimization
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Transform slow, inefficient build pipelines into fast, intelligent deployment workflows with AI-powered optimization recommendations.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🚀 Speed Optimization
            </h3>
            <p className="text-gray-600">
              Reduce build times by 30%+ with intelligent pipeline analysis and optimization recommendations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🤖 AI-Powered Insights
            </h3>
            <p className="text-gray-600">
              Get smart suggestions for improving your GitHub Actions workflows based on best practices.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📊 Performance Analytics
            </h3>
            <p className="text-gray-600">
              Track build performance metrics and identify bottlenecks across your CI/CD pipelines.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-3">
              Ready to Optimize Your CI/CD?
            </h2>
            <p className="text-blue-700 mb-4">
              Connect your GitHub repository and get instant optimization recommendations.
            </p>
            <button
              onClick={signInWithGitHub}
              disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-3 mx-auto disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"></path>
                </svg>
              )}
              Continue with GitHub
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}