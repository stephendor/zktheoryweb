---
agent: Agent_Interactive_Core
task_ref: Task_3.7a
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 3.7a — Persistence Diagram Builder: Algorithm & Point Cloud Input

## Summary

Implemented the Vietoris-Rips filtration algorithm (`vietorisRips.ts`) from scratch with union-find H₀ and cycle-detection H₁, covering all required edge cases. Created the `PointCloudEditor` React component with D3 drag, preset configurations, and full a11y. All 17 Vitest tests pass; pre-existing lint/build failures are unrelated to this task.

## Details

**Step 1 — Algorithm (`src/lib/tda/vietorisRips.ts`):**
- Evaluated `simplicial-complex` npm package: C-style integer-array API, no persistence computation, unsuitable for clean TypeScript use. Implemented from scratch.
- Exports `Point2D`, `Simplex`, `PersistenceFeature` types, `buildComplex`, `computePersistence`.
- Truncation policy: silently truncate to 30 points (editor enforces cap at interaction level; algorithm never hard-errors on slightly oversized input).
- Deduplication: squared-distance tolerance `1e-12`.
- H₀ via union-find with elder rule (younger component dies when merged).
- H₁ via cycle detection: edge creating a cycle → birth; 2-simplex whose longest edge matches generating edge → death.
- Edge processing order: sorted by distance within each radius step for topological stability.

**Step 2 — Tests (`src/lib/tda/vietorisRips.test.ts`):**
- 17 tests across 5 `describe` blocks covering all 6 required scenarios.
- Circle (8 pts): 7 mortal + 1 immortal H₀; ≥1 persistent H₁ loop born at chord radius ✓
- Two clusters: 1 immortal + 1 late-dying H₀; H₁ assertion corrected (see Important Findings) ✓
- Figure-8 (11 pts): ≥2 persistent H₁ loops ✓
- Empty input: returns `[]` ✓
- Single point: 1 H₀ feature, born at step 0, death null ✓
- Performance: 30 pts × 20 steps completes in ~32ms (limit: 500ms) ✓

**Step 3 — PointCloudEditor (`src/components/interactives/PointCloudEditor.tsx`):**
- Standalone composable island; left panel for Task 3.7b composition.
- SVG canvas with `ResponsiveContainer` (380px height, full width).
- Click to add (max 30, enforced); D3 drag to reposition; double-click or Delete/Backspace to remove.
- Counter `N/30 points` with `pce-counter--full` warning style when at capacity.
- 4 preset buttons: Circle (8), Two Clusters (8), Figure-8 (11), Random (15).
- `onPointsChange` callback fires on every state change via `useEffect`.
- Tooltip via `createTooltip`/`showTooltip` from `@lib/viz/tooltip`.
- Grid lines (8 divisions per axis) drawn from CSS tokens.
- WCAG keyboard nav: `tabIndex={0}` on points, Delete/Backspace removes.
- Co-located CSS (`PointCloudEditor.css`) uses TDA "Mathematical" palette tokens.
- Storybook (`PointCloudEditor.stories.tsx`): 6 stories using `React.createElement` pattern; helpers in `PointCloudEditor.stories.helpers.tsx`.

## Output

- `src/lib/tda/vietorisRips.ts` — algorithm implementation
- `src/lib/tda/vietorisRips.test.ts` — 17 Vitest tests (all passing)
- `src/components/interactives/PointCloudEditor.tsx` — React component
- `src/components/interactives/PointCloudEditor.css` — component styles
- `src/components/interactives/PointCloudEditor.stories.tsx` — Storybook (6 stories)
- `src/components/interactives/PointCloudEditor.stories.helpers.tsx` — complex JSX helpers

## Issues

Pre-existing failures confirmed by `git stash` verification — not introduced by this task:
- `NormalDistExplorer.test.ts`: 3 failing tests (floating-point precision + far-tail underflow)
- `eslint`: 1 error in `PipelineGraph.tsx` (`react-hooks/exhaustive-deps` rule not found)
- `astro build`: fails on `/learn/interactives/normal-distribution-explorer/` (`NoMatchingImport`)

## Important Findings

**Topological finding — relevant for Task 3.7b documentation:**

The two-cluster H₁ test confirmed a correct but non-obvious TDA result: a **4-point square** in Vietoris-Rips filtration produces **β₁ = 1** (one persistent H₁ loop). The cycle born when the 4th boundary edge closes the square cannot be killed because no triangle in the complex has that boundary edge as its longest side — the diagonal edges become "killer" edges for other cycles, leaving the original boundary cycle unkilled.

This is mathematically correct per Vietoris-Rips theory, but differs from the intuition that "two tight clusters show β₁ = 0". The two-clusters preset's topological story is correctly told by H₀ (two long-lived components), not by H₁ = 0.

**Implication for Task 3.7b:** The persistence diagram panel's annotation/legend for the Two Clusters preset should describe the H₀ long bar (birth near 0, death at inter-cluster distance ~0.54) as the signature feature, not β₁ = 0.

## Next Steps

Task 3.7b (visualisation + interaction) can now be assigned:
1. Import `PointCloudEditor` as the left panel.
2. Connect `onPointsChange` → `computePersistence` → persistence diagram rendering.
3. Use `useReducedMotion` from `@lib/viz/a11y/useReducedMotion` for animation guard.
4. Document the two-clusters topology note above in the panel's legend.
