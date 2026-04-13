import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  // Apply Next.js ESLint config to relevant files
  ...nextCoreWebVitals.map(config => ({
    ...config,
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']
  })),
  // Ignore specific patterns
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.config.js',
      'coverage/**'
    ]
  }
];