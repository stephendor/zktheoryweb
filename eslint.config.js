import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import astroPlugin from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  // Global ignores
  {
    ignores: ['dist/', '.astro/', 'node_modules/'],
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

  // Astro accessibility (jsx-a11y rules for .astro files)
  ...astroPlugin.configs['flat/jsx-a11y-recommended'],
];
