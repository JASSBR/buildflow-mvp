# BuildFlow Database Setup

This directory contains the database schema and setup instructions for the BuildFlow MVP using Supabase PostgreSQL.

## Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Project name: **BuildFlow MVP**
3. Database password: Generate a strong password and save it securely
4. Region: Choose closest to your users (e.g., `us-east-1`)

### 2. Configure Authentication

1. Go to **Authentication > Providers** in Supabase dashboard
2. Enable **GitHub** provider
3. Configure GitHub OAuth:
   - Client ID: `[To be added from GitHub OAuth app]`
   - Client Secret: `[To be added from GitHub OAuth app]`
   - Redirect URL: `https://[your-project-ref].supabase.co/auth/v1/callback`

### 3. Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `schema.sql`
3. Click **Run** to execute the schema creation

### 4. Configure Row Level Security

The schema includes comprehensive RLS policies that ensure:
- Users can only access their own data
- Secure access to repositories, workflows, and recommendations
- Proper isolation between different users

### 5. Get Environment Variables

From your Supabase project dashboard:

1. **Project Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

2. Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema Overview

### Core Tables

1. **profiles** - User profile information (extends Supabase Auth)
2. **repositories** - Connected GitHub repositories
3. **workflows** - GitHub Actions workflow analysis data
4. **builds** - Historical build/run data
5. **recommendations** - AI-generated optimization recommendations
6. **workflow_jobs** - Detailed job-level analysis
7. **analytics_daily** - Daily aggregated metrics

### Key Features

- **UUID Primary Keys**: All tables use UUIDs for better security and scalability
- **Row Level Security**: Users can only access their own data
- **Automatic Timestamps**: `created_at` and `updated_at` fields with triggers
- **JSON Storage**: Flexible storage for GitHub API responses and workflow data
- **Optimized Indexes**: Performance indexes on frequently queried columns
- **Data Validation**: Check constraints for data integrity

### Security Considerations

1. **RLS Policies**: Every table has comprehensive RLS policies
2. **Minimal Permissions**: GitHub OAuth requests only necessary permissions
3. **Data Encryption**: Supabase handles encryption at rest and in transit
4. **Token Security**: GitHub OAuth tokens stored securely via Supabase Auth

## Development Workflow

### Local Development

1. Use Supabase CLI for local development:
```bash
npx supabase init
npx supabase start
```

2. Apply migrations:
```bash
npx supabase db push
```

### Production Deployment

1. Database migrations are automatically applied via Supabase dashboard
2. Environment variables configured in Vercel
3. RLS policies ensure data security in production

## Monitoring and Analytics

The schema includes built-in analytics capabilities:

- **Daily Metrics**: Aggregated build statistics per repository
- **Performance Tracking**: Build duration trends and success rates
- **Recommendation Tracking**: Implementation rates and time savings
- **User Analytics**: Activation and retention metrics

## Backup and Recovery

Supabase provides automated backups:
- **Point-in-time Recovery**: Available for paid plans
- **Automatic Backups**: Daily backups with 7-day retention on free plan
- **Manual Backups**: Can be triggered via dashboard or CLI

## Support

For database-related issues:
1. Check Supabase logs in the dashboard
2. Review RLS policies if access issues occur
3. Monitor query performance in Supabase insights
4. Use Supabase community support for platform issues