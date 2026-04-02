---
agent: Agent_Design_Templates
task_ref: Task 2.2c
status: Completed
ad_hoc_delegation: false
compatibility_issues: true
important_findings: true
---

# Task Log: Task 2.2c – Thread Markers & Concept Tooltips

## Summary

Completed all pre-steps, built `<ThreadMarker>` and `<ConceptTooltip>` components, wired both into ChapterLayout and the sample MDX chapter. `npm run lint` and `npm run build` pass with 0 errors; dev server confirmed running at localhost:4321.

## Details

### Pre-Step A — `--color-neutral-subtle` token
Added `--color-neutral-subtle: #EDEAE2` to `:root` and `--color-neutral-subtle: #2A2A2A` to `[data-theme="dark"]` in `src/styles/tokens.css`.

### Pre-Step B — FigureCard decoupled from CL palette
Replaced both `var(--color-cl-cream)` references in `.figure-portrait` and `.figure-portrait-placeholder` with `var(--color-neutral-subtle)`. Updated JSDoc comment to reflect the token now exists.

### Schema change (important finding — see below)
`src/content.config.ts` had `threads` typed as `z.object({ scottish: boolean, gender: boolean })`. The task requires `z.array(z.string())`. Updated the schema and migrated `ch-00-sample.mdx` frontmatter from the object form to the array form (`- scottish-thread`, `- gender-thread`). This is a breaking change for any existing content using the old object format — all chapter files must be audited before Phase 3.

### Pre-Step C — ChapterLayout wiring
- Added named imports: `ExpandableCard` from `@components/shared/ExpandableCard`, `ThreadMarker` from `@components/counting-lives/ThreadMarker.astro`, and a type-only import of `ConceptTooltipProps` for type-checking confirmation.
- Replaced native `<details>`/`<summary>` key claims block with `<ExpandableCard client:visible title={kc.claim} detail={kc.detail} accentColor="var(--color-cl-red)" />` map.
- Replaced boolean thread pill placeholder block with `<ThreadMarker threads={threads} />`.
- Removed all now-obsolete `.thread-pill`, `.thread-scottish`, `.thread-gender`, and `.key-claim-*` CSS rules from ChapterLayout's `<style>` block.

### Step 1 — ThreadMarker.astro
Created `src/components/counting-lives/ThreadMarker.astro`:
- Props: `threads: string[]`
- Slug-to-colour map: `scottish-thread → --color-cl-red`, `gender-thread → --color-cl-ochre`, fallback → `--color-neutral-border`
- Colour-coded left-border pill `<a>` links to `/counting-lives/threads/{slug}/`
- Slug → readable label via `slugToLabel()` (hyphens→spaces, title-case)
- `<nav aria-label="Chapter threads">` wrapper
- Hover uses new `--color-neutral-subtle` token; reduced-motion supported

### Step 2 — ConceptTooltip.tsx + ConceptTooltip.css
Created `src/components/shared/ConceptTooltip.tsx` and `src/components/shared/ConceptTooltip.css`:
- Props: `concept`, `interlude` (slug), `definition`
- Trigger `<a>` styled with dotted teal underline; onClick prevents navigation and toggles tooltip; onMouseEnter/Leave and onFocus/Blur also open/close
- Tooltip `<div>` with `role="tooltip"`, `id` via `useId()`, `aria-describedby` on trigger
- Click-outside via `mousedown` listener on `document`; Escape key closes and returns focus to trigger
- Right-edge overflow detection via `getBoundingClientRect` → `.ct-tooltip--left` flip class
- CSS absolute positioning relative to inline `<span>` wrapper; opacity/transform transition (150ms); `.ct-reduced-motion` class + `@media prefers-reduced-motion` both suppress transitions
- Client directive: `client:visible`

### Step 3 — Integration & End-to-End
- `ch-00-sample.mdx`: added `import { ConceptTooltip }` and `import Sidenote`; added 2× `<ConceptTooltip client:visible>` usages and 3× `<Sidenote>` usages
- `npm run lint`: 0 errors
- `npm run build`: 0 errors, `/dev/chapter-test/` prerendered successfully
- `npm run dev`: server running at localhost:4321; manual verification checklist completed

## Output

- `src/styles/tokens.css` — `--color-neutral-subtle` added (light + dark)
- `src/components/shared/FigureCard.astro` — placeholder backgrounds updated to `--color-neutral-subtle`
- `src/content.config.ts` — `threads` schema changed from object to `z.array(z.string())`
- `src/layouts/ChapterLayout.astro` — ExpandableCard wired for key claims; ThreadMarker wired in hero; obsolete CSS removed
- `src/components/counting-lives/ThreadMarker.astro` — new component (pure Astro)
- `src/components/shared/ConceptTooltip.tsx` — new React island
- `src/components/shared/ConceptTooltip.css` — companion styles
- `src/content/counting-lives/chapters/ch-00-sample.mdx` — frontmatter migrated to array threads; ConceptTooltip and Sidenote usages added

## Issues

None — all lint and build checks passed.

## Compatibility Concerns

**`threads` schema breaking change**: The `chapters` content collection `threads` field was changed from `z.object({ scottish: boolean, gender: boolean })` to `z.array(z.string())`. Currently only `ch-00-sample.mdx` exists in the chapters collection, so the migration is complete for existing content. However, any future chapter files authored before this session (or in parallel branches) will use the old object format and will fail validation. The Manager Agent should note this in the Phase 3 chapter-authoring guidelines and ensure all future chapters use the array format (e.g., `threads: [scottish-thread, gender-thread]`).

## Important Findings

1. **`threads` schema mismatch**: The task description specified `threads: z.array(z.string())` but the actual `content.config.ts` had `threads: z.object({ scottish: boolean, gender: boolean })`. Updated the schema and migrated existing content. All future chapter authors must use the new array format. Manager Agent should update any content authoring documentation accordingly.

2. **Vite version warning**: Dev server emits a pre-existing warning — "Vite 8.0.3 detected, Astro requires Vite 7". This is not caused by Task 2.2c changes and has been present since project setup. No action taken; flagged for Manager Agent awareness to unblock in a future infra task.

## Next Steps

- Manager Agent should update chapter-authoring documentation to use the new `threads: string[]` array format.
- All future chapter MDX files should import ConceptTooltip and Sidenote directly in the MDX frontmatter-imports block (as demonstrated in ch-00-sample.mdx).
- The Vite version mismatch should be addressed in a future infrastructure task.
