# Task 5.10 QA Sprint — Handover

**Date:** 2026-04-04
**Branch:** `phase-5/advanced-interactives`
**Head commit:** `439003e`
**Previous session log:** `.apm/Memory/Phase_05_Advanced_Interactives/Task_5_10_User_Review_Checkpoint.md`

---

## Purpose

Task 5.10 (User Review Checkpoint: Phase 5) is being executed as an **iterative QA sprint** rather than a single-pass review. Each session should work through one QA group at a time, fix issues live, verify with build + test, and get explicit user sign-off before moving to the next group.

The next agent/session should:
1. Read this document first.
2. Present the **open issue backlog** to the user.
3. Let the user choose what to work on, or proceed sequentially.
4. Work through one group per session exchange.

---

## Build Health (as of handover)

```
Branch:  phase-5/advanced-interactives  (commit 439003e)
Pages:   69 (Pagefind indexed)
Tests:   231 passing (14 files)
E2E:     20 passed, 1 intentional skip (WebKit 3D animation on PDB)
Lint:    0 errors, 1 permitted warning (PovertySimulator.tsx:331)
```

---

## Already Resolved (do not re-review)

| # | What | Commit |
|---|---|---|
| R1 | `path2-module-3.mdx` wrong `interactive_slug` removed | `44d8ae9` |
| R2 | `ch-16.mdx` UK callout removed (US chapter) | `44d8ae9` |
| R3 | `ModuleLayout.astro` TDA Results Explorer silent slot + `as any` cast | `44d8ae9` |
| R4 | Benefit Taper text "55.00000000000001%" → `Math.round()` | `439003e` |
| R5 | Persistence Diagram Builder H0/H1 indistinguishable colours | `439003e` |
| R6 | TDA Results Explorer legend key was swapped | `439003e` |

---

## Open QA Backlog

### Group A — Poverty Threshold Simulator
**Priority: High (confirmed calibration bug)**

**A1 — Population model inconsistency**
The log-normal income distribution uses `POPULATION_MEAN = 28,000` (implied median ~£23,300). The relative/DWP thresholds are set against `RELATIVE_MEDIAN = 35,000`. This produces a relative poverty rate of ~40–43% against the actual UK rate of ~17%. The line position is correct; the area shading and poverty-rate readout are misleading.

Options:
- (a) Recalibrate `POPULATION_MEAN` upward to ~£33,000 so the log-normal median aligns with the threshold medians. Check all three method poverty rates look plausible after.
- (b) Keep the stylised model but add explicit UI copy: "The income curve is a schematic illustration. Poverty rates shown are approximate." This is less good — the chart actively misleads.

**File:** `src/components/interactives/PovertySimulator.data.ts` — `POPULATION_MEAN`, `POPULATION_SIGMA`, `POPULATION_MU`

**A2 — What does the interactive actually show?**
User was uncertain. The interactive shows: a log-normal income distribution area chart (y = density, x = annual household income £0–£80,000) with a vertical draggable poverty line. The line position is calculated from one of three methods (MIS absolute, 60%-median relative, DWP official) for the selected household composition. The shaded area to the left shows the fraction of the simulated population below the line. This is a legitimate pedagogical tool if A1 is fixed and the UI labels are clear. Consider whether the chart needs a stronger annotation: "X% of households fall below this threshold" next to the shaded region.

**File:** `src/components/interactives/PovertySimulator.tsx` — annotation band

---

### Group B — Filtration Playground
**Priority: Medium (may be UX expectation rather than code bug)**

**B1 — Betti counter initial state**
β₀ = 0 before any points are loaded is correct. β₀ = n immediately after loading n points is also mathematically correct (n isolated components). However users unfamiliar with TDA may read n connected components at step 0 as a bug. Consider:
- Adding a subtitle under the Betti counter: "Step 0: each point is its own component. Add edges (advance radius) to merge them."
- Or: show β₀ = 0 until at least one edge has been added (arguably wrong mathematically, but more intuitive).

**File:** `src/components/interactives/FiltrationPlayground.tsx` — Betti display section + label text

**B2 — "Topological Features" panel not clearly updating**
Needs live reproduction. Suspected cause: the animated Betti counter (step-by-step RAF counter) runs independently of the actual `bettiNumbers` value. If the user loads a small point set and advances slowly, the animation counter catches up before the user notices. The `eventLog` correctly shows nothing at step 0 and only fires on β changes. Verify:
1. Load the default preset (circles, or any preset with ≥3 points).
2. Advance step-by-step.
3. Confirm event log gains entries as β₀ decreases and β₁ rises.
If no entries appear at all, there is likely a stale-closure bug in the event detection `useEffect`.

