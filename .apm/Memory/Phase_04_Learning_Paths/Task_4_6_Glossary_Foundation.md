---
agent: Agent_Integration
task_ref: Task 4.6 - Glossary Foundation
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: false
---

# Task Log: Task 4.6 – Glossary Foundation

## Summary

Built the complete shared glossary infrastructure: a typed static data file with 27 entries spanning TDA and Counting Lives, a searchable/filterable page at `/learn/glossary/`, and an inline tooltip React island. `npm run build` passes; all new files are lint-clean.

## Details

**Integration steps completed before implementation:**
- Read ch-01 through ch-05 frontmatter — extracted key terms: normal distribution, l'homme moyen, poverty line, equivalisation, data justice, basket-of-goods, Orshansky threshold, Universal Credit taper rate, counter-mathematics; cybernetics/systems theory
- Read `persistent-homology.mdx`, `mapper.mdx`, `markov-memory-ladder.mdx` — used their prose descriptions as authoritative source for TDA definitions to ensure consistency
- Confirmed no existing `glossary` collection in `content.config.ts` — static data file pattern is correct
- Read `BaseLayout.astro` for page shell conventions (`section="learn"`, `.container-prose--wide`)
- Read `tokens.css` — all colours and spacing use CSS custom properties throughout
- Read `CitationPopover.tsx` / `CitationPopover.css` fully — mirrored hover/focus/Escape/click-outside pattern, `role="tooltip"`, `aria-describedby`, open/close state, right-edge flip via `getBoundingClientRect`, reduced-motion guard

**Step 1 — `src/data/glossary.ts`:**
- Defined `GlossaryDefinition` and `GlossaryEntry` TypeScript interfaces exactly as specified
- Authored 27 entries: 10 TDA (persistent homology, simplicial complex, filtration, Betti number, Vietoris–Rips complex, persistence diagram, Wasserstein distance, Mapper algorithm, homology group, topological data analysis), 10 Counting Lives (poverty line, equivalisation, absolute poverty, relative poverty, basket-of-goods, Orshansky threshold, Universal Credit taper rate, data justice, counter-mathematics, l'homme moyen), 7 Shared (point cloud, metric space, threshold, distribution, algorithm, measurement, normalisation)
- Definitions drawn directly from chapter `key_claims` and method page prose for content consistency; dual-domain entries (filtration, threshold, distribution, etc.) articulate the site's core intellectual argument about the duality between TDA and poverty measurement
- Exported `glossaryEntries: GlossaryEntry[]` and `getBySlug(slug: string): GlossaryEntry | undefined`

**Step 2 — `src/pages/learn/glossary/index.astro`:**
- Data sorted and grouped by first letter at build time (no client JS needed for grouping)
- Search input (`#glossary-search`, `aria-label`, `role="search"`) filters by term + full definition text client-side on `input` event
- Domain filter: three `<button>` elements with `aria-pressed` toggling; "TDA" matches entries with any `TDA` or `Shared` definition; "Counting Lives" matches `Counting Lives` or `Shared`; filter state is a simple string variable — no React island needed
- A–Z jump nav renders only letters present in dataset
- Each entry: `<h3 id={slug}>` (valid intra-page jump target), domain badges (teal/red/amber), definitions in a 2-col CSS grid on ≥640px / 1-col stacked on mobile, related-term links, content pills (chapters ochre, papers teal, methods slate)
- `.glossary-section[hidden]` / `.glossary-entry[hidden]` for filter/search state — no layout shift
- `aria-live="polite"` no-results paragraph

**Step 3 — `src/components/shared/GlossaryTooltip.tsx` + `GlossaryTooltip.css`:**
- Props: `term: string`, `slug: string` — looks up entry via `getBySlug` (synchronous, pure static data)
- Tooltip text: first definition truncated to ≤2 sentences via sentence-regex helper `truncateToSentences()`
- "See full entry →" link to `/learn/glossary/#${slug}`, `tabIndex={isOpen ? 0 : -1}` for keyboard accessibility
- Mirrors CitationPopover exactly: `useRef` wrapper/trigger/tooltip, `onMouseEnter/Leave` on wrapper, `onFocus/onBlur` on trigger (blur guard checks `relatedTarget` containment), Escape handler, click-outside handler, `requestAnimationFrame` overflow check, reduced-motion ref
- `aria-hidden` set as string `'true'`/`'false'` (jsx-a11y `aria-proptypes` rule requires string, not boolean expression)
- CSS uses `.gt-` prefix; top border in `--color-tda-teal` to visually distinguish from CitationPopover (`.cp-`, CL red)
- Graceful fallback: renders plain `<span class="gt-missing">` for unknown slugs

**Validation:**
- `npm run build` — passes, `/learn/glossary/index.html` prerendered successfully
- `npm run lint` on new files — 0 errors; 2 pre-existing errors in `PovertySimulator.tsx` and `reading-lists/index.astro` confirmed unrelated to this task

## Output

- `src/data/glossary.ts` — 27 typed glossary entries + `getBySlug` helper
- `src/pages/learn/glossary/index.astro` — searchable/filterable glossary at `/learn/glossary/`
- `src/components/shared/GlossaryTooltip.tsx` — React island tooltip component
- `src/components/shared/GlossaryTooltip.css` — scoped styles under `.gt-` prefix

## Issues

One apparent lint error reported by the VS Code language server for `aria-hidden={!isOpen}` (boolean expression), but running `npx eslint` directly on the file produces zero errors. Fixed defensively by converting to string `aria-hidden={isOpen ? 'false' : 'true'}` which satisfies the jsx-a11y `aria-proptypes` rule. Language server error is a stale-cache false positive.

## Next Steps

- MDX files can now import `GlossaryTooltip` via: `import { GlossaryTooltip } from '@components/shared/GlossaryTooltip'`
- Glossary page is live at `/learn/glossary/` — no routing configuration needed
- Task 4.7 (Reading Lists) and Phase 4 review (Task 4.8) can proceed; glossary is available as a dependency
- Pre-existing lint errors (`PovertySimulator.tsx` react-hooks/exhaustive-deps warning; `reading-lists/index.astro` no-redundant-roles error) should be addressed in a separate task
