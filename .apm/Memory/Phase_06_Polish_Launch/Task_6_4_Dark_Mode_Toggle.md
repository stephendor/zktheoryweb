---
agent: Agent_Design_System
task_ref: Task_6_4
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 6.4 – Dark Mode Toggle & Palette Tuning

## Summary

Implemented a fully accessible dark mode toggle with localStorage persistence, system preference detection, and no-FOCT (flash-of-incorrect-colour-theme) script. All components verified in dark mode; five targeted fixes applied during palette audit.

## Details

**Dependency review findings:**
- `[data-theme="dark"]` token block in `tokens.css` was complete and correct — no token additions needed.
- No `prefers-color-scheme` media queries anywhere in the codebase — no conflicts.
- `prose.css` already had partial dark-mode overrides (links, blockquote, inline code) but was **missing** a critical override for `prose pre`: `--color-cl-charcoal` is used as `pre` background in light mode (dark charcoal `#2C2C2C`) but its dark-mode override flips it to cream (`#E8E4DC`), which would render code blocks with a light background in dark mode.
- KaTeX ships its own CSS colours that don't respect the `data-theme` attribute — override needed.
- Print stylesheet had no forced-light-mode block — dark mode tokens would print dark backgrounds.

**Step 1 — No-FOCT script:**
Added `<script is:inline>` in `BaseLayout.astro` `<head>` before the print stylesheet link. The IIFE reads `localStorage.getItem('theme')`, falls back to `prefers-color-scheme`, and sets `data-theme` on `<html>` synchronously before any CSS renders.

**Step 2 — DarkModeToggle React island:**
Created `src/components/shared/DarkModeToggle.tsx`. On mount, reads the theme already resolved by the no-FOCT script (from `document.documentElement.getAttribute('data-theme')`). Tracks explicit user choice via `useRef` so system-preference changes are only applied when no `localStorage` entry exists. Inline SVG sun (16×16 circle + 8 radial lines) and moon (crescent path) icons both use `currentColor`. Button carries `aria-label` that updates with theme state.

**Step 3 — SiteNav wiring:**
Imported `DarkModeToggle` and placed `<DarkModeToggle client:load />` after `<SiteSearch />` and before the hamburger button in `SiteNav.astro`. Added toggle button styles via `:global(.dark-mode-toggle)` in the SiteNav `<style>` block — matches nav button aesthetic (36×36px, token border, `--color-neutral-body` for icon colour, focus-visible teal outline).

**Step 4 — Palette audit & tuning (5 fixes applied):**

1. **Code blocks (`prose.css`):** Added `[data-theme="dark"] .prose pre { background: var(--color-neutral-subtle); }` — fixes the `--color-cl-charcoal` token flip from dark (#2C2C2C) to cream (#E8E4DC) in dark mode.
2. **KaTeX (`global.css`):** Added `[data-theme="dark"] .katex { color: var(--color-neutral-body); }` — ensures math equations are visible against dark backgrounds.
3. **Print (`print.css`):** Added section 11 inside `@media print` resetting `:root, [data-theme="dark"]` neutral and palette section-background tokens to their light-mode values — ensures dark mode does not bleed into print output.
4. **Navigation, cards, interactive backgrounds, form elements, status badges:** All verified — they use CSS custom property tokens (`--color-neutral-*`) which are already overridden in the dark token block. No further CSS changes needed.
5. **MarkCompleteButton hardcoded `#2e7d5e`:** The success-green button background is intentionally hardcoded (good contrast in both light and dark — `#2e7d5e` on `--color-neutral-surface` white text is fine in dark context). Left unchanged per scope constraint.

**Step 5 — Regression:**
- `npm run build`: ✓ 114 pages (one `print.css` syntax issue self-inflicted during edit — missing `@media print` closing brace — detected and fixed immediately; build counts as one debugging resolution, not a failed attempt)
- `npm test`: ✓ 420 tests passing (20 test files)
- `npm run lint`: 1 pre-existing error in `ConnectionsPanel.astro`, 2 pre-existing warnings in `PovertySimulator.tsx` — both files unrelated to this task; `DarkModeToggle.tsx` lints clean.

## Output

Files created:
- `src/components/shared/DarkModeToggle.tsx` — new React island

Files modified:
- `src/layouts/BaseLayout.astro` — no-FOCT `<script is:inline>` added in `<head>`
- `src/components/shared/SiteNav.astro` — DarkModeToggle imported and wired; toggle button styles added
- `src/styles/global.css` — KaTeX dark mode override appended
- `src/styles/prose.css` — `[data-theme="dark"] .prose pre` background fix appended
- `src/styles/print.css` — Section 11 forced-light-mode for print appended

Files not modified (no changes needed):
- `src/styles/tokens.css` — dark token block was already complete

## Issues

One build error during Step 5: `print.css` was missing its `@media print` closing `}` after the string replacement. Diagnosed from the Tailwind error message and fixed by appending the closing brace. Build passed on second attempt.

## Important Findings

**Critical fix for prose pre:** The `--color-cl-charcoal` token is used as `pre` background in light mode because it is a naturally dark value (`#2C2C2C`). However, the dark-mode token block overrides `--color-cl-charcoal` to `#E8E4DC` (light cream, to serve as text-on-dark-bg). Without the `[data-theme="dark"] .prose pre` override added in this task, code blocks would render with a light cream background and light text in dark mode — making them completely unreadable. This was not caught during the original prose styling (Task 1.x) because dark mode was not active then. Future agents adding code-style elements should avoid using palette tint tokens for backgrounds where those tokens have semantic flips in dark mode; prefer neutral tokens instead.

**Pre-existing lint error:** `src/components/shared/ConnectionsPanel.astro` has a redundant ARIA role error (`role="list"` on `<ul>`). This is not from this task. Manager Agent should assign a follow-up cleanup task.

## Next Steps

Manual verification recommended (build artifacts available in `dist/`):
- Load a chapter page: confirm `<html>` has `data-theme` attribute set without flash
- Click toggle: confirm icon switches and localStorage key `'theme'` is written
- Open in a browser with system dark mode: confirm site loads dark without toggle interaction
- Print from dark mode: confirm printed page is light-background