**File:** `src/components/interactives/FiltrationPlayground.tsx` — event detection `useEffect` (~line 380)

**B3 — Text description not updating**
`textDescription` is a `useMemo` that depends on `[points.length, currentStepIdx, currentRadius, maxRadius, currentComplex, bettiNumbers]`. It updates on every step. However `TextDescriptionToggle` receives the updated string — the `<details>` element only re-renders its content when open. To see the update, the user must open the summary, then step. This is expected behaviour of native `<details>`. Not a bug, but worth noting: the description is a snapshot, not live-updating while the panel is open. If this is a problem, `TextDescriptionToggle` could use an `open` + `aria-live` pattern to announce updates live.

---

### Group C — Mapper Parameter Lab
**Priority: Medium (display sizing)**

**C1 — Viewing island too small**
User confirmed this is a display problem, not a functional one, and requested deeper review before fixing. Need to:
1. Open `src/components/interactives/MapperParameterLab.tsx` and `MapperParameterLab.css` and examine panel dimensions (fixed heights? min-height? flex config?).
2. Check `src/pages/learn/interactives/[slug].astro` to see if the `MapperParameterLab` container is width-constrained.
3. Check how it looks at common breakpoints: 1280px, 1024px, 768px (tablet), 375px (mobile).

The force graph SVG should be responsive. If it has a fixed `width`/`height` set inline, switching to `ResponsiveContainer` pattern (used in `NormalDistExplorer`) is the right fix.

**File:** `src/components/interactives/MapperParameterLab.tsx` and `.css`

---

### Group D — Learning Path Content Issues
**Priority: Medium (scope unknown)**

User flagged "issues in the learning paths that need deeper thought" but did not specify. This group needs the user to walk through the path content and identify specific items before any agent work can begin.

Suggested starting points for user review:
- `/learn/topology-social-scientists/` → click each module: check prose quality, check interactive renders correctly inline.
- `/learn/mathematics-of-poverty/` → same.
- `/learn/tda-practitioners/1` through `/learn/tda-practitioners/12` — Are the module structures reasonable? Is the LaTeX rendering? Are the Python code blocks formatted correctly?
- `/learn/` hub — Does the path listing, progress bar, and module navigation work?

Known deferred items that are **not bugs**:
- `learnPaths.ts` does not register `tda-practitioners` — Path 4 is not listed on the `/learn/` hub. Deferred to Phase 6 intentionally.
- `{/* Pyodide code runner slot */}` comments in Path 4 modules are intentional placeholders.

---

### Group E — NormalDistExplorer
**Priority: Low (not yet reviewed)**

Not reviewed in the opening session. Add to QA backlog for completeness.

Suggested checks:
- μ and σ sliders update the curve correctly.
- The poverty threshold comparison overlay (if present) renders correctly.
- TextDescriptionToggle present and functional.
- No console errors on load.

---

### Group F — Figure-Eight Teaching Point (Path 4 Module 3)
**Priority: Low (documentation gap, not a code bug)**

The live `FiltrationPlayground` and `PersistenceDiagramBuilder` figure-eight preset uses two small circles (rr≈0.18, shared vertex) which correctly shows only 1 H₁ loop at typical interactive radii — not 2. This is mathematically correct behaviour for that geometry. The pre-computed `figure-eight-11pts.json` (used in TDA Results Explorer) correctly shows 2 H₁ loops because it uses separate lobes (radii 0.5, gap at origin). A teaching note should be added to [path4-module-3.mdx](src/content/learn/path4-module-3.mdx) explaining this distinction. The note should appear near the filtration-playground interactive context paragraph.

---

## Session Protocol for the QA Sprint

For each group:
1. **Show** the user the issue description from this document.
2. **Reproduce** (locally serve `dist/` or read code) to confirm before fixing.
3. **Fix** — one issue at a time; run `npm run build && npm run lint` after each fix.
4. **Get user confirmation** before closing the group.
5. **Mark the item resolved** in this document (or in the session memory log).

Do NOT batch multiple groups into a single exchange. The value of this sprint is that the user can see each fix in context.

---

