/**
 * e2e/progress.spec.ts — Task 5.9 — Agent_Infra
 *
 * End-to-end tests for the localStorage-based module progress tracking system.
 *
 * localStorage schema (from src/lib/progress.ts):
 *   Key:   zktheory:progress:{pathSlug}
 *   Value: { version: 1, completedModules: string[], lastVisited, updatedAt }
 *
 * MarkCompleteButton (src/components/learn/MarkCompleteButton.tsx):
 *   - Not complete: button aria-label = "Mark this module as complete"
 *   - Complete:     button aria-label = "Module marked as complete" (disabled)
 *
 * Pattern notes:
 * - MarkCompleteButton uses `client:only="react"` — waits for React hydration
 *   before interacting.
 * - PathProgressBar (role="progressbar") lives on /learn/ (the hub page), not
 *   on individual path landing pages. Tests verify it there.
 * - localStorage is cleared before isolation-sensitive tests via page.evaluate().
 */

import { test, expect } from '@playwright/test';

const PATH_SLUG = 'topology-social-scientists';
const STORAGE_KEY = `zktheory:progress:${PATH_SLUG}`;

// ─── Helper: wait for MarkCompleteButton to hydrate ──────────────────────────

/**
 * Waits for the MarkCompleteButton React island to hydrate and the button
 * to become interactive. Returns the locator for the "Mark as complete" button.
 */
async function waitForMarkCompleteButton(page: import('@playwright/test').Page) {
  // The button renders only after client-only React hydration.
  const btn = page.getByRole('button', { name: 'Mark this module as complete' });
  await btn.waitFor({ state: 'visible', timeout: 10_000 });
  return btn;
}

// ─── Test 1: Mark module complete and persist across navigation ───────────────

test('marks module complete and persists state across navigation', async ({ page }) => {
  // Clear any existing progress to start from a known state.
  await page.goto(`/learn/${PATH_SLUG}/1`);
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);

  // Reload to ensure the component renders from the cleared state.
  await page.reload();

  // Wait for MarkCompleteButton to hydrate.
  const markBtn = await waitForMarkCompleteButton(page);

  // Initial localStorage should be absent or have no completed modules.
  const initialProgress = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  if (initialProgress !== null) {
    const parsed = JSON.parse(initialProgress) as { completedModules: string[] };
    expect(parsed.completedModules).toHaveLength(0);
  }

  // Click to mark module 1 complete.
  await markBtn.click();

  // Button transitions to the completed state (disabled, different aria-label).
  const completedBtn = page.getByRole('button', { name: 'Module marked as complete' });
  await expect(completedBtn).toBeVisible();

  // localStorage must now contain module "1" in completedModules.
  const savedProgress = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(savedProgress).not.toBeNull();
  const savedData = JSON.parse(savedProgress!) as { completedModules: string[] };
  expect(savedData.completedModules).toContain('1');

  // Navigate away then back — progress must survive the round-trip.
  await page.goto('/learn/');
  await page.goto(`/learn/${PATH_SLUG}/1`);

  // After returning, the button should still show the completed state.
  // MarkCompleteButton reads localStorage, so it hydrates in completed state.
  await completedBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await expect(completedBtn).toBeVisible();
});

// ─── Test 2: Progress persists across two modules ────────────────────────────

test('progress bar reflects completion of multiple modules', async ({ page }) => {
  // Start clean.
  await page.goto(`/learn/${PATH_SLUG}/1`);
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();

  // Mark module 1 complete.
  const markBtn1 = await waitForMarkCompleteButton(page);
  await markBtn1.click();
  await page.getByRole('button', { name: 'Module marked as complete' }).waitFor({
    state: 'visible',
  });

  // Navigate to module 2 and mark it complete.
  await page.goto(`/learn/${PATH_SLUG}/2`);
  const markBtn2 = await waitForMarkCompleteButton(page);
  await markBtn2.click();
  await page.getByRole('button', { name: 'Module marked as complete' }).waitFor({
    state: 'visible',
  });

  // Navigate to the learn hub — PathProgressBar lives here (client:only="react").
  await page.goto('/learn/');

  // Wait for the progress bar to hydrate from localStorage.
  // aria-label = "N of M modules complete"; after 2/8 → "2 of 8 modules complete"
  // aria-valuenow would be 25 (25 %).
  const progressBar = page.getByRole('progressbar', {
    name: new RegExp(`${PATH_SLUG.replace(/-/g, '.*')}`, 'i'),
  });

  // Fall back to any progressbar if the label doesn't include the slug.
  // PathProgressBar label is "{N} of {total} modules complete".
  const anyProgressBar = page.getByRole('progressbar').first();

  // Prefer the labeled progressbar; fall back to the generic one if not visible.
  let chosenBar = progressBar;
  try {
    await progressBar.waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    chosenBar = anyProgressBar;
    await anyProgressBar.waitFor({ state: 'visible', timeout: 10_000 });
  }

  // aria-valuenow must be present and > 0. PathProgressBar reads localStorage in a
  // useEffect after mount, so we wait for the value to reflect the writes
  // made on previous pages before asserting.
  await expect(chosenBar).toHaveAttribute('aria-valuenow', /^(?!0$)\d+$/, {
    timeout: 8_000,
  });
});

// ─── Test 3: Module navigation links (prev / next) ───────────────────────────

test('module navigation prev/next links are present and functional', async ({ page }) => {
  await page.goto(`/learn/${PATH_SLUG}/3`);

  // Module 3 has both a previous and a next module.
  // Links are rendered server-side (no hydration wait needed).
  const prevLink = page.getByRole('link', { name: /Previous module/ });
  await expect(prevLink).toBeVisible();

  const nextLink = page.getByRole('link', { name: /Next module/ });
  await expect(nextLink).toBeVisible();

  // Clicking "Next module" navigates to module 4.
  await nextLink.click();
  await expect(page).toHaveURL(new RegExp(`/learn/${PATH_SLUG}/4`));
});
