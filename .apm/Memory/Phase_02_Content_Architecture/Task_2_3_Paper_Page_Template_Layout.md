---
agent: Agent_Design_Templates
task_ref: Task 2.3
status: Completed
ad_hoc_delegation: false
compatibility_issues: true
important_findings: true
---

# Task Log: Task 2.3 – Paper Page Template & Layout

## Summary

Implemented the full TDA paper reading experience: `PaperLayout.astro` extending `BaseLayout`, the `BibTexCopyButton` React island, a dev sample MDX entry, and a dev test route. `npm run lint` and `npm run build` both pass clean.

## Details

- **Dependency context integrated**: read `src/content.config.ts`, `ChapterLayout.astro`, `StickyToC.astro`, `ExpandableCard.tsx`, `tokens.css`, and PRD Appendix B before implementation.
- **Steps 1–3 completed as one unit** (User confirmed combining was acceptable).
- **Step 4** completed: sample MDX, test route, lint fix, clean build verified.
- Two lint errors were introduced by the task spec's own instructions and required deviation from spec (see Compatibility Concerns below). Both resolved cleanly.
- The `key_findings` schema mismatch (see Important Findings) required a structural decision: rendered as a teal-accented `<ul>` list rather than `<ExpandableCard>` instances.

## Output

- `src/layouts/PaperLayout.astro` — full paper layout:
  - Hero band: paper number badge, `<h1>`, target journal, stage badge (0–3 with descriptive labels), status badge (6-state: planned → published)
  - Abstract + plain-language summary band (2-col at ≥768px)
  - Wide prose body: CSS grid article + `StickyToC` sidebar (≥1024px)
  - Key findings: teal left-border `<ul>` list (pending schema decision — see Important Findings)
  - Methodology pills: `<ul>/<li>/<a>` to `/tda/methods/{slug}/`; renders nothing if empty
  - Computational requirements: `<dl>` with hardware, ⏱ runtime, ☁ cloud badge (all optional)
  - Dependency position strip: 10-node CSS row; current paper teal+scaled; `depends_on` nodes in slate; `enables` nodes in teal-light; directional arrows; legend
  - Downloads section: 4 `<span>` disabled placeholders with TODO comments for Tasks 2.7+
  - BibTeX copy button: rendered only if `entry.data.bibtex` is defined
  - Prev/Next paper navigation: teal hover-ring card grid, collapses to 1-col on mobile
- `src/components/tda/BibTexCopyButton.tsx` — React island: clipboard write, 2-second copied/error state, `aria-label` updates, `aria-live="polite"` status span, disabled during transition
- `src/components/tda/BibTexCopyButton.css` — companion stylesheet (teal border, filled on copy, red on error)
- `src/content/tda/papers/paper-01-sample.mdx` — complete frontmatter for Paper 1 "Markov Memory Ladder" matching actual schema; full placeholder prose (intro, background, methods, data, results, discussion, conclusion sections)
- `src/pages/dev/paper-test.astro` — dev test route, mirrors `chapter-test.astro` pattern

## Issues

Two lint errors encountered during Step 4; both resolved before final verification:

1. `astro/jsx-a11y/no-interactive-element-to-noninteractive-role` — method pills rendered as `<div role="list">` with `<a role="listitem">`. Fixed by converting to semantic `<ul>/<li>/<a>` structure.
2. `astro/jsx-a11y/anchor-is-valid` (×4) — download link placeholders used `href="#"` as instructed by the Task Assignment Prompt. Fixed by converting to `<span class="download-link--placeholder">` with `pointer-events: none; opacity: 0.55`. TODO comments retained for Tasks 2.7+ to replace with real `<a>` elements once URL schema fields exist.

## Compatibility Concerns

**⚠ `key_findings` schema mismatch — requires Manager review and User decision:**

The Task Assignment Prompt specified `key_findings` as `z.array(z.object({ claim: z.string(), detail: z.string() }))` and instructed use of `<ExpandableCard client:visible title={kf.claim} detail={kf.detail} accentColor="var(--color-tda-teal)" />`.

The **actual schema** in `src/content.config.ts` is `key_findings: z.array(z.string())` — plain strings. The PRD Appendix B sample frontmatter also uses strings. Using ExpandableCard with the current schema is **not possible without a schema migration**.

**Current implementation**: key findings rendered as a teal left-border `<ul>` list (fully functional and lint-clean).

**Required Manager decision**: If the `{ claim, detail }` shape and ExpandableCard expansion is desired, `content.config.ts` must be updated to `z.array(z.object({ claim: z.string(), detail: z.string() }))`, and all existing `key_findings` MDX content (including `paper-01-sample.mdx`) must be migrated to the object shape. This is a breaking schema change that will affect any existing papers entries.

## Important Findings

**Schema discrepancy between Task Assignment Prompt and `content.config.ts`:**

The `papers` collection schema in `content.config.ts` (Task 2.1, Agent_Schema_Platform output) diverges from the Task Assignment Prompt in two ways:

1. **`key_findings`**: Schema is `z.array(z.string())`; Task Prompt specified `z.array(z.object({ claim, detail }))`. PRD Appendix B also uses strings — so the schema appears correct and the Task Prompt may have referenced an earlier PRD draft or intended a future schema evolution.
2. **`status` enum**: Schema is `['planned', 'in-progress', 'submitted', 'in-review', 'revision', 'published']`; Task Prompt listed `['planned', 'in-progress', 'complete']`. The schema enum is richer and more appropriate for a research paper workflow — this appears to be an improvement from Agent_Schema_Platform, not an error.
3. **`compute` object**: Schema uses `hardware?: string`, `runtime?: string`, `cloud: boolean` (all within an optional outer object); Task Prompt listed `hardware: string`, `runtime: string`, `cloud: boolean` as required. The optional schema is safer and implemented accordingly.

Manager should review `content.config.ts` against Task Assignment Prompt for Task 2.1 to confirm these differences were intentional before any downstream tasks rely on the `{ claim, detail }` key_findings shape.

## Next Steps

- Manager Agent to decide: update `key_findings` schema to `{ claim, detail }` object shape (enables ExpandableCard) or retain strings (current implementation). This decision affects Task 2.7+ MDX content structure.
- Tasks 2.7+: Replace `<span>` download placeholders in `PaperLayout.astro` with real `<a>` elements once URL fields are added to the `papers` schema.
- Phase 3, Task 3.4: Interactive dependency graph (D3) replaces the pure-CSS strip implemented here.
