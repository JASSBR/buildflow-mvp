-- BuildFlow MVP Database Schema
-- Supabase PostgreSQL Schema for CI/CD Optimization Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- This extends the auth.users table with additional profile information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    github_id BIGINT UNIQUE,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    github_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected repositories table
CREATE TABLE IF NOT EXISTS public.repositories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    github_repo_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL, -- e.g., "owner/repo-name"
    description TEXT,
    private BOOLEAN DEFAULT false,
    default_branch TEXT DEFAULT 'main',
    html_url TEXT,
    clone_url TEXT,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, github_repo_id)
);

-- Workflow analysis data table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE NOT NULL,
    github_workflow_id BIGINT,
    workflow_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- e.g., ".github/workflows/ci.yml"
    workflow_content JSONB, -- Store the parsed YAML content
    average_duration INTEGER, -- Average duration in seconds
    median_duration INTEGER, -- Median duration in seconds
    success_rate DECIMAL(5,2), -- Success rate as percentage
    total_runs INTEGER DEFAULT 0,
    last_analyzed TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(repository_id, file_path)
);

-- Build history data table
CREATE TABLE IF NOT EXISTS public.builds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
    github_run_id BIGINT UNIQUE NOT NULL,
    run_number INTEGER,
    duration INTEGER, -- Duration in seconds
    status TEXT NOT NULL, -- 'completed', 'in_progress', 'queued', 'cancelled', 'failure'
    conclusion TEXT, -- 'success', 'failure', 'neutral', 'cancelled', 'skipped', 'timed_out'
    event TEXT, -- 'push', 'pull_request', 'schedule', etc.
    branch TEXT,
    commit_sha TEXT,
    jobs_data JSONB, -- Detailed job information
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (status IN ('completed', 'in_progress', 'queued', 'cancelled', 'failure')),
    CHECK (duration >= 0)
);

-- Optimization recommendations table
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'caching', 'parallelization', 'resource_optimization', 'dependency_optimization'
    category TEXT NOT NULL, -- 'performance', 'cost', 'reliability'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    implementation_guide TEXT, -- Step-by-step implementation instructions
    potential_savings INTEGER, -- Estimated time savings in seconds
    potential_savings_percentage DECIMAL(5,2), -- Estimated percentage improvement
    priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
    status TEXT DEFAULT 'pending', -- 'pending', 'implemented', 'dismissed', 'in_progress'
    implemented_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    implementation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (type IN ('caching', 'parallelization', 'resource_optimization', 'dependency_optimization')),
    CHECK (category IN ('performance', 'cost', 'reliability')),
    CHECK (status IN ('pending', 'implemented', 'dismissed', 'in_progress')),
    CHECK (priority IN (1, 2, 3)),
    CHECK (potential_savings >= 0),
    CHECK (potential_savings_percentage >= 0 AND potential_savings_percentage <= 100)
);

