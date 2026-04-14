# Contributing to BuildFlow MVP

Thank you for your interest in contributing to BuildFlow MVP! This document provides guidelines for contributing to this AI-powered CI/CD optimization platform.

## 🎯 Project Mission

BuildFlow MVP aims to transform slow, inefficient build pipelines into fast, intelligent deployment workflows through AI-powered analysis and recommendations.

## 📋 How to Contribute

### 1. Prerequisites

- Node.js 18+ and npm
- GitHub account
- Basic knowledge of Next.js, TypeScript, and React

### 2. Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/buildflow-mvp.git
   cd buildflow-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables (see README for details)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

### 3. Making Contributions

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎨 Code Style Guidelines

### TypeScript & React
- Use TypeScript for all new code
- Follow React functional component patterns with hooks
- Use proper TypeScript types instead of `any`
- Prefer const assertions and strict typing

### Code Organization
- Components in `src/components/`
- API routes in `app/api/`
- Database utilities in `src/lib/`
- Types in `src/types/`

### ESLint & Formatting
- Run `npm run lint` before committing
- ESLint v9 flat config is already configured
- Follow existing patterns for imports and exports

## 🐛 Reporting Issues

### Bug Reports
Please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, Node.js version, etc.)
- Screenshots if applicable

### Feature Requests
Please include:
- Clear description of the proposed feature
- Use case or problem it solves
- Potential implementation approach
- Any alternatives considered

## 🎯 Priority Areas

We especially welcome contributions in these areas:

1. **GitHub Actions Analysis**
   - Improved workflow parsing
   - Better build time analysis
   - Support for more CI/CD platforms

2. **AI Recommendations**
   - Enhanced recommendation algorithms
   - More optimization strategies
   - Better explanation of recommendations

3. **User Experience**
   - Dashboard improvements
   - Better data visualization
   - Mobile responsiveness

4. **Performance**
   - Analysis speed optimizations
   - Database query improvements
   - Frontend performance enhancements

## 📊 Development Workflow

### Branch Naming
- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test improvements

### Commit Messages
Follow conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Formatting changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Follow PR template guidelines
4. Request review from maintainers
5. Address feedback promptly

## 🧪 Testing

- Write unit tests for new functions
- Add integration tests for API endpoints
- Test components with React Testing Library
- Ensure ESLint passes with no errors

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## ❓ Questions?

If you have questions about contributing, please:
1. Check existing issues and discussions
2. Create a new issue with the "question" label
3. Reach out to maintainers

Thank you for helping make BuildFlow MVP better! 🚀