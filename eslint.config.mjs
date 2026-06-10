import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'] },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      // Correctness
      'eqeqeq':       ['error', 'always', { null: 'ignore' }],
      'no-debugger':  'error',
      'no-var':       'error',
      'prefer-const': 'error',
      'no-console':   ['warn', { allow: ['warn', 'error'] }],

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern:         '^_',
        varsIgnorePattern:         '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer:   'type-imports',
        fixStyle: 'separate-type-imports',
      }],

      // React
      'react/self-closing-comp':       'warn',
      'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
      'react-hooks/refs':              'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  {
    files: ['src/shared/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];

export default config;
