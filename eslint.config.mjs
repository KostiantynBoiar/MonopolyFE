import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  { ignores: ['.next/', 'node_modules/', 'public/', 'next-env.d.ts'] },

  ...compat.extends('next/core-web-vitals', 'next/typescript'),

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
    },
  },
];

export default config;
