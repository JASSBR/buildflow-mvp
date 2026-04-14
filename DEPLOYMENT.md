# BuildFlow MVP - Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for setting up and deploying the BuildFlow MVP application. The infrastructure is configured for **Next.js 14 + Tailwind CSS + TypeScript + Supabase** stack with automated CI/CD via GitHub Actions and Vercel.

## 🔧 Prerequisites

- Node.js 18+ installed
- GitHub account
- Vercel account (connected to GitHub)
- Supabase account
- Git installed and configured

## 🚀 Initial Setup

### 1. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub OAuth Configuration  
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000  # Change for production
NEXTAUTH_SECRET=your_nextauth_secret  # Generate: openssl rand -base64 32

# GitHub API
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_pat

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS=true
```

### 2. Supabase Setup

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Database Schema:**
   - Run database migrations from `database/` folder
   - Set up Row Level Security (RLS) policies
   - Configure OAuth providers in Authentication settings

3. **GitHub OAuth in Supabase:**
   - Go to Authentication > Providers > GitHub
   - Enable GitHub provider
   - Add your GitHub OAuth app credentials

### 3. GitHub OAuth App Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App with:
   - **Application name:** BuildFlow MVP
   - **Homepage URL:** Your Vercel domain
   - **Authorization callback URL:** `https://your-domain.vercel.app/api/auth/callback/github`
3. Copy Client ID and Client Secret to `.env.local`

## 🏗️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint
```

Access the application at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

## 🚀 Deployment

### Quick Deployment with Railway (New - Immediate Option)

**⚡ For immediate deployment without complex token setup:**

1. **Connect to Railway:**
   - Visit [railway.app](https://railway.app) 
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `JASSBR/buildflow-mvp` repository

2. **Automatic Configuration:**
   - Railway auto-detects `railway.toml` configuration
   - Uses Nixpacks for optimized Node.js builds
   - Provides instant HTTPS domain (`*.railway.app`)

3. **Environment Variables in Railway:**
   ```bash
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   
   # Add when ready:
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GITHUB_CLIENT_ID=your_github_oauth_client_id
   GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Deploy:** Push to main branch triggers automatic deployment

**⭐ Benefits:**
- ✅ No complex token configuration required
- ✅ 5-minute setup from repository to live URL
- ✅ Automatic SSL certificates
- ✅ GitHub integration out-of-the-box
- ✅ Can migrate to Vercel later without code changes

### Automated Deployment (Traditional)

The project uses **GitHub Actions + Vercel** for automated deployments:

**Triggers:**
- **Pull Requests → Preview deployments**
- **Push to `main` → Production deployment**

**CI/CD Pipeline includes:**
1. ESLint code quality checks
2. TypeScript type checking
3. Application build verification
4. Security scanning (npm audit + Snyk)
5. Automatic Vercel deployment

### Vercel Configuration

1. **Import GitHub Repository:**
   - Connect Vercel account to GitHub
   - Import `buildflow-mvp` repository
   - Vercel auto-detects Next.js framework

2. **Environment Variables in Vercel:**
   ```bash
   # Production URLs
   NEXTAUTH_URL=https://your-domain.vercel.app
   
   # Copy all other variables from .env.local
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   # ... etc
   ```

3. **GitHub Actions Secrets:**
   Add these secrets in GitHub repository settings:
   ```bash
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_vercel_org_id  
   VERCEL_PROJECT_ID=your_vercel_project_id
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SNYK_TOKEN=your_snyk_token  # Optional for security scanning
   ```

## 🔐 Security & Environment Management

### Required Secrets

| Environment | Variable | Source |
|-------------|----------|---------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project API settings |
| **Supabase** | `SUPABASE_SERVICE_ROLE_KEY` | Supabase project API settings |
| **GitHub** | `GITHUB_CLIENT_ID` | GitHub OAuth app |
| **GitHub** | `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| **GitHub** | `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub personal settings |
| **NextAuth** | `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| **Vercel** | `VERCEL_TOKEN` | Vercel account settings |

### Security Headers

The `vercel.json` configuration includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff  
- X-XSS-Protection: 1; mode=block

## 📊 Monitoring & Analytics

- **Vercel Analytics:** Enabled via `NEXT_PUBLIC_VERCEL_ANALYTICS=true`
- **Error Monitoring:** Configure Sentry/LogRocket for production
- **Performance:** Monitor Core Web Vitals in Vercel dashboard

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails:**
   - Check TypeScript errors: `npm run type-check`
   - Verify environment variables are set
   - Ensure all dependencies are installed: `npm ci`

2. **Supabase Connection:**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Validate RLS policies

3. **GitHub OAuth:**
   - Confirm callback URL matches exactly
   - Check OAuth app permissions
   - Verify client ID/secret

4. **Vercel Deployment:**
   - Check build logs in Vercel dashboard
   - Validate environment variables are set
   - Ensure repository access permissions

### Support Contacts

- **DevOps Agent:** Infrastructure and deployment issues
- **Full-Stack Developer:** Application code and features  
- **Product Manager:** Requirements and specifications

---

## 📅 Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase project created and configured
- [ ] GitHub OAuth app setup
- [ ] Vercel project connected
- [ ] GitHub Actions secrets configured
- [ ] Database schema migrated
- [ ] OAuth providers enabled
- [ ] Security headers validated
- [ ] Analytics enabled
- [ ] Monitoring configured

**Ready for development!** 🚀

*Last updated: April 13, 2026*