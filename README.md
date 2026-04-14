# BuildFlow MVP

AI-powered CI/CD optimization platform that transforms slow, inefficient build pipelines into fast, intelligent deployment workflows.

## 🚀 Product Vision

"Make every CI/CD pipeline as fast and efficient as possible through intelligent automation."

## 📋 MVP Features

- **GitHub Integration**: OAuth integration with GitHub repositories
- **Pipeline Analysis**: Automatic workflow discovery and build time analysis  
- **Optimization Engine**: AI-powered recommendations for build improvements
- **Performance Dashboard**: Visual metrics and impact tracking
- **Landing Page**: Clear value proposition and onboarding flow

## 🏗️ Technical Stack

- **Frontend**: Next.js 14 + Tailwind CSS + TypeScript
- **Backend**: Next.js API Routes + Supabase
- **Database**: Supabase PostgreSQL
- **Authentication**: GitHub OAuth via Supabase Auth
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## 🗄️ Database Schema

```sql
-- Users table
users (id, github_id, email, name, avatar_url, created_at)

-- Connected repositories  
repositories (id, user_id, github_repo_id, name, full_name, connected_at)

-- Workflow analysis data
workflows (id, repository_id, workflow_name, file_path, average_duration, last_analyzed)

-- Build history data
builds (id, workflow_id, github_run_id, duration, status, completed_at)

-- Optimization recommendations
recommendations (id, workflow_id, type, title, description, potential_savings, status, created_at)
```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# GitHub API
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_pat
```

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/yassirsabbar/buildflow-mvp.git
   cd buildflow-mvp
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables
   ```

3. **Database Setup**
   ```bash
   # Run database migrations in Supabase dashboard
   # Import schema.sql file
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

## 📊 Success Metrics

### Primary KPIs
- **User Activation Rate**: 70%+ users connect at least 1 repository within 7 days
- **Recommendation Value**: Average 30%+ build time savings identified per repository
- **User Retention**: 20%+ weekly retention rate
- **Implementation Rate**: % of recommendations marked as "implemented"

### Technical Metrics  
- **Analysis Speed**: <30 seconds to analyze repository workflows
- **Platform Reliability**: 99%+ uptime
- **Page Load Time**: <2 seconds for dashboard

## 🎯 Target Audience

- **DevOps Engineers** managing multiple CI/CD pipelines
- **Engineering Team Leads** frustrated with slow builds
- **CTOs** looking to improve developer experience

## 🛣️ Roadmap

### Phase 1 (Week 1): Foundation
- ✅ Next.js project setup with Tailwind CSS
- ✅ Supabase database and authentication
- ✅ GitHub OAuth integration
- ✅ Basic landing page

### Phase 2 (Week 2): Core Analysis
- ✅ GitHub Actions API integration (`/api/github/repositories`)
- ✅ Workflow discovery and parsing (`/api/github/workflows/[repositoryId]`)
- ✅ Build time analysis engine (`/api/github/workflow-runs/[workflowId]`)
- ✅ Recommendations generation (`/api/recommendations/generate/[workflowId]`, `/api/recommendations/[id]`)

### Phase 3 (Week 3): Dashboard & UX
- [ ] User dashboard with repository overview
- [ ] Detailed repository analysis pages
- [ ] Recommendation display and tracking
- [ ] UI/UX polish

### Phase 4 (Week 4): Launch Preparation
- [ ] Performance optimization
- [ ] Error handling and edge cases
- [ ] Analytics implementation
- [ ] Production deployment

## 🚀 Deployment

This application is configured for deployment on Vercel with automatic GitHub integration:

1. **Vercel Setup**: Connect GitHub repository to Vercel project
2. **Environment Variables**: Configure all required env vars in Vercel dashboard
3. **Domain**: Configure custom domain if needed
4. **Monitoring**: Set up Vercel analytics and monitoring

## 🤝 Contributing

This is an MVP project. Development priorities:

1. **Core Functionality**: Focus on GitHub integration and analysis features
2. **Performance**: Optimize for <30 second analysis times
3. **User Experience**: Smooth onboarding and clear value demonstration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Yassir Sabbar**