## Phase 6 Interactive Backlog

Interactives identified during QA that are deferred to Phase 6. Each entry includes the module it should be linked to and what the prose currently says.

### PH6-I1 — Point Cloud & Distance Explorer
**Module:** `path1-module-2.mdx` (Topology for Social Scientists, Module 2 — "Point Clouds and Distance")
**Status:** `interactive_slug` removed; "Using the Interactive" section cut in QA sprint.
**Description:** A 2D scatter of points. Click a point to see its ε-ball expand. Toggle between Euclidean and Manhattan distance to see the ball shape change (circle vs diamond). Optionally show pairwise distance matrix updating live.
**Pedagogical goal:** Make concrete the ε-ball definition and the effect of metric choice on neighbourhood structure.
**When added:** Update `path1-module-2.mdx` frontmatter with `interactive_slug: 'point-cloud-explorer'` and write a "Using the Interactive" section.

### PH6-I2 — Simplex/Homology Editor
**Module:** `path1-module-4.mdx` (Topology for Social Scientists, Module 4 — "Homology: Counting Holes")
**Status:** "A Notional Interactive" section replaced with "A Note on the Interactive" placeholder in QA sprint.
**Description:** A small fixed simplicial complex rendered as an SVG. Click simplices (edges, triangles) to add or remove them. Betti numbers (β₀, β₁) update in real time. Should show clearly how removing a triangle can expose a loop (β₁+1) and how removing an edge can disconnect a component (β₀+1) or expose a loop.
**Pedagogical goal:** Build intuition that homology measures global structure, not local geometry.
**When added:** Update `path1-module-4.mdx` frontmatter with `interactive_slug: 'homology-editor'`, replace placeholder section with full "Using the Interactive" guidance, register component in `ModuleLayout.astro`.

### PH6-W1 — Mapper Social Scientists Module
**Module:** `path1-module-7.mdx` (Topology for Social Scientists, Module 7 — "Mapper: A Bird's-Eye View of High-Dimensional Data")
**Status:** Stub created in QA sprint. Interactive (`mapper-parameter-lab`) already wired in frontmatter.
**Description:** Write the full module text introducing the Mapper algorithm to non-mathematical readers. Cover: the core idea (cover → cluster → nerve graph), what the filter function means intuitively, how to read a Mapper graph (nodes = clusters, edges = overlap, size = population count), and one concrete social-science example. Must not use algebra or require persistent homology as prior knowledge.
**When added:** Replace stub prose with full content. The "Using the Interactive: Mapper Parameter Lab" section should follow the main text.

### PH6-W2 — TDA Case Studies Module (Path 1 capstone)
**Module:** `path1-module-8.mdx` (Topology for Social Scientists, Module 8 — "TDA Meets Social Science: Case Studies")
**Status:** Stub created in QA sprint. No interactive (case study format).
**Description:** Three case studies: (1) voting-pattern geometry, (2) health-inequality clustering, (3) poverty-trajectory topology (linking back to the research portfolio). Each case should explain what conventional analysis missed and what TDA found, without requiring technical background. Should serve as the path capstone.

### PH6-I5 — SHAP Instability Demonstrator
**Module:** `path2-module-7.mdx` (Mathematics of Poverty, Module 7 — "The Black Box")
**Status:** "A Notional Tool for Explanation Instability" replaced with placeholder in QA sprint. No `interactive_slug` was assigned.
**Description:** A small neural network trained on synthetic welfare data. User selects a near-threshold individual and perturbs their features slightly (sliders); SHAP values update to show how the explanation changes while the model score stays approximately constant. Core point: explanations are properties of the local approximation, not the model internals.
**When added:** Add `interactive_slug: 'shap-instability-demo'` to frontmatter, write "Using the Interactive" section, register component in `ModuleLayout.astro`.

### PH6-I6 — Participatory vs Official Data Barcode Comparator
**Module:** `path2-module-8.mdx` (Mathematics of Poverty, Module 8 — "Counter-Mathematics")
**Status:** "A Notional Tool for Community Mapping" replaced with placeholder in QA sprint. No `interactive_slug` was assigned.
**Description:** Two persistence diagrams side by side: one built from a synthetic participatory dataset (community-defined dimensions: safety, green space, neighbourhood trust), one from official deprivation indices for the same synthetic population. User can toggle which dimensions are active in each dataset. The Wasserstein distance between the two diagrams updates live. Core point: the divergence between the barcodes is the formal signature of the difference between being measured and being heard. May be implementable by wiring `PersistenceDiagramBuilder` with two preset datasets rather than building from scratch.
**When added:** Add `interactive_slug: 'participatory-barcode-comparator'` to frontmatter, write "Using the Interactive" section, register component in `ModuleLayout.astro`.

