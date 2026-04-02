/**
 * vitest.config.ts — Extended by Task 2.11 — Agent_Infra
 * (Originally created Task 2.2b — Agent_Design_Templates)
 *
 * Framework choice: Vitest over Jest or Playwright for unit tests.
 *   - Vitest shares Vite's transform pipeline with Astro, meaning JSX/TSX
 *     and TypeScript are transformed identically in tests and production builds.
 *     Jest needs separate Babel/ts-jest configuration and has incomplete ESM
 *     support, creating drift between test and build environments.
 *   - Playwright (and Astro's own @astrojs/test-utils) is the correct tool for
 *     E2E/integration testing of full pages; it is not a replacement for
 *     component-level unit tests.
 *   - Vitest + @testing-library/react is the de-facto standard for React 19
 *     component unit testing in Vite-based projects.
 *
 * Extensions added in Task 2.11:
 *   - globals: true       — `describe`, `it`, `expect`, `vi` available without
 *                           explicit imports in every test file
 *   - setupFiles          — imports @testing-library/jest-dom matchers globally
 *                           (toBeVisible, toHaveAttribute, toBeInTheDocument …)
 *   - resolve.alias       — mirrors tsconfig.json path aliases so tests can use
 *                           @components/*, @layouts/*, @lib/*, etc. without
 *                           relative path gymnastics
 *
 * Unchanged choices from Task 2.2b:
 *   - @vitejs/plugin-react: handles JSX/TSX with React automatic runtime
 *   - happy-dom: lightweight, fast — sufficient for all DOM queries and
 *     user-event simulation; no need for heavier jsdom
 *   - css: false: CSS imports treated as empty modules; we test behaviour, not
 *     visual output
 */

import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@layouts':    path.resolve(__dirname, 'src/layouts'),
      '@lib':        path.resolve(__dirname, 'src/lib'),
      '@styles':     path.resolve(__dirname, 'src/styles'),
      '@data':       path.resolve(__dirname, 'src/data'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    setupFiles: ['./vitest.setup.ts'],
  },
});
