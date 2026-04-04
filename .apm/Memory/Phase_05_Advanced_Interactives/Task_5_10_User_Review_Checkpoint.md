---
agent: Manager (GitHub Copilot)
task_ref: Task 5.10 – User Review Checkpoint: Phase 5
status: Partial
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

1. **Poverty Threshold Simulator — rate mismatch**
   The three threshold values are correct UK 2024 data (MIS, 60%-median, DWP). However the log-normal population model has `POPULATION_MEAN=28,000` (producing an implied median of ~£23,300) while the relative and DWP thresholds are calibrated against `RELATIVE_MEDIAN=35,000`. The chart shows ~40–43% of the population below the relative poverty line, versus the actual UK rate of ~17%. The area-chart line position is right; the shaded percentage is wrong. Needs log-normal parameters recalibrated (`POPULATION_MEAN` → ~£33,000 or `POPULATION_MEDIAN` anchor) or explicit prose noting the curve is stylised and not empirical.
   **File:** `src/components/interactives/PovertySimulator.data.ts`

2. **Filtration Playground — "Topological Features" panel behaviour unclear to user**
   User reported: features island doesn't seem to update, text description doesn't update. From static code analysis: β₀ initialises at 0 (correct — no points loaded), β₀ rises to n on load (correct — n isolated components). The Betti animation counter runs via RAF and could lag visibly on slower machines. Text description is in a `useMemo` that updates correctly. The event log only fires on β changes, so at step 0 it correctly shows empty. Possible UX issue: "Connected components (β₀)" counter showing n=8 on load looks wrong to a user who expects "0 until connected". **Needs live testing** — can't fully diagnose from static analysis.
   **File:** `src/components/interactives/FiltrationPlayground.tsx`

3. **Mapper Parameter Lab — display sizing**
   User flagged as "display is problematic due to the size of the viewing island". Not yet diagnosed. Flagged for dedicated review. May be a CSS panel height / flexbox overflow issue, or the force simulation viewport not matching the panel dimensions.
   **File:** `src/components/interactives/MapperParameterLab.tsx` + `.css`

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
