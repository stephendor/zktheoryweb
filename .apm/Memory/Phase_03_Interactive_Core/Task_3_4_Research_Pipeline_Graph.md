---
agent: Agent_Interactive_Core
task_ref: Task_3.4
status: Completed
ad_hoc_delegation: false
compatibility_issues: true
important_findings: true
---

# Task Log: Task 3.4 — Research Pipeline Graph

## Summary

Built the TDA research pipeline as a D3 force-directed graph accessible at `/tda/pipeline/`. All deliverables complete; graph renders 10 nodes across 4 stages with correct directed edges, keyboard navigation, timeline overlay, compute indicators, status legend, mobile list fallback, and accessible text description toggle.

## Details

**Integration (Dependency context):**
- `src/content.config.ts` — `papers` schema uses `depends_on: number[]` and `enables: number[]` with *integer* paper numbers (not slugs). Confirmed via schema read.
- All 10 paper stubs populated and readable. Slugs follow `paper-0N` pattern except Paper 1 which is `paper-01-sample`.
- GPU/cloud compute papers: 4 (GPU, cloud:true), 7 (GPU, cloud:true), 8 (GPU, cloud:true), 9 (Cloud GPU, cloud:true).

**Step 1 — Data layer:**
- `PipelineGraph.data.ts`: `PipelineNode`, `PipelineEdge`, `PipelineGraphData`, `PaperEntry` types; `toPipelineGraph()` transform. Edge deduplication via `Set` keyed on `"srcNum-tgtNum"`. Self-loops and unknown references silently skipped.
- `PipelineGraph.data.test.ts`: 12 Vitest unit tests (nodes + edges suites) — all pass.
- `src/pages/tda/pipeline/index.astro`: `getCollection('papers')` → `toPipelineGraph` → `<PipelineGraph client:visible />`.

**Step 2 — D3 force simulation:**
- Forces: `forceLink` (distance 90, strength 0.4), `forceManyBody` (repulsion −300), `forceCenter` (weak 0.05), `forceX` stage-bias (STAGE_X_FRAC [0.08, 0.34, 0.64, 0.90], strength 0.75), `forceY` soft vertical centering.
- D3 owns physics only; React renders all SVG from `posMap` state updated per tick.
- Node y-clamped to exclude TIMELINE_H + 10 px at bottom for timeline clearance.
- Directed arrowhead via SVG `<marker id="pg-arrow">` with endpoint offsets per radius.
- Node radius by stage: 28/22/18/15 px; fill colour by status via CSS classes on TDA palette tokens.

**Step 3 — Interactive features:**
- Click/Enter/Space on node → `window.location.href = /tda/papers/${node.id}/`.
- Timeline overlay: 4 alternating band rects, stage labels ("Foundations"/"Core Methods"/"Applications"/"Synthesis"), axis line, month ticks at 0/12/24/36/48m.
- Compute indicators: ☁ cloud icon and `GPU` text badge rendered via SVG text adjacent to node circle.
- `StatusLegend` component below SVG with 6 colour swatches.

**Step 4 — A11y, Storybook, build:**
- `useReducedMotion()`: if true, simulation skipped; nodes placed at `computeStaticPositions()` (stage column x, evenly spaced y per stage).
- `makeFocusable` via D3 on all `.pg-node` elements in `useEffect`; `role="button"` re-applied afterward (correct semantics for navigation).
- `arrowKeyHandler` attached to SVG parent for arrow-key focus traversal, calls `setLiveMsg`.
- `onFocus` on each node `<g>` sets `liveMsg` with paper number, title, stage, status.
- `AriaLiveRegion message={liveMsg}` announces focus changes to screen readers.
- `TextDescriptionToggle` wraps the responsive container; programmatic `buildTextDescription()` generates ordered prose description of all papers and dependencies.
- Mobile fallback (`MobileListFallback`): shown for viewport ≤ 767 px; `.pg-graph-section` hidden via CSS media query; ordered list with `<a>` links to each paper page.
- `PipelineGraph.stories.helpers.tsx`: `PipelineGraphDemo`, `PipelineGraphPublished`, `MOCK_GRAPH_DATA`, `PUBLISHED_GRAPH_DATA`.
- `PipelineGraph.stories.tsx`: 4 stories using `React.createElement` (Default, StatusVariety, SingleNode, FullDataset).

## Output

- `src/components/interactives/PipelineGraph.tsx` — main component
- `src/components/interactives/PipelineGraph.css` — styles
- `src/components/interactives/PipelineGraph.data.ts` — types + transform
- `src/components/interactives/PipelineGraph.data.test.ts` — 12 unit tests
- `src/components/interactives/PipelineGraph.stories.tsx` — Storybook stories
- `src/components/interactives/PipelineGraph.stories.helpers.tsx` — story JSX helpers
- `src/pages/tda/pipeline/index.astro` — page route

Final gate: `npm run test` — 111/111 ✓ | `npm run lint` — 0 errors ✓ | `npm run build` — Complete, `/tda/pipeline/index.html` built ✓

## Issues

One pre-existing build failure fixed: `src/pages/learn/interactives/[slug].astro` used `<mapped.component client:visible />` with a runtime-resolved object property — Astro cannot statically analyze dynamic component references. Fixed by replacing with explicit conditional slug-based rendering. This fix was required to unblock the build gate; documented as a compatibility issue.

## Compatibility Concerns

1. **Pre-existing build failure fixed**: `[slug].astro` dynamic component pattern changed to explicit conditionals. Not a breaking change — behavior is identical. Manager should note for Task 3.2 retrospective.

2. **`depends_on`/`enables` are integers, not slugs**: The content schema uses paper numbers. The `toPipelineGraph` transform handles the number→slug resolution internally via `numToSlug` map. All consumers must use this transform (not raw frontmatter) to build graph edges.

## Important Findings

1. **Stub dependency structure differs from PRD Appendix B fallback**: Stub data uses a hub-and-spoke model rather than PRD's stricter hierarchical chain:
   - Stubs: Papers 2–6 all depend directly on Paper 1; Papers 8–10 all depend directly on Paper 7.
   - PRD Appendix B: Papers 2–3 → Papers 4–6 → Papers 7–8, 9, 10 (three-level hierarchy).
   - Paper 1's `enables` field lists `[2, 3, 4, 5, 6]` (flat fan-out from stage 0 directly to stages 1 and 2).
   - The **stubs are authoritative**; the fallback was NOT used. The rendered graph will reflect the stub dependency topology, which differs from the PRD diagram.
   - Manager should review with paper author whether the stub enables/depends_on topology is intended or whether it needs correcting to match the PRD three-level hierarchy.

2. **Pre-existing build failure**: `NoMatchingImport` in `[slug].astro` (introduced in Task 3.2) blocked the full build. Fixed here.

## Next Steps

- Manager to review stub dependency topology vs PRD Appendix B and confirm with paper author which is authoritative.
- Tasks 3.2 and 3.3 must complete before Task 3.5 gate can proceed.

compatibility_issues: false
important_findings: false
---

<!-- To be populated by Agent_Interactive_Core upon task completion -->
