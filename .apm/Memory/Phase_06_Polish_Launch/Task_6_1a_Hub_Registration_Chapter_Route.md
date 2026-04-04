---
agent: Agent_Infra
task_ref: Task 6.1a - Learning Path Hub Registration & Chapter Route
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 6.1a – Learning Path Hub Registration & Chapter Route

## Summary

Registered Paths 3 and 4 in `learnPaths.ts`, created the `/counting-lives/chapters/[slug].astro` dynamic route generating 18 chapter pages, and replaced both empty hub stubs with real section hub pages. Build passes at 103 pages; 420 tests passing; 0 lint errors.

## Details

**Step 1 — Path 3 & 4 registration (`src/data/learnPaths.ts`)**
- Added `dataJustice: LearnPath` (slug: `data-justice`, palette: `cl`, 6 modules, 18 min each) with titles/coreConcepts from task spec.
- Added `tdaPractitioners: LearnPath` (slug: `tda-practitioners`, palette: `tda`, 14 modules, 30 min each) with titles/coreConcepts extracted directly from `path4-module-{1..14}.mdx` frontmatter.
- Added both to `learnPaths` record. `availablePathSlugs` and `[path]/[module].astro` auto-updated.
- Result: 22 new routes generated (2 landing pages + 6 data-justice modules + 14 tda-practitioners modules).

**Step 2 — Chapter dynamic route (`src/pages/counting-lives/chapters/[slug].astro`)**
- New file created. `getStaticPaths()` uses `getCollection('chapters')` filtered by `id !== 'ch-00-sample'` (sample file has `chapter_number: 1` — same as ch-01 — so filtering by ID is the correct criterion, not `chapter_number > 0`).
- Chapters sorted by `chapter_number` ascending; prev/next objects passed as layout props.
- Result: 18 routes at `/counting-lives/chapters/ch-{01..18}/`.

**Step 3 — Counting Lives hub (`src/pages/counting-lives/index.astro`)**
- Replaced stub. Hero with title, description, nav links to `/counting-lives/bibliography` and `/counting-lives/transitions/`.
- Chapters in responsive auto-fill grid using `minmax(min(100%, 28ch), 1fr)` — 2–3 columns desktop, 1 mobile.
- Each card shows: Part label (mapped from Roman numeral to full title), chapter number, title, status badge.
- CL palette tokens throughout (`--color-cl-red`, `--color-cl-ochre`, `--color-cl-cream`, `--color-cl-charcoal`).

**Step 4 — TDA hub (`src/pages/tda/index.astro`)**
- Replaced stub. Hero with title, description, nav links to `/tda/pipeline/` and `/tda/bibliography`.
- 10 paper cards in responsive grid showing: Stage label, paper number, title, stage badge, status badge.
- No paper detail route exists (`src/pages/tda/papers/[slug].astro` absent) — card `href` set to `/tda/papers/{entry.id}` with `data-todo="paper-detail-route"` (valid URL format satisfying a11y linter, gives 404 until route is built).
- Two lint fixes during Step 4: removed `role="list"` from `<ol>` (redundant implicit role), replaced `href="#"` with path URL.
- TDA Mathematical palette tokens throughout (`--color-tda-teal`, `--color-tda-slate`, `--color-tda-warm-grey`).

## Output

- **Modified:** `src/data/learnPaths.ts`
- **Created:** `src/pages/counting-lives/chapters/[slug].astro`
- **Modified:** `src/pages/counting-lives/index.astro`
- **Modified:** `src/pages/tda/index.astro`
- **Final page count:** 103 pages (Pagefind indexed)
- **Tests:** 420 passing, 20 test files
- **Lint:** 0 errors, 2 pre-existing warnings in `PovertySimulator.tsx` (unrelated to this task)

## Issues

None. Build, test, and lint all pass cleanly.

## Important Findings

1. **`ch-00-sample.mdx` has `chapter_number: 1`** — same value as the real `ch-01.mdx`. Filtering by `chapter_number > 0` would include the sample file. The correct exclusion criterion is `id !== 'ch-00-sample'` (by filename). Manager should ensure any future code that filters the `chapters` collection uses ID-based exclusion, not chapter_number.

2. **No TDA paper detail route exists.** `/tda/papers/[slug].astro` is absent from the codebase. The TDA hub links paper cards to `/tda/papers/{entry.id}` with `data-todo="paper-detail-route"` as a navigable but currently 404ing placeholder. This route will need to be created in a future task.

## Next Steps

- Build `src/pages/tda/papers/[slug].astro` paper detail route (flagged with `data-todo="paper-detail-route"` throughout TDA hub).
- Consider tagging Zotero entries with `counting-lives` and `tda` project tags so the bibliography pages can filter by section (noted in `bibliography.astro` comments).
