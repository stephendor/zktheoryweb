/**
 * vitest.setup.ts — Task 2.11 — Agent_Infra
 *
 * Global test setup run before every test file.
 * Extends Vitest's `expect` with @testing-library/jest-dom matchers:
 *   toBeVisible, toHaveAttribute, toHaveTextContent, toBeInTheDocument, etc.
 *
 * This avoids importing jest-dom in every test file and integrates cleanly
 * with `globals: true` (no need to import `expect` manually either).
 */

import '@testing-library/jest-dom';