-- Workflow jobs analysis table (for detailed job-level insights)
CREATE TABLE IF NOT EXISTS public.workflow_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE NOT NULL,
    github_job_id BIGINT,
    job_name TEXT NOT NULL,
    runner_name TEXT,
    runner_os TEXT,
    duration INTEGER, -- Duration in seconds
    status TEXT NOT NULL,
    conclusion TEXT,
    steps_data JSONB, -- Detailed step information
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and metrics aggregation table
CREATE TABLE IF NOT EXISTS public.analytics_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_builds INTEGER DEFAULT 0,
    successful_builds INTEGER DEFAULT 0,
    failed_builds INTEGER DEFAULT 0,
    average_duration INTEGER, -- Average duration in seconds
    median_duration INTEGER, -- Median duration in seconds
    total_duration INTEGER, -- Total time spent on builds
    recommendations_generated INTEGER DEFAULT 0,
    recommendations_implemented INTEGER DEFAULT 0,
    estimated_time_saved INTEGER DEFAULT 0, -- Total estimated time saved in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(repository_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON public.repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_github_repo_id ON public.repositories(github_repo_id);
CREATE INDEX IF NOT EXISTS idx_workflows_repository_id ON public.workflows(repository_id);
CREATE INDEX IF NOT EXISTS idx_workflows_last_analyzed ON public.workflows(last_analyzed);
CREATE INDEX IF NOT EXISTS idx_builds_workflow_id ON public.builds(workflow_id);
CREATE INDEX IF NOT EXISTS idx_builds_github_run_id ON public.builds(github_run_id);
CREATE INDEX IF NOT EXISTS idx_builds_completed_at ON public.builds(completed_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_workflow_id ON public.recommendations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON public.recommendations(status);
CREATE INDEX IF NOT EXISTS idx_workflow_jobs_build_id ON public.workflow_jobs(build_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_repository_date ON public.analytics_daily(repository_id, date);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Repositories policies
CREATE POLICY "Users can view own repositories"
    ON public.repositories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own repositories"
    ON public.repositories FOR ALL
    USING (auth.uid() = user_id);

-- Workflows policies
CREATE POLICY "Users can view workflows of own repositories"
    ON public.workflows FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.repositories
        WHERE repositories.id = workflows.repository_id
        AND repositories.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage workflows of own repositories"
    ON public.workflows FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.repositories
        WHERE repositories.id = workflows.repository_id
        AND repositories.user_id = auth.uid()
    ));

-- Builds policies
CREATE POLICY "Users can view builds of own workflows"
    ON public.builds FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.workflows
        JOIN public.repositories ON repositories.id = workflows.repository_id
        WHERE workflows.id = builds.workflow_id
        AND repositories.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage builds of own workflows"
    ON public.builds FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.workflows
        JOIN public.repositories ON repositories.id = workflows.repository_id
        WHERE workflows.id = builds.workflow_id
        AND repositories.user_id = auth.uid()
    ));

-- Recommendations policies
CREATE POLICY "Users can view recommendations for own workflows"
    ON public.recommendations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.workflows
        JOIN public.repositories ON repositories.id = workflows.repository_id
        WHERE workflows.id = recommendations.workflow_id
        AND repositories.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage recommendations for own workflows"
    ON public.recommendations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.workflows
        JOIN public.repositories ON repositories.id = workflows.repository_id
        WHERE workflows.id = recommendations.workflow_id
        AND repositories.user_id = auth.uid()
    ));

-- Similar policies for workflow_jobs and analytics_daily tables
CREATE POLICY "Users can view workflow jobs of own builds"
    ON public.workflow_jobs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.builds
        JOIN public.workflows ON workflows.id = builds.workflow_id
        JOIN public.repositories ON repositories.id = workflows.repository_id
        WHERE builds.id = workflow_jobs.build_id
        AND repositories.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage workflow jobs of own builds"
    ON public.workflow_jobs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.builds
        JOIN public.workflows ON workflows.id = builds.workflow_id
        JOIN public.repositories ON repositories.id = workflows.repository_id
        WHERE builds.id = workflow_jobs.build_id
        AND repositories.user_id = auth.uid()
    ));

CREATE POLICY "Users can view analytics for own repositories"
    ON public.analytics_daily FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.repositories
        WHERE repositories.id = analytics_daily.repository_id
        AND repositories.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage analytics for own repositories"
    ON public.analytics_daily FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.repositories
        WHERE repositories.id = analytics_daily.repository_id
        AND repositories.user_id = auth.uid()
    ));

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON public.repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON public.recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development (optional)
-- This can be commented out for production deployment

/*
-- Sample profile (will be created automatically via Supabase Auth)
INSERT INTO public.profiles (id, github_id, email, name, github_username) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 12345678, 'developer@example.com', 'Sample Developer', 'sampledev')
ON CONFLICT (id) DO NOTHING;

-- Sample repository
INSERT INTO public.repositories (user_id, github_repo_id, name, full_name, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 87654321, 'sample-repo', 'sampledev/sample-repo', 'A sample repository for testing')
ON CONFLICT (user_id, github_repo_id) DO NOTHING;
*/