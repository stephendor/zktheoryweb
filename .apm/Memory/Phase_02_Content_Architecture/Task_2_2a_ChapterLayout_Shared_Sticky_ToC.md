---
agent: Agent_Design_Templates
task_ref: Task_2_2a
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 2.2a – ChapterLayout & Shared Sticky ToC

## Summary

Built the full chapter reading experience: `.container-prose--wide` CSS variant, `StickyToC.astro` reusable sidebar, and `ChapterLayout.astro` extending `BaseLayout`. All files pass `npm run lint` (0 errors) and `npm run build` (chapter test page prerendered at `/dev/chapter-test/`).

## Details

### Dependency Integration
- Read `src/content.config.ts` in full; confirmed field types for `chapters` collection before building.
- Used Astro 6 render API: `import { render } from 'astro:content'` → `const { Content, headings } = await render(entry)`.
- Confirmed `CollectionEntry<'chapters'>` as the prop type for `ChapterLayout`.

### Step 1 — `.container-prose--wide` + `StickyToC.astro`
- Added `.container-prose--wide` to `src/styles/layout.css`: `max-width: calc(var(--content-prose) + var(--sidenote-width) + var(--space-6))` (~964px). Also added it to the `@media (max-width: 640px)` gutter-reduction block.
- Built `src/components/shared/StickyToC.astro`:
  - Props: `headings: Array<{depth, slug, text}>`, `section?: 'counting-lives' | 'tda' | 'learn'`
  - Filters to h2/h3 (depth 2–3)
  - Mobile: `<details>`/`<summary>` disclosure with custom `▾`/`▴` triangle via CSS `::after` (no JS)
  - Desktop (≥1024px): `position: sticky; top: var(--space-9)` sidebar; h3 links indented `var(--space-4)` relative to h2
  - `IntersectionObserver` in typed `<script>`: `rootMargin: '-10% 0px -70% 0px'`; sets `aria-current="true"` on active desktop link
  - Per-section active-link colour via `data-section` attribute: CL=`--color-cl-red`, TDA=`--color-tda-teal`, Learn=`--color-tda-slate`
  - WCAG 2.1 AA: `aria-label="Table of contents"` on `<nav>`, `aria-current="true"` on active link, `focus-visible` ring
- **Lint fix during Step 1**: Initial `StickyToC.astro` had `role="list"` on two `<ul>` elements — flagged as `astro/jsx-a11y/no-redundant-roles` (implicit role). Removed both.

### Step 2 — `ChapterLayout.astro`
- Created `src/layouts/ChapterLayout.astro` extending `BaseLayout` with `section="counting-lives"`.
- Props: `entry: CollectionEntry<'chapters'>`, `prevChapter?: ChapterRef`, `nextChapter?: ChapterRef`
- Hero band (`--color-cl-cream`): part label, "Chapter N" in `--color-cl-red`, `<h1>` title in display font, spine role in italic body font, status badge (drafting=neutral, in-review=ochre, complete=cl-red fill), thread pills with specified colours as Task 2.2c placeholders.
- Body: `.container-prose--wide` outer; `chapter-grid` is `1fr var(--sidenote-width)` at ≥1024px; article uses `.prose` class; `<StickyToC headings={headings} section="counting-lives" />` in sidebar column.
- Key claims: native `<details>`/`<summary>` with `+`/`−` prefix and `--color-cl-red` accent; Task 2.2b `<ExpandableCard>` noted in code comments.
- Prev/Next nav: 2-col card grid, collapses to 1-col on mobile; hover/focus ring in `--color-cl-red`.

### Step 3 — Sample MDX + Test Route
- Created `src/content/counting-lives/chapters/ch-00-sample.mdx` with all required frontmatter fields. **Note: used `chapter_number: 1` not `0`** (see Important Findings).
- Created `src/pages/dev/chapter-test.astro`: fetches chapters collection, finds entry by `id === 'ch-00-sample'`, throws a clear error if not found, renders via `<ChapterLayout entry={entry} />`.
- `npm run lint`: 0 errors, 0 warnings.
- `npm run build`: clean pass; `/dev/chapter-test/index.html` prerendered successfully. Build warns on empty content directories for unpopulated collections — all expected and benign.

## Output

- `src/styles/layout.css` — modified: added `.container-prose--wide` variant + responsive gutter coverage
- `src/components/shared/StickyToC.astro` — new: reusable sticky ToC (mobile disclosure + desktop sticky)
- `src/layouts/ChapterLayout.astro` — new: full chapter reading layout
- `src/content/counting-lives/chapters/ch-00-sample.mdx` — new: dev test content
- `src/pages/dev/chapter-test.astro` — new: dev test route at `/dev/chapter-test/`

## Issues

None blocking. One lint fix applied during execution (redundant `role="list"` on `<ul>` elements in `StickyToC.astro`).

## Important Findings

**Schema constraint — `chapter_number: z.number().int().positive()`**

Zod's `.positive()` validates values **strictly > 0**. The Task Assignment Prompt's sample spec used `chapter_number: 0` — this fails schema validation at build time. The sample MDX was created with `chapter_number: 1` to pass the build.

**Action required for Manager Agent:** The implementation plan or content author guidelines should document this constraint. If a "Chapter 0" (prologue/introduction) is needed for the book, the schema should be updated to use `.nonnegative()` or `.min(0)` instead of `.positive()`. This is a Task 2.1 schema decision that should be reviewed before content authors write Chapter 0.

## Next Steps

- Task 2.2b: Replace `<details>`/`<summary>` key claims placeholders in `ChapterLayout.astro` with the `<ExpandableCard>` React island when built.
- Task 2.2c: Replace thread pill placeholders in `ChapterLayout.astro` hero with the full `<ThreadMarker>` component when built.
- Remove or gate `/dev/chapter-test` and `ch-00-sample.mdx` behind a dev-only check before production deployment.
- Manager Agent should clarify `chapter_number` schema constraint (see Important Findings).