### PH6-I4 — Logistic Regression / Decision Threshold Explorer
**Module:** `path2-module-6.mdx` (Mathematics of Poverty, Module 6 — "The Score")
**Status:** `interactive_slug: 'tda-results-explorer'` removed (was incorrectly assigned). "A Notional Tool for Score Anatomy" replaced with "A Note on the Interactive" placeholder in QA sprint.
**Description:** A simplified logistic regression model trained on synthetic welfare data. Sliders: decision threshold τ (0–1), optionally feature weights. Outputs: confusion matrix, false-positive rate, false-negative rate, broken down by at least two demographic sub-groups. Key insight: a globally accurate model can be systematically unfair to a minority group, and τ is a distributive policy choice not a statistical one.
**When added:** Update `path2-module-6.mdx` frontmatter with `interactive_slug: 'scoring-threshold-explorer'`, write "Using the Interactive" section, register component in `ModuleLayout.astro`.

### PH6-I3 — Equivalisation Scale Comparator
**Module:** `path2-module-4.mdx` (Mathematics of Poverty, Module 4 — "The Welfare Formula")
**Status:** "A Notional Tool for Scale Comparison" replaced with "A Note on the Interactive" placeholder in QA sprint. `interactive_slug` removed (was incorrectly set to `benefit-taper-calculator`).
**Description:** Apply the three major equivalisation scales (original OECD, Modified OECD, McClements) to the same household income distribution and display the resulting poverty rates side by side. Allow household composition sliders (adults, children) to show how divergence grows with family size.
**Pedagogical goal:** Make explicit that poverty statistics are functions of the scale selected, not measurements of a fixed quantity.
**When added:** Update `path2-module-4.mdx` frontmatter with `interactive_slug: 'equivalisation-comparator'`, replace placeholder section with full "Using the Interactive" guidance, register component in `ModuleLayout.astro`.

### PH6-E1 — Benefit Taper Calculator: adjustable rate + fiscal cost
**Component:** `src/components/interactives/BenefitTaperCalculator.tsx`
**Status:** Enhancement — existing component works correctly but is missing two features needed to fully support the Module 5 argument.
**Current state:** Taper rate is fixed (55% current, 63% pre-2021 comparison only). No fiscal cost readout. Housing element toggle works. Hover shows EMTR at each earnings point.
**Missing features:**
1. **Adjustable taper rate slider** — free range, e.g. 40%–75%, replacing the fixed 55%/63% toggle. The curve should update live. This makes the "optimal rate is a political choice" argument interactive rather than illustrative.
2. **Fiscal cost readout** — approximate aggregate cost of UC at the selected taper rate, relative to the 55% baseline. Even a stylised model (linear approximation over a representative earnings distribution) would suffice. Shows that a lower taper is more generous but more expensive, making the trade-off concrete.
**When added:** Update `path2-module-5.mdx` "Using the Interactive" section to reference both features. The existing guidance text already notes these are planned and will need updating.

### Note: Benefit Taper Calculator fix (QA sprint)
`interactive_slug: 'benefit-taper-calculator'` was incorrectly assigned to `path2-module-4.mdx` (The Welfare Formula).
Moved to `path2-module-5.mdx` (Optimisation and Control), where the taper mechanics are the subject of the module.
"A Notional Tool for Taper Analysis" in module 5 was replaced with a full "Using the Interactive" guidance section.
Modules 10–12 of `tda-practitioners` were renumbered to 12–14.
Former `path1-module-7.mdx` (Markov Memory Ladder) is now `path4-module-10.mdx`.
Former `path1-module-8.mdx` (Reading the Results) is now `path4-module-11.mdx`.
Path 4 now runs modules 1–14. `learnPaths.ts` does not yet register Path 4 (deferred to Phase 6).

---

## Files to Read Before Starting Any QA Work

- This document
- `.apm/Memory/Phase_05_Advanced_Interactives/Task_5_10_User_Review_Checkpoint.md`
- `src/components/interactives/` — specific files per group above
- `src/content/learn/` — for Group D learning path issues
