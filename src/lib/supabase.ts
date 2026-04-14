import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './supabase-types'

const duplicateTypes = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string,
          github_id: number | null,
          email: string | null,
          name: string | null,
          avatar_url: string | null,
          github_username: string | null,
          created_at: string,
          updated_at: string
        },
        Insert: {
          id: string,
          github_id?: number | null,
          email?: string | null,
          name?: string | null,
          avatar_url?: string | null,
          github_username?: string | null,
          created_at?: string,
          updated_at?: string
        }
        Update: {
          id?: string
          github_id?: number | null
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      repositories: {
        Row: {
          id: string
          user_id: string
          github_repo_id: number
          name: string
          full_name: string
          description: string | null
          private: boolean
          default_branch: string
          html_url: string | null
          clone_url: string | null
          connected_at: string
          last_sync_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          github_repo_id: number
          name: string
          full_name: string
          description?: string | null
          private?: boolean
          default_branch?: string
          html_url?: string | null
          clone_url?: string | null
          connected_at?: string
          last_sync_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          github_repo_id?: number
          name?: string
          full_name?: string
          description?: string | null
          private?: boolean
          default_branch?: string
          html_url?: string | null
          clone_url?: string | null
          connected_at?: string
          last_sync_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workflows: {
        Row: {
          id: string
          repository_id: string
          github_workflow_id: number | null
          workflow_name: string
          file_path: string
          workflow_content: any | null
          average_duration: number | null
          median_duration: number | null
          success_rate: number | null
          total_runs: number
          last_analyzed: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          repository_id: string
          github_workflow_id?: number | null
          workflow_name: string
          file_path: string
          workflow_content?: any | null
          average_duration?: number | null
          median_duration?: number | null
          success_rate?: number | null
          total_runs?: number
          last_analyzed?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          repository_id?: string
          github_workflow_id?: number | null
          workflow_name?: string
          file_path?: string
          workflow_content?: any | null
          average_duration?: number | null
          median_duration?: number | null
          success_rate?: number | null
          total_runs?: number
          last_analyzed?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recommendations: {
        Row: {
          id: string
          workflow_id: string
          type: string
          category: string
          title: string
          description: string
          implementation_guide: string | null
          potential_savings: number | null
          potential_savings_percentage: number | null
          priority: number
          status: string
          implemented_at: string | null
          dismissed_at: string | null
          implementation_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          type: string
          category: string
          title: string
          description: string
          implementation_guide?: string | null
          potential_savings?: number | null
          potential_savings_percentage?: number | null
          priority?: number
          status?: string
          implemented_at?: string | null
          dismissed_at?: string | null
          implementation_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          type?: string
          category?: string
          title?: string
          description?: string
          implementation_guide?: string | null
          potential_savings?: number | null
          potential_savings_percentage?: number | null
          priority?: number
          status?: string
          implemented_at?: string | null
          dismissed_at?: string | null
          implementation_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Type-safe client creation with explicit return typing
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Server-side Supabase client with explicit typing
export const createSupabaseServer = () => {
  return createServerComponentClient<Database>({ cookies })
}

// Export Database type for use in components
export type { Database }