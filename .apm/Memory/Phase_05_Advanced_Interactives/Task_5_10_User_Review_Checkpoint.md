---
agent: Manager (GitHub Copilot)
task_ref: Task 5.10 – User Review Checkpoint: Phase 5
status: Partial — QA Sprint active, Groups A–D closed, E and F remain open
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 5.10 – User Review Checkpoint: Phase 5

## Summary

Partial review completed in the Task 5.10 opening session. Six issues surfaced; three were immediately fixed and committed. Three remain open (Filtration Playground update behaviour, Poverty Threshold Simulator calibration, Mapper display sizing). Learning-path issues were flagged but not examined. Task 5.10 is being restructured as an iterative QA sprint for the next session — not a single-pass review.

## What Was Fixed in This Session

All fixes committed to `phase-5/advanced-interactives` at `439003e`.

| # | Issue | Fix |
|---|---|---|
| 1 | Code review: `path2-module-3.mdx` had wrong `interactive_slug: 'normal-distribution-explorer'` | Removed the field entirely — module body states no interactive is embedded |
| 2 | Code review: `ch-16.mdx` callout linked to UK Benefit Taper Calculator in a US Orshansky chapter | Callout removed — no US-relevant interactive exists yet |
| 3 | Code review: `ModuleLayout.astro` TDA Results Explorer silent empty slot + `as any` cast | Guard removed (component defaults to `circle-20pts`); recast as `PresetId` |
| 4 | Benefit Taper text description: "Taper rate: 55.00000000000001%" | `Math.round()` applied |
| 5 | Persistence Diagram Builder: H0 (teal) and H1 (slate-blue) indistinguishable | H1 → ochre `#c8873e`; immortal → thick amber stroke instead of dash |
| 6 | TDA Results Explorer: legend bubble colours were swapped (ochre↔teal) | Legend fixed to match CSS classes (H0=teal, H1=orange-red) |

## Open Issues from This Session

### Confirmed bugs / calibration problems

1. **Poverty Threshold Simulator — rate mismatch** ✅ RESOLVED (QA Sprint session 1)
   Three-stage fix applied:
   - Re-parameterised log-normal by median (£35,000) not mean; `POPULATION_MEDIAN` is now the anchor, `POPULATION_MEAN` is a derived export (~£41,900).
   - `calculateThreshold()` now equivalises the threshold (÷ OECD factor) before querying the CDF, so relative/DWP rates are invariant across household sizes (~20%/~19%).
   - `ChartInner` now computes a household-scaled density curve (mu = ln(POPULATION_MEDIAN × OECD factor)) so the shaded area visually matches the rate readout for any household composition.
   Files changed: `src/components/interactives/PovertySimulator.data.ts`, `src/components/interactives/PovertySimulator.tsx`.
   Build: ✓ clean. Tests: 41/41. Lint: 0 errors.

2. **Filtration Playground — "Topological Features" panel behaviour unclear to user** ✅ RESOLVED (QA Sprint session 1)
   B2 (panel not updating) and B3 (text description) confirmed non-issues after live testing — behaviour is correct.
   B1 (Betti counter initial state): no change made; β₀ = n on load is mathematically correct and user accepted this.
   Additional improvements made:
   - Radius sweep circles: `stroke-opacity` raised from 0.1 → 0.45, `stroke-width` 1 → 1.5 (`FiltrationPlayground.css`).
   - Simplex count subtitle added to Betti display box: "X vertices · Y edges · Z triangles", updates live with `aria-live="polite"` (`FiltrationPlayground.tsx` + `.css`).

3. **Mapper Parameter Lab — display sizing** ✅ RESOLVED (QA Sprint session 1)
   - `ResponsiveContainer minHeight`: 340 → 440px; `panelH` cap: 340 → 480px (`MapperParameterLab.tsx`).
   - Pan + zoom added to Mapper graph panel via `d3.zoom` (0.25×–4×, drag to pan, scroll to zoom). Reset view button bottom-right of panel. Cursor changes to grab/grabbing. View auto-resets on parameter/preset change (`MapperParameterLab.tsx`, `.css`).
   - Node tooltip rewritten from internal label (`node_2_0 · 8 pts · mean filter: 0.342`) to plain language (`8 points clustered here · mean PCA: 0.342`), using the active filter name. `filterFnName` prop added to `MapperGraphPanelProps`.

### Not yet reviewed

4. **Learning path issues** — User noted "issues in the learning paths that need deeper thought". Scope unknown — not examined this session.

5. **NormalDistExplorer** — Not reviewed in this session.

6. **FiltrationPlayground / PDB figure-eight β₁ teaching point** — The live preset only shows 1 H₁ loop (shared-vertex construction). Not a bug but worth adding a note in the module text (Path 4 Module 3). Not yet done.

7. **`learnPaths.ts` / Path 4 landing page** — `tda-practitioners` not registered; Path 4 does not appear on the `/learn/` hub. Deferred to Phase 6 by design but should be confirmed acceptable.

## Restructuring Decision

Task 5.10 is too large for a single-pass Manager review. It is being split into a dedicated **5.10 QA Sprint** structured as:
- One issue per exchange, with the user reviewing live output
- Issues grouped by component, not by severity
- Each group closes with a build + test confirmation

See `Handover_Task_5_10_QA_Sprint.md` for the full sprint structure.

## Next Steps

See `Handover_Task_5_10_QA_Sprint.md` — a dedicated handoff document for the next session.
