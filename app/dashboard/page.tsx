'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { trackUserFunnel, trackPagePerformance as _trackPagePerformance, trackError as _trackError } from '../components/GoogleAnalytics';

// Disable static generation for this page since it requires client-side authentication
export const dynamic = 'force-dynamic';

interface Repository {
  id: string;
  github_repo_id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  workflows_count?: number;
  is_active: boolean;
}

interface Workflow {
  id: string;
  workflow_name: string;
  file_path: string;
  average_duration: number;
  success_rate: number;
  total_runs: number;
}

interface Recommendation {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  implementation_guide: string;
  potential_savings: number;
  potential_savings_percentage: number;
  priority: number;
  status: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [_selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [connectingRepo, setConnectingRepo] = useState<number | null>(null);
  const [generatingRecs, setGeneratingRecs] = useState<string>('');
  const [updatingRecommendation, setUpdatingRecommendation] = useState<string>('');

  const supabase = createClientComponentClient();

  const checkUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth error:', error);
        return;
      }

      if (session) {
        setUser(session.user);
        trackUserFunnel.authSuccess();
        trackUserFunnel.dashboardView();
      } else {
        // Redirect to login or show login component
        console.log('No user session found');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, setUser, setLoading]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchConnectedRepositories();
    }
  }, [user]);

  const fetchConnectedRepositories = async () => {
    try {
      const response = await fetch('/api/repositories');
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  const fetchAvailableRepositories = async () => {
    try {
      const response = await fetch('/api/github/repositories');
      if (response.ok) {
        const data = await response.json();
        setAvailableRepos(data.repositories || []);
      }
    } catch (error) {
      console.error('Error fetching available repositories:', error);
    }
  };

  const connectRepository = async (repo: any) => {
    setConnectingRepo(repo.github_repo_id);

    try {
      const response = await fetch('/api/github/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repo),
      });

      if (response.ok) {
        await fetchConnectedRepositories();
        setAvailableRepos(prev => prev.filter(r => r.github_repo_id !== repo.github_repo_id));
      } else {
        console.error('Failed to connect repository');
      }
    } catch (error) {
      console.error('Error connecting repository:', error);
    } finally {
      setConnectingRepo(null);
    }
  };

  const fetchWorkflows = async (repositoryId: string) => {
    try {
      const response = await fetch(`/api/github/workflows/${repositoryId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const generateRecommendations = async (workflowId: string) => {
    setGeneratingRecs(workflowId);

    try {
      const response = await fetch(`/api/recommendations/generate/${workflowId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setSelectedWorkflow(workflowId);
      } else {
        console.error('Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setGeneratingRecs('');
    }
  };

  const updateRecommendationStatus = async (recommendationId: string, status: string) => {
    setUpdatingRecommendation(recommendationId);

    try {
      const response = await fetch(`/api/recommendations/${recommendationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Update the recommendation in the local state
        setRecommendations(prev =>
          prev.map(rec =>
            rec.id === recommendationId
              ? { ...rec, status }
              : rec
          )
        );
      } else {
        console.error('Failed to update recommendation status');
      }
    } catch (error) {
      console.error('Error updating recommendation:', error);
    } finally {
      setUpdatingRecommendation('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600 mb-8">You need to be authenticated to access the dashboard.</p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: 'github',
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            })}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BuildFlow Dashboard</h1>
              <p className="text-gray-600">Optimize your CI/CD pipelines with AI-powered recommendations</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connected Repositories Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Connected Repositories</h2>
            <button
              onClick={fetchAvailableRepositories}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Connect New Repository
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <div key={repo.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{repo.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{repo.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{repo.private ? 'Private' : 'Public'}</span>
                  <button
                    onClick={() => fetchWorkflows(repo.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Workflows
                  </button>
                </div>
              </div>
            ))}
          </div>

          {repositories.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">No repositories connected yet.</p>
              <p className="text-gray-500 text-sm">Connect a GitHub repository to get started with optimization recommendations.</p>
            </div>
          )}
        </section>

        {/* Available Repositories (when showing connect dialog) */}
        {availableRepos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available GitHub Repositories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRepos.map((repo) => (
                <div key={repo.github_repo_id} className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{repo.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{repo.description || 'No description'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {repo.workflows_count} workflow{repo.workflows_count !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => connectRepository(repo)}
                      disabled={connectingRepo === repo.github_repo_id}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {connectingRepo === repo.github_repo_id ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Workflows Section */}
        {workflows.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Workflows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{workflow.workflow_name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{workflow.file_path}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Avg Duration</p>
                      <p className="text-sm font-medium">{Math.round(workflow.average_duration / 60)} min</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Success Rate</p>
                      <p className="text-sm font-medium">{workflow.success_rate}%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => generateRecommendations(workflow.id)}
                    disabled={generatingRecs === workflow.id}
                    className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {generatingRecs === workflow.id ? 'Generating...' : 'Generate Recommendations'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Optimization Recommendations</h2>
            <div className="space-y-6">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.category === 'performance' ? 'bg-blue-100 text-blue-800' :
                          rec.category === 'cost' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {rec.category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 1 ? 'bg-red-100 text-red-800' :
                          rec.priority === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.priority === 1 ? 'High' : rec.priority === 2 ? 'Medium' : 'Low'} Priority
                        </span>
                        {rec.status && rec.status !== 'pending' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec.status === 'implemented' ? 'bg-green-100 text-green-800' :
                            rec.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {rec.status === 'implemented' ? 'Implemented' :
                             rec.status === 'dismissed' ? 'Dismissed' :
                             rec.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {rec.potential_savings > 0 && (
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          -{Math.round(rec.potential_savings / 60)}min
                        </p>
                        <p className="text-sm text-gray-500">
                          {rec.potential_savings_percentage}% faster
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">{rec.description}</p>

                  <details className="mb-4">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                      View Implementation Guide
                    </summary>
                    <div className="mt-2 p-4 bg-gray-50 rounded">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">{rec.implementation_guide}</pre>
                    </div>
                  </details>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateRecommendationStatus(rec.id, 'implemented')}
                      disabled={updatingRecommendation === rec.id}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingRecommendation === rec.id ? 'Updating...' : 'Mark as Implemented'}
                    </button>
                    <button
                      onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                      disabled={updatingRecommendation === rec.id}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingRecommendation === rec.id ? 'Updating...' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}