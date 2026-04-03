# Phase 4 Manager Handover

**Date:** 2026-04-03  
**Outgoing manager:** GitHub Copilot (Claude Sonnet 4.6), conversation 697fa7c9  
**Incoming phase:** Phase 4 — Learning Paths  
**Repository:** stephendor/zktheoryweb  
**Open PR:** [#1 feat: Phase 3 — Interactive Core](https://github.com/stephendor/zktheoryweb/pull/1) — Copilot review requested, awaiting merge to `main`

---

## 1. Current State

### Build health (as of handover)
```
Branch:     phase-3/interactive-core (PR #1, not yet merged)
Tests:      124 passing (9 test files)
Lint:       exit 0 — 0 errors, 1 intentional warning (see §4.1)
Build:      Complete — all 26 static routes generated
```

### Working tree
All Phase 3 work is committed to `phase-3/interactive-core`. The `main` branch is at the Phase 2 commit (`c38791d`). **Do not start Phase 4 tasks until PR #1 is merged.**

---

## 2. Task 3.8 Escalation Decisions (User-Approved)

| Interactive | Route | Decision |
|---|---|---|
| Normal Distribution Explorer | `/learn/interactives/normal-distribution-explorer` | **Keep SVG** |
| Poverty Threshold Simulator | `/learn/interactives/poverty-threshold-simulator` | **Keep SVG** |
| Research Pipeline Graph | `/tda/pipeline/` | **Keep SVG (D3 force-directed)** |
| Five Transitions Timeline | `/counting-lives/transitions/` | **Keep SVG** |
| Persistence Diagram Builder | `/learn/interactives/persistence-diagram-builder` | **Escalate to 3D WebGL** → Task 5.1 |

Task 5.1 (WebGL upgrade) is a Phase 5 task. Phase 4 should proceed without it.

---

## 3. Phase 4 Task List

In dependency order per `Implementation_Plan.md`:

| Task | Agent | Depends on | Notes |
|---|---|---|---|
| **4.1** Learning Hub Structure & Path Landing Pages | Agent_Design_Templates | PR #1 merged | `/learn/` index, path landing template, interactives gallery |
| **4.2** Progress Tracking System (localStorage) | Agent_Schema_Platform | 4.1 | React context/hook, SSR-safe, Vitest tests |
| **4.3** Path 1 MDX Stubs: Topology for Social Scientists | Agent_Content | 4.1, 2.4 | 8 modules, ~1,000 words each |
| **4.4** Path 2 MDX Stubs: Mathematics of Poverty | Agent_Content | 4.1, 2.4 | 8 modules, ~1,000 words each |
| **4.5** Embed Phase 3 Interactives in Modules | Agent_Interactive_Core | 4.3, 4.4 | Wire existing interactives into module MDX |
| **4.6** Glossary Foundation | Agent_Integration | 2.6a, 2.7 | 20–30 terms, dual TDA/Counting Lives definitions |
| **4.7** Reading Lists & Curated Resources | Agent_Content | 2.9b | 4–6 lists, Zotero integration |
| **4.8** User Review Checkpoint: Phase 4 | **User** | all above | — |

Tasks 4.3 and 4.4 can run in parallel. Task 4.5 requires both to be complete.

---

## 4. Codebase Patterns — Must-Know

### 4.1 Intentional lint warning
`PovertySimulator.tsx` line 331: `react-hooks/exhaustive-deps` warning on a D3 chart-build effect that intentionally excludes `method`, `threshold`, and `onThresholdChange` from deps to avoid full chart redraws on every state change. This is by design. **Do not "fix" by adding these deps** — it will cause continuous D3 re-renders. The warning is suppressed to `warn` not `error` in `eslint.config.js` for this reason.

### 4.2 Storybook stories — React.createElement required
All Storybook story `render` functions must use `React.createElement(Component, props)` not JSX. This is a hard constraint of Vite 8/rolldown in the current Storybook 10 setup — the bundler cannot handle JSX in `*.stories.tsx` files. Complex JSX helpers belong in `*.stories.helpers.tsx` files (outside the Storybook glob) which can use normal JSX. This pattern is established across all 7 story files.

### 4.3 Testing — afterEach(cleanup) required
`@testing-library/react` v16 does **not** auto-call `cleanup()` between tests in Vitest's happy-dom environment. Every test file that renders React components must import and call `afterEach(cleanup)` explicitly. Without it, rendered DOM leaks between test files sharing a happy-dom worker and causes false failures in unrelated test files. See `TransitionsTimeline.interaction.test.tsx` for the canonical pattern.

### 4.4 ExpandableCard uses `inert` not `aria-hidden`
`ExpandableCard.tsx` was updated by the Task 3.7b agent to use the `inert` attribute on collapsed panels instead of `aria-hidden="true"`. This provides better keyboard isolation (inert elements are not focusable via Tab). Tests for collapsed state must use `hasAttribute('inert')`, not `getAttribute('aria-hidden') === 'true'`. The `ExpandableCard.test.tsx` has already been updated.

### 4.5 TextDescriptionToggle is additive
`TextDescriptionToggle` was redesigned in the Task 3.5 bug-fix pass. It now shows the text description **below** the visualisation rather than replacing it. The `.tdt-viz--hidden` CSS class is no longer used. Any new interactive wrapping `TextDescriptionToggle` should expect this additive behaviour.

### 4.6 eslint-disable placement in useEffect
When suppressing `react-hooks/exhaustive-deps` for an intentional split-effect, the `// eslint-disable-next-line react-hooks/exhaustive-deps` comment must go on the line **immediately before the closing `}, []`** (i.e., inside the effect body as a trailing comment on the deps line). Placing it before `useEffect(() => {` does not suppress the warning — ESLint fires on the deps-array line at close.

### 4.7 D3 + React rendering pattern
All interactive components use the same split-effect pattern:
- D3 owns physics/force simulation and scale computation only
- All SVG elements are rendered as React JSX from state (`posMap`, `curveData`, etc.)
- D3 effects use stable `useCallback` refs for handlers to avoid stale closures
- `useMemo` is required for D3 scales — inline `d3.scaleLinear()` creates new references each render and causes the `useEffect` to re-run continuously

### 4.8 Paper dependency topology
Paper frontmatter `depends_on` and `enables` use integer paper numbers (not slugs). The PRD three-level hierarchy is authoritative:
- Stage 0→1: Paper 1 → Papers 2, 3
- Stage 1→2: Paper 2 → Papers 4, 5 | Paper 3 → Papers 4, 6
- Stage 2→3: Paper 4 → Papers 7, 8 | Paper 5 → Paper 9 | Paper 6 → Paper 10

The `toPipelineGraph()` transform in `PipelineGraph.data.ts` handles number→slug resolution internally via `numToSlug` map. All graph consumers must use this transform.

### 4.9 Astro dynamic component pattern
Astro cannot statically analyse `ComponentMap[slug]` patterns (i.e., `<mapped.component client:visible />`). Dynamic slug routes (`[slug].astro`) must use explicit conditional rendering:
```astro
{slug === 'normal-distribution-explorer' && <NormalDistExplorer client:visible />}
{slug === 'poverty-threshold-simulator' && <PovertySimulator client:visible />}
```
The existing `src/pages/learn/interactives/[slug].astro` uses this pattern. New interactives for Phase 4/5 must be added as explicit conditionals.

### 4.10 Build preview
`npm run preview` is **unsupported** with the `@astrojs/netlify` adapter. Use `npm run build && npx serve dist --listen 4321` to verify built output locally.

### 4.11 VR filtration — H₀ generator sparseness
`vietorisRips.ts` populates `generator` only for H₁ cycle-detection edges. H₀ features carry a single-vertex generator (the component root), not the merging edge. Cross-highlighting from persistence diagram to point cloud works reliably for H₁ loops; for H₀ it matches only if an edge endpoint is that feature's root vertex. This is documented in the Task 3.7b log.

---

## 5. Known Remaining Issues

### 5.1 TypeScript errors in `astro check` (non-blocking)
14 TS errors reported by `astro check`, all pre-existing from Phase 3 agents (D3 scale type narrowing mismatches, `StickyToC.astro` parameter type annotations). These do not affect the build or tests — `npm run build` and `npm run test` are clean. A Phase 4 or Phase 5 agent should resolve them as part of the first task that touches those files, or as a dedicated tidy-up:
- `NormalDistExplorer.tsx` — `AxisScale<number>` assignment (2 errors)
- `PovertySimulator.tsx` — `ScaleLinear` assignment + `Selection` type (3 errors)
- `TransitionsTimeline.tsx` — `AxisScale` + `KeyboardEventHandler` (2 errors)
- `StickyToC.astro` — implicit `any` on heading params (3 errors)
- `ResponsiveContainer.stories.tsx` — overload mismatch (1 error)
- `axes.ts` — null conversion (2 errors)
- `keyboardNav.ts` — `HTMLOrSVGElement` cast (1 error)

### 5.2 Tracked file changes reset to HEAD
During Phase 3, a batch of improvements to tracked files (pagination in `zotero.ts`, BibTeX escaping in `bibliography.ts`, draft filtering in `[tag].astro`) were introduced by agents but contained an unterminated string literal that blocked the esbuild bundle. These were reset to HEAD to unblock the build. The improvements are recoverable from the Phase 3 git history (`git diff c38791d phase-3/interactive-core -- src/lib/zotero.ts` etc.) if the new manager wants to reapply them cleanly.

---

## 6. File Structure Added in Phase 3

```
src/
  lib/
    viz/                    ← Shared interactive infrastructure
      ResponsiveContainer.tsx/.css/.stories.*
      axes.ts, scales.ts, tooltip.ts, types.ts
      a11y/
        AriaLiveRegion.tsx/.css
        TextDescriptionToggle.tsx/.css
        keyboardNav.ts, paletteEnforcement.ts, useReducedMotion.ts
    tda/
      vietorisRips.ts       ← VR filtration algorithm
      vietorisRips.test.ts  ← 41 unit tests
  components/
    interactives/           ← All 5 Phase 3 interactives + PointCloudEditor
      NormalDistExplorer.*
      PovertySimulator.*
      PipelineGraph.*
      TransitionsTimeline.*
      PersistenceDiagramBuilder.*
      PointCloudEditor.*    ← Shared point cloud input (extended by PDB)
  content/
    interactives/           ← Content manifests for dynamic route
      normal-distribution-explorer.mdx
      poverty-threshold-simulator.mdx
      persistence-diagram-builder.mdx
  pages/
    learn/interactives/[slug].astro   ← Dynamic route for all interactives
    tda/pipeline/index.astro
    counting-lives/transitions/index.astro
.storybook/
  main.ts, preview.ts
```

---

## 7. Phase 4 Sequencing Recommendation

1. **Wait for PR #1 to pass Copilot review and merge** before starting any Phase 4 work.
2. Start **Task 4.1** (Learning Hub) and **Tasks 4.3 + 4.4** (MDX stubs) in parallel — 4.1 unblocks 4.2; 4.3/4.4 can run independently of 4.2.
3. Run **Task 4.2** (Progress Tracking) after 4.1.
4. Run **Task 4.5** (Embed interactives) only after 4.3 + 4.4 are both complete.
5. **Tasks 4.6 + 4.7** (Glossary + Reading Lists) can run in parallel with 4.3–4.5.
6. Close with **Task 4.8** (User Review).

The WebGL upgrade for the Persistence Diagram Builder is **Task 5.1** in Phase 5 — do not include it in Phase 4 scope.
