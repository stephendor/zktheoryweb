import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import astroPlugin from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Global ignores
  {
    ignores: ['dist/', '.astro/', 'node_modules/', 'storybook-static/', 'playwright.config.ts'],
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['flat/recommended'].rules,
    },
  },

  // Astro files — recommended rules
  ...astroPlugin.configs['flat/recommended'],

  // JSX/TSX accessibility
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },

  // React hooks rules (TSX/JSX) — classic rules only.
  // eslint-plugin-react-hooks v7 bundles React Compiler enforcement rules in
  // its `recommended` preset; those are not applicable without the React
  // Compiler. Explicitly configure only the two canonical hooks rules.
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Astro accessibility (jsx-a11y rules for .astro files)
  ...astroPlugin.configs['flat/jsx-a11y-recommended'],
];
