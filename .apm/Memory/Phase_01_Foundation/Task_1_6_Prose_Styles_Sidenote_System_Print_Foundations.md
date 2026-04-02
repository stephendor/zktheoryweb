---
agent: Agent_Design_System
task_ref: Task 1.6
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 1.6 – Prose Styles, Sidenote System & Print Foundations

## Summary

Created `prose.css` (full `.prose`-scoped long-form reading styles with two-column CSS Grid), `Sidenote.astro` (Tufte-tradition margin notes with mobile `<details>` fallback), `print.css` (print-media stylesheet loaded via `<link media="print">`), and `prose-test.mdx` (development test page). Build and lint both pass clean.

## Details

### Dependency integration
- Read `BaseLayout.astro`, `layout.css`, `global.css`, `SiteNav.astro` before implementation.
- Confirmed `h1`/`h2` base font and `body` base typography already set in `BaseLayout.astro`'s `<style is:global>` — prose overrides scoped to `.prose` context to avoid conflicts.
- `SiteNav.astro` uses explicit class selectors (`.nav-link`, `.nav-brand`) — no bleed risk from prose link styles.

### Step 1 — `src/styles/prose.css`
- CSS Grid on `.prose`: `[main-start] minmax(0, var(--measure-prose)) [main-end sidenote-start] var(--sidenote-width) [sidenote-end]` with `column-gap: var(--space-6)`.
- All direct children default to `grid-column: main` via `.prose > *`.
- Sidenote system CSS included in the same file (see Step 2 notes).
- Reading progress bar: `.reading-progress` spans both columns (`grid-column: main / sidenote-end`), sticky at top, decorative gradient.
- Dark-mode overrides under `[data-theme="dark"] .prose` for links and inline code.
- Added `@import './prose.css'` after `layout.css` in `global.css`.

### Step 2 — `src/components/shared/Sidenote.astro`
- Component is placed as a **block element between paragraphs** in MDX (not inline in text).
- Used `Astro.slots.render('default')` to render slot content once, injected in both `<aside>` and `<details>` via `set:html` — enables desktop and mobile renderings from a single slot.
- **Wrapper approach**: `<span class="sidenote-wrapper">` with CSS `display: contents` makes `<aside>` and `<details>` direct grid participants.
- Desktop: `<aside class="sidenote">` → `grid-column: sidenote` via CSS auto-placement.
- Mobile: `<aside>` hidden; `<details class="sidenote-disclosure">` shown with styled summary.
- Accessibility: `role="note"`, `aria-label="Sidenote N"` on aside; inline `<sup>` in prose text links via `aria-describedby="sn-N"`.
- CSS counter-increment on `.sidenote` for automatic numbering fallback when `number` prop omitted.

**Important design decision**: The CSS Grid auto-placement approach (sidenote as direct grid child after paragraph) was chosen over the float+negative-margin Tufte CSS approach because:
1. CSS Grid is explicitly specified in the task.
2. Float-outside-container requires viewport ≥ ~1440px for sidenote to not overflow; the grid approach works within any container width.
3. Trade-off: the main column narrows to ~476px when `container-prose` (720px) includes the sidenote column. This is visually acceptable (≈30em) but documented below as a finding.

### Step 3 — `src/styles/print.css`
- Entirely wrapped in `@media print`.
- Hides: `header`, `footer`, `.skip-link`, `.reading-progress`, `.nav-hamburger`, `.site-nav`, `.sidenote-disclosure`.
- Forces single-column layout: `.prose { display: block }`, `.sidenote { display: none }`.
- Forces `details` disclosure content to render (most print engines open `<details>` by default).
- Typography: 11pt Georgia serif, `color: #000`, `background: #fff`.
- Page-break rules: `h2/h3 { page-break-after: avoid }`, `pre/blockquote/table/.bib-entry { page-break-inside: avoid }`.
- Appends `(url)` after `a[href^="http"]` at 9pt; suppresses for `#` and `/` (internal) links.
- Loaded in `BaseLayout.astro` via Vite `?url` import: `import printCssUrl from '@styles/print.css?url'` → `<link rel="stylesheet" media="print" href={printCssUrl} />`.

### Step 4 — `src/pages/dev/prose-test.mdx`
- Uses explicit import of `BaseLayout` and `Sidenote` at top of MDX file (Astro MDX ESM import pattern).
- Wraps content in `<div class="container-prose"><article class="prose">`.
- Includes: 3× `<Sidenote>` components, `h2`, `h3`, paragraphs, unordered list, ordered list, blockquote, inline code, Python code block, 3-column/3-row table, external link.
- Build: `npm run build` ✓ — `/dev/prose-test/index.html` generated without errors.
- Lint: `npm run eslint` ✓ — no errors or warnings from new files.

## Output

- `src/styles/prose.css` — created (new)
- `src/styles/print.css` — created (new)
- `src/components/shared/Sidenote.astro` — created (new)
- `src/pages/dev/prose-test.mdx` — created (new, dev artefact)
- `src/styles/global.css` — modified: added `@import './prose.css'` after `layout.css`
- `src/layouts/BaseLayout.astro` — modified: added `import printCssUrl from '@styles/print.css?url'` and `<link rel="stylesheet" media="print" href={printCssUrl} />`

## Issues

None. Build and lint passed without errors.

## Important Findings

**Prose column width trade-off with sidenote grid**: When `.prose` (CSS Grid with `main + sidenote` columns) is placed inside `.container-prose` (max-width 720px), the main text column is constrained to ~476px (≈30em) rather than the target 65ch (~650px). This is still readable but narrower than ideal for long-form prose.

**Recommendation for Manager**: Consider adding a `.container-prose--wide` variant (or overriding via `:has()`) with `max-width: calc(var(--content-prose) + var(--sidenote-width) + var(--space-6))` (≈964px) for pages that use sidenotes, to preserve the 65ch reading measure in the main column. This is a layout-layer concern; Phase 1's scope is met as delivered.

## Next Steps

- Manager may wish to add `.container-prose--wide` to `layout.css` for pages using the full sidenote layout (Task 1.5 scope or early Phase 2).
- Phase 2 will populate `.bib-entry` elements (`.page-break-inside: avoid` is already in `print.css`).
- True scroll-progress tracking for `.reading-progress` deferred to Phase 4 as specified.
