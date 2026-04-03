---
agent: Agent_Interactive_Advanced
task_ref: Task 5.5b – TDA Results Explorer (Pre-Computed)
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 5.5b – TDA Results Explorer (Pre-Computed)

## Summary

Built the full TDA Results Explorer: a Python build script generating pre-computed persistence diagram JSON assets via native `ripser`, and a React component that displays them interactively with a filtration radius slider, cross-highlight, and full a11y. All four quality gates pass (`npm run build`, `npm run lint`, `npm run test`, `npm run build-storybook`).

## Details

**Scope change context (from Task 5.5a):** Original task referenced Pyodide, CodeMirror, and a live Python runner. Task 5.5a returned a hard NO — no Pyodide, no CodeMirror, no micropip anywhere in the output. The approved spec was strategy (c): pre-computed JSON assets via native `ripser` at dev/build time, pure React + D3 in the browser.

**Step 1 — Python build script & JSON assets:**
- Created `scripts/compute-tda.py` generating 4 presets via `ripser(points, maxdim=1)`.
- Infinite death values (last H₀ component, essential H₁ loops) capped at `max_pairwise_dist * 1.1` to ensure all JSON values are finite.
- Initial figure-eight implementation (tangent unit circles sharing one vertex) produced only 1 H₁ loop; corrected to two separate circles of radius 0.5 centred at (±0.7, 0) with a bridge point — correctly yields 2 persistent H₁ loops. The original `PointCloudEditor` figure-8 preset uses normalised screen coordinates (rr=0.18) and a shared vertex, which is not topologically equivalent to a wedge of two circles at the ripser scale.
- Created `src/lib/tda/precomputedTypes.ts` with `TDAFeature` and `TDAPreset` interfaces.

**Step 2 — TDAResultsExplorer React component:**
- Created `TDAResultsExplorer.tsx` following the NormalDistExplorer D3+React split-effect pattern exactly.
- Two sub-components: `PointCloudPanel` (React-only SVG; edges, triangles, radius circles) and `PersistenceDiagramPanel` (D3 tooltip lifecycle via `useEffect`, React SVG axes and feature circles).
- Static JSON imports map `presetId` to data — no dynamic `import()`, Vite tree-shakes unused presets.
- `useReducedMotion`: slider hidden, static snapshot at `maxR * 0.6`.
- `AriaLiveRegion` debounced 200 ms announces component/loop counts on slider change.
- `TextDescriptionToggle` wraps the entire explorer with per-preset prose descriptions.
- Cross-highlight: clicking H₁ dot in right panel sets `selectedFeatureIdx`; left panel highlights all edges present at that feature's birth radius.
- Updated `[slug].astro` with import, `PRESET_MAP` constant, and explicit slug conditional.
- Created `tda-results-explorer.mdx` manifest matching the `interactives` Zod schema.

**Step 3 — Storybook, tests & memory log:**
- `TDAResultsExplorer.stories.tsx`: 4 stories using `React.createElement` per the established pattern.
- `TDAResultsExplorer.stories.helpers.tsx`: JSX helper wrappers.
- `TDAResultsExplorer.test.ts`: 47 tests — schema validation across all 4 presets + topological assertions (circle H₁ persistence > 0.5; figure-eight H₁ count = 2; two-clusters long-lived H₀ gap).

## Output

- `scripts/compute-tda.py`
- `src/data/tda/circle-20pts.json` — 20 H₀, 1 H₁ (persistence ≈ 1.47 >> 0.5 ✓)
- `src/data/tda/two-clusters-16pts.json` — 16 H₀, 1 H₁
- `src/data/tda/figure-eight-11pts.json` — 11 H₀, 2 H₁ ✓
- `src/data/tda/random-30pts.json` — 30 H₀, 7 H₁
- `src/lib/tda/precomputedTypes.ts`
- `src/components/interactives/TDAResultsExplorer.tsx`
- `src/components/interactives/TDAResultsExplorer.css`
- `src/components/interactives/TDAResultsExplorer.stories.tsx`
- `src/components/interactives/TDAResultsExplorer.stories.helpers.tsx`
- `src/components/interactives/TDAResultsExplorer.test.ts`
- `src/content/interactives/tda-results-explorer.mdx`
- `src/pages/learn/interactives/[slug].astro` (updated — TDAResultsExplorer import + slug conditional)

**Gate results:**
- `npm run build` ✓ (63 pages, was 59 after Step 1)
- `npm run lint` ✓ (0 errors, 1 permitted warning at `PovertySimulator.tsx:331`)
- `npm run test` ✓ (231 tests across 14 files — 47 new)
- `npm run build-storybook` ✓

## Issues

None.

## Important Findings

**Figure-eight geometry requires separate lobes:** The `PointCloudEditor` figure-8 preset uses two small circles (rr=0.18, normalised coords) sharing a single vertex at (0.5, 0.5). At the ripser scale these are too tightly coupled — ripser only finds 1 H₁ loop instead of 2. The correct approach for pre-computed assets is two separate circles of radius 0.5 centred at (±0.7, 0) with a bridge point at the origin. This is a known subtlety of discrete TDA: the shared-vertex construction is topologically incorrect for persistent homology unless the inter-lobe gap is large enough. The Manager Agent should be aware that the live `FiltrationPlayground`/`PersistenceDiagramBuilder` presets may similarly only show 1 H₁ loop for figure-eight at typical interactive radii — this is not a bug to fix but a teaching point worth noting in any educational text accompanying those components.

## Next Steps

None — task complete. The route `/learn/interactives/tda-results-explorer` is live at build time.
