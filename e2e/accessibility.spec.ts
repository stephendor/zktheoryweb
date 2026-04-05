/**
 * e2e/accessibility.spec.ts — Task 6.5 — Agent_Design_System
 *
 * Site-wide WCAG 2.1 AA accessibility audit using axe-core via Playwright.
 *
 * Covers representative pages across all major page types: home, CL hub,
 * chapter, TDA hub, paper, method, learn hub, interlude, and about.
 *
 * The webServer in playwright.config.ts serves `dist/` on port 4321.
 * Run `npm run build` before executing this spec.
 *
 * Usage:
 *   npx playwright test e2e/accessibility.spec.ts
 *   npx playwright test e2e/accessibility.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result as AxeResult } from 'axe-core';

/** Format axe violations for readable assertion messages. */
function formatViolations(violations: AxeResult[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - ${n.html} (${n.target.join(', ')})`)
        .join('\n');
      return `[${v.impact ?? 'unknown'}] ${v.id}: ${v.description}\n  affected nodes:\n${nodes}`;
    })
    .join('\n\n');
}

/** Representative pages covering all major page types on the site. */
const PAGES = [
  { name: 'Home',              url: '/'                                                              },
  { name: 'Counting Lives Hub',url: '/counting-lives/'                                               },
  { name: 'CL Chapter 01',     url: '/counting-lives/chapters/ch-01'                                 },
  { name: 'TDA Hub',           url: '/tda/'                                                          },
  { name: 'TDA Paper 01',      url: '/tda/papers/paper-01'                                           },
  { name: 'TDA Method',        url: '/tda/methods/persistent-homology'                               },
  { name: 'Learn Hub',         url: '/learn/'                                                        },
  { name: 'MM1 Interlude',     url: '/counting-lives/interludes/mm1-normal-distribution'             },
  { name: 'About',             url: '/about/'                                                        },
] as const;

for (const { name, url } of PAGES) {
  test(`[a11y] ${name} — ${url}`, async ({ page }) => {
    await page.goto(url);

    // Wait for the page to be fully rendered (no loading spinners).
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      // Scope rules to WCAG 2.1 AA
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // best-practice: exclude rules beyond AA scope that may fire false positives
      // on architectural decisions (e.g. scrollable-region-focusable for KaTeX
      // overflow containers which have no interactive content).
      .exclude('.katex-display')          // KaTeX: managed by rehype-katex, aria-label present
      .analyze();

    expect(
      results.violations,
      `Accessibility violations found on "${name}" (${url}):\n\n${formatViolations(results.violations)}`,
    ).toHaveLength(0);
  });
}
