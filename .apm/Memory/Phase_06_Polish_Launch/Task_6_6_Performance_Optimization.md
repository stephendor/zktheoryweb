---
agent: Agent_Infra
task_ref: Task_6_6
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 6.6 – Performance Optimization

## Summary

Applied targeted performance optimisations: Three.js vendor chunk split, font preload hints, and `TwoLensesToggle client:load → client:visible` hydration change. Build passes 126 pages; 420 tests; 0 lint errors. One PRD exception documented (prose page 50KB JS target narrowly missed due to React runtime constraint).

## Details

### Step 1 — Bundle Analysis (before optimisation)

Production build output inspected. Key findings:

| Bundle | Uncompressed | Gzip |
|---|---|---|
| `PersistenceDiagramBuilderWrapper.*.js` | 922 KB | 256 KB |
| `client.*.js` (React DOM runtime) | 178 KB | 55.5 KB |
| `transform.*.js` (D3 shared) | 37 KB | 12.2 KB |
| `MapperParameterLab.*.js` | 25 KB | — |
| All other interactives | ≤ 15 KB each | — |

- **Three.js** was bundled entirely into `PersistenceDiagramBuilderWrapper` (only consumer). No other bundle contained Three.js → cache efficiency opportunity.
- **D3** was already split into sub-modules (`transform`, `linear`, `manyBody`, `line`, etc.) per component. No colocation issue.
- **No dev-only code** detected in production output.
- **Prose page JS** (chapter/paper/writing): 3 bundles — React DOM runtime `client.js` (55.5 KB gzip) + `DarkModeToggle.js` (0.8 KB) + `ExpandableCard.js` (0.5 KB) = **56.8 KB gzip total**.

### Step 2 — Font Loading Optimisation

Inspected `src/styles/fonts.css` and `public/fonts/`:

- All 9 `@font-face` declarations already use `font-display: swap`. **No changes needed.**
- All font files are `.woff2` format only (no `.woff` or `.ttf` present). **No issues.**
- **Added** `<link rel="preload">` hints in `src/layouts/BaseLayout.astro` for the two critical fonts:
  - `source-serif-4-latin-400.woff2` (body prose font)
  - `instrument-sans-latin-400.woff2` (UI/nav font)
  - Placed before the print stylesheet link, with correct `as="font"`, `type="font/woff2"`, `crossorigin` attributes.

### Step 3 — Interactive Component Hydration Audit

Audited all `client:load` usages via grep across `src/pages/`, `src/layouts/`, `src/content/`:

| Component | Location | Before | After | Rationale |
|---|---|---|---|---|
| `DarkModeToggle` | `SiteNav.astro` (global) | `client:load` | **KEPT** | Constraint: must reflect resolved theme state on first render |
| `TwoLensesToggle` | `[slug].astro` (interludes) | `client:load` | **`client:visible`** | Renders below the hero section; not above-fold |
| `BibliographyFilter` | `BibliographyList.astro` | `client:load` | **KEPT** | Primary content of bibliography pages; above-fold |

All other `client:*` uses in the codebase already used `client:visible` — no further changes needed.

### Step 4 — Astro/Vite Build Configuration

1. **Images**: No `<img>` tags for content (text-heavy site). Astro built-in image optimisation not applicable — skipped.

2. **Vite manualChunks**: Added to `astro.config.mjs`. Three.js is collocated in the single large `PersistenceDiagramBuilderWrapper` bundle (922K) — split into a dedicated vendor chunk to improve cache efficiency:
   - `vendor-three` — Three.js library (benefits: cached independently from component code)
   - React and D3 excluded from manual splitting (React already auto-split by Astro; D3 already granularly split by Vite tree-shaking).

3. **CSS**: `BaseLayout.Y9X-E29o.css` = 63 KB. Tailwind JIT is purging effectively (expected for global styles + KaTeX math styles across all page types). No action needed.

### Step 5 — Post-Optimisation Measurement

**Rebuild:** 126 pages, complete. **Tests:** 420/420 passing. **Lint:** 0 errors (2 pre-existing warnings in `PovertySimulator.tsx` unrelated to this task).

| Bundle | Before | After (uncompressed) | After (gzip) |
|---|---|---|---|
| `PersistenceDiagramBuilderWrapper.*.js` | 922 KB / 256 KB gzip | 180 KB | 59.7 KB |
| `vendor-three.*.js` (new) | — | 740 KB | 195.5 KB |
| Three.js total on PDB page | 256 KB gzip | 255.2 KB gzip | ≈same total; better caching |
| React DOM runtime (`client.*.js`) | 178 KB / 55.5 KB gzip | **unchanged** | 55.5 KB |
| All prose-page JS (total) | 56.8 KB gzip | **56.8 KB gzip** | unchanged |

**Page-type JS footprint estimate:**

| Page type | JS (gzip) | PRD target | Status |
|---|---|---|---|
| Prose (chapter, paper, writing post) | **56.8 KB** | < 50 KB | ⚠️ *See exception below* |
| Interlude (TwoLensesToggle) | ~59 KB | < 50 KB (prose) | ⚠️ React runtime same cause |
| Learn module (PovertySimulator etc.) | ~62–65 KB | ≥ 80 Lighthouse | Acceptable |
| PDB page (Three.js) | ~307 KB | documented exception | Three.js heavy; expected |

## Output

- `astro.config.mjs` — Added `vite.build.rollupOptions.output.manualChunks` to split Three.js into `vendor-three`
- `src/layouts/BaseLayout.astro` — Added font preload hints for Source Serif 4 and Instrument Sans
- `src/pages/counting-lives/interludes/[slug].astro` — `TwoLensesToggle client:load` → `client:visible`
- `src/styles/fonts.css` — **No changes required** (already optimal)

## Issues

None blocking. See Important Findings for PRD exception.

## Important Findings

### PRD Exception: Prose Page 50 KB JS Target

**Target**: < 50 KB JS (compressed) on prose pages with no interactive islands.  
**Current**: 56.8 KB gzip on all pages (React DOM runtime alone = 55.5 KB gzip).

**Root cause**: The `DarkModeToggle` React island uses `client:load` in `SiteNav.astro` (present on every page). This forces the React DOM runtime to load on all pages including prose pages. The runtime is 178 KB uncompressed / 55.5 KB gzip — already above the 50 KB target on its own.

**Constraint**: Task 6.6 explicitly prohibits changing `DarkModeToggle client:load` to `client:idle` or `client:visible` (FOCT concerns with icon state).

**Resolution options for Manager**:
1. **Accept exception**: Document that "prose pages" in the PRD context implicitly includes the global React-powered DarkModeToggle; the 50 KB target assumed vanilla-JS UI. Lighthouse scores may still meet the ≥ 95 target despite 57 KB JS (React runtime is highly cacheable post-first-visit).
2. **Follow-up task**: Convert `DarkModeToggle` from a React island to a pure Astro/vanilla-JS component. This would eliminate the React runtime from prose pages entirely, dropping JS from 57 KB to ~3 KB gzip. However, the FOCT constraint means the icon hydration behaviour must be carefully re-implemented in vanilla JS reading `data-theme`.

**Manager action required**: Decide whether to accept the 50 KB exception or schedule a follow-up task to convert DarkModeToggle to vanilla JS.

## Next Steps

- Manager to decide on DarkModeToggle vanilla-JS conversion (see Important Findings)
- Manager to run manual Lighthouse audit against deployed preview branch to verify ≥ 95 score on prose pages (Lighthouse scoring is heavily influenced by server TTFB and CDN caching beyond what this build analysis can measure)
