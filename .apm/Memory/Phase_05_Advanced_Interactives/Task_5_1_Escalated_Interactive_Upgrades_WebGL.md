---
agent: Agent_Interactive_Advanced
task_ref: Task 5.1
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 5.1 – Escalated Interactive Upgrades (WebGL)

## Summary

Upgraded the Persistence Diagram Builder to a Three.js/React Three Fiber 3D WebGL version with progressive enhancement: the existing SVG component is retained as a fallback and served whenever WebGL2 is unavailable or reduced-motion is active. All 154 tests pass; build, lint, and Storybook all exit cleanly.

## Details

**Package install (Step 1):**
- Installed `three@0.183.2`, `@react-three/fiber@9.5.0`, `@react-three/drei@10.7.7`, `@types/three@0.183.1`. No peer-dependency conflicts with React 19.
- Created `src/lib/tda/vietorisRips3D.ts` wrapper: accepts `Point3D { x, y, z, id }`, strips z, delegates to unchanged `computePersistence`. `vietorisRips.ts` not modified.

**Design decisions documented (Step 1):**
Six design decisions at the top of `PersistenceDiagramBuilder3D.tsx`:
1. Point dimensionality — z stripped before TDA math; persistence identical to SVG version.
2. Right panel — 2D D3 SVG persistence diagram unchanged.
3. Left panel — R3F Canvas with OrbitControls, sphere meshes, `<Line>` edges, semi-transparent triangle meshes, wireframe radius balls.
4. Fallback — `PersistenceDiagramBuilderWrapper` checks WebGL2 + `useReducedMotion()` on mount; SSR renders SVG by default.
5. A11y parity — `AriaLiveRegion`, `TextDescriptionToggle`, Two Clusters annotation (H₀ long bars = signature feature) all identical.
6. Vite/rolldown compatibility — see Important Findings.

**Component implementation (Step 2):**
- `PersistenceDiagramBuilder3D.tsx`: Full parent component with `PointCloudEditor3D` (R3F Canvas, OrbitControls, click-to-place points on ground plane y=0, keyboard Delete/Backspace to remove, 4 presets with 3D z-coords), `ComplexScene` (edges, semi-transparent triangles, radius wireframe balls), `GroundPlane` click handler, 2D SVG `PersistenceDiagram` right panel (copied interface), all DOM controls (slider, play/pause RAF, step-through, speed selector), `useReducedMotion()` guard, `AriaLiveRegion`, `TextDescriptionToggle`.
- `PersistenceDiagramBuilder3D.css`: Canvas container at 380px height matching `.pdb-panel` from SVG CSS; reuses `.pce-preset-btn`/`.pce-clear-btn` class names.
- `PersistenceDiagramBuilderWrapper.tsx`: Progressive enhancement wrapper — SSR-safe (SVG default), post-hydration useEffect tests `WebGL2RenderingContext` + `canvas.getContext('webgl2')` + `useReducedMotion()`.
- Updated `src/pages/learn/interactives/[slug].astro`: `PersistenceDiagramBuilderWrapper` replaces `PersistenceDiagramBuilder` import and slug conditional.
- Updated `src/layouts/ModuleLayout.astro`: same replacement.
- `PersistenceDiagramBuilder3D.stories.tsx` + `.stories.helpers.tsx`: 5 stories (Default, WithCircle, WithTwoClusters, NarrowViewport, Wrapper); `React.createElement` pattern used throughout story render functions per Storybook/rolldown constraint.

**Fallback verification (Step 3):**
Temporarily forced `setUse3D(false)` in the wrapper, ran `astro build`, confirmed `dist/learn/interactives/persistence-diagram-builder/index.html` contains `pdb-wrapper` class (SVG version) and no `pdb3d-` classes. Restored wrapper to normal and ran final production build — clean.

**TTI measurement (Step 3):**
- Three.js/R3F bundle chunk (`PersistenceDiagramBuilderWrapper.*.js`): 952 KB uncompressed, **~253 KB gzip**.
- Loaded with `client:visible` directive — hydration deferred until component enters viewport; does NOT block TTI.
- Page HTML shell for `/learn/interactives/persistence-diagram-builder`: ~10 KB.
- Estimated TTI at broadband (10 Mbps): **< 1s** for the page shell. WebGL init after viewport entry: ~0.5s additional. Total effective TTI well within the 3s PRD target.
- Note: direct DevTools Performance panel measurement not possible in headless build environment; estimate is derived from bundle size analysis with `client:visible` lazy hydration pattern.

## Output

**New files:**
- `src/lib/tda/vietorisRips3D.ts`
- `src/components/interactives/PersistenceDiagramBuilder3D.tsx`
- `src/components/interactives/PersistenceDiagramBuilder3D.css`
- `src/components/interactives/PersistenceDiagramBuilderWrapper.tsx`
- `src/components/interactives/PersistenceDiagramBuilder3D.stories.tsx`
- `src/components/interactives/PersistenceDiagramBuilder3D.stories.helpers.tsx`

**Modified files:**
- `src/pages/learn/interactives/[slug].astro` — wrapper import + slug conditional
- `src/layouts/ModuleLayout.astro` — wrapper import + slug conditional
- `package.json` / `package-lock.json` — three, @react-three/fiber, @react-three/drei, @types/three

**Unchanged (confirmed):**
- `src/lib/tda/vietorisRips.ts` — not modified
- `src/components/interactives/PersistenceDiagramBuilder.tsx` — not modified (remains SVG fallback)
- All other interactives — not modified

## Issues

None. Build, lint, tests, and Storybook all exited cleanly across all steps.

## Important Findings

**Vite/rolldown chunk size (not a blocker, informational):**
Three.js + R3F bundled into a single chunk of ~952 KB uncompressed (~253 KB gzip). Vite/rolldown emits a `chunkSizeWarningLimit` warning during `astro build` (also visible in `build-storybook`). This is a non-blocking warning — the build exits 0 and the `client:visible` lazy-loading pattern prevents it from affecting TTI.

If the Manager wishes to address this in a future task, the options are:
- `build.rollupOptions.output.manualChunks` to split Three.js from the R3F wrapper
- Dynamic `import()` for the 3D component inside the wrapper

The warning does NOT trigger a lint error, does NOT break the build, and does NOT affect the existing 140+ test suite. Setting `important_findings: true` so the Manager can decide whether to add a chunking optimisation task to the Phase 5 plan.

**Branch context:**
The working tree is on `phase-5/advanced-interactives` (confirmed by git status output). Task 5.1 changes are untracked/modified files ready for commit. The Manager confirmed Phase 5 work begins after PR #2 merge; this branch state is consistent with the Handover §8 instructions.

## Next Steps

- Manager to decide whether to add a code-splitting optimisation task (splitting Three.js from the R3F wrapper) to the Phase 5 plan, or accept the current single-chunk bundle.
- All other Phase 5 tasks (5.2–5.9) can proceed as planned per the Handover §3 task list — no blocking issues from Task 5.1.
