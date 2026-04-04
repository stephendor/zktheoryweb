---
agent_type: Manager
agent_id: Manager_2
handover_number: 2
current_phase: "Phase 6: Polish & Launch"
active_agents: []
---

# Manager Agent Handover File — zktheory.org Research Portfolio Website

## Active Memory Context

**User Directives:**
- One issue per exchange — do not batch multiple tasks or QA items into a single response. User confirms after each step before you proceed.
- Verify against actual code before fixing anything reported as a bug. Many "findings" turn out to be correct behaviour.
- Present options as lettered choices with a clear recommendation when multiple approaches exist. User picks one and says "proceed".
- `npm run build` is the canonical verification step after any MDX, layout, or component change. `npm run lint` after any `.tsx`/`.ts` changes.
- Phase 6 tasks span a wide range — content prose, interactives, infrastructure, and design. Assign agents by domain; do not over-batch.
- The QA sprint revealed a systemic MDX authoring issue: `interactive_slug` in frontmatter and "notional interactive" sections in prose were out of sync across multiple modules. All known instances were fixed in Phase 5. New content agents must cross-check both frontmatter slug and prose body before delivering MDX.
- `status: 'stub'` is not a valid Zod enum value for learn-modules. Use `'drafting'` for placeholder modules.
- Never create markdown documentation files unless explicitly requested by the user.

**Decisions made during Phase 5 / Task 5.10:**
1. **Pyodide INFEASIBLE** — No WASM wheels for ripser/gudhi/giotto-tda. Cold load 10–18s violates 5s UX target. Strategy C approved: pre-computed JSON only (TDA Results Explorer). Pyodide viable for future non-TDA numeric work. This decision is final — do not revisit in Phase 6.
2. **Path 4 runs 1–14 modules** — Two new modules were added during QA sprint (path4-module-13.mdx, path4-module-14.mdx). `learnPaths.ts` does not yet register `tda-practitioners` (deferred to Task 6.1a).
3. **Interactive slot placement** — In `ModuleLayout.astro`, the interactive slot renders AFTER `<Content />`. The order is: prose → interactive → check-understanding. Fixed in QA sprint; do not revert.
4. **Code block full-width breakout** — `pre` elements break out to `grid-column: main / sidenote-end` on desktop (fixed in `prose.css` during QA sprint). All code-heavy pages benefit.
5. **PersistenceDiagramBuilder colours** — H0=teal (`#2a7d8f`), H1=ochre (`#c8873e`), immortal=thick amber stroke. These are now the canonical colours; use them for any future persistence diagram work.
6. **Figure-eight H₁ teaching note** — Added to `path4-module-3.mdx`. The FiltrationPlayground shared-vertex figure-eight shows 1 H₁ loop (correct); the TDA Results Explorer `figure-eight-11pts.json` shows 2 (also correct, different geometry). This is not a bug.
7. **PovertySimulator calibration** — recalibrated to median anchor £35k; relative/DWP poverty rates now ~17–20% for single adult. This is correct; do not revert.
8. **MapperParameterLab** — pan+zoom added (D3 zoom, 0.25×–4×), tooltip rewritten to plain language, panel height 440/480px. Functioning correctly.
9. **Phase 6 backlog fully specified** — all 6 new interactives (PH6-I1 through I6), 1 enhancement (PH6-E1), and 2 prose modules (PH6-W1/W2) are detailed in `.apm/Handover_Task_5_10_QA_Sprint.md` and integrated into the Implementation Plan as Tasks 6.1a and 6.1b.

**Known intentional warnings / non-issues — do not fix:**
- `react-hooks/exhaustive-deps` warning at `PovertySimulator.tsx:340` — intentional, permitted.
- WebKit E2E test skip for PDB 3D animation — intentional.
- Path 4 not on `/learn/` hub — intentional until Task 6.1a.

## Coordination Status

**Producer-Consumer Dependencies:**

- Phase 5 branch `phase-5/advanced-interactives` → must be merged to `main` via PR before Phase 6 branch is cut
- Task 6.1 (Path 3 stubs) → must complete before Task 6.1a (Path 3 hub registration)  
- Task 6.1a (hub + chapter route) → can run in parallel with 6.1b (interactives), 6.2 (content)
- Task 6.1b (PH6-I1–I6 interactives) → individual components are independent; can be parallelised
- Task 6.3 (cross-project links) → depends on substantial content being in place (after 6.1, 6.2)
- Task 6.4 (dark mode toggle) → depends on 6.3 (nav must be stable)
- Task 6.5 (a11y audit) → depends on 6.4 (dark mode must exist to test)
- Task 6.6 (performance) → depends on all content and interactives in place
- Task 6.7 (SEO/OG) → depends on 6.6 (final URLs and pages must be stable)
- Task 6.8 (Netlify) → depends on 6.6, 6.7
- Task 6.9 (final polish) → depends on 6.4, 6.5
- Task 6.10 (launch review) → depends on all

**Recommended parallel batches for Phase 6:**
- **Batch 1:** 6.1 (Path 3 stubs), 6.1b (PH6-I1–I6 interactives), 6.2 prose/content (can start without Path 3)
- **Batch 2:** 6.1a (hub registration — needs 6.1 done), 6.3 (cross-project links — needs content stable)
- **Batch 3:** 6.4 dark mode, then 6.5 a11y (needs 6.4), 6.6 performance
- **Batch 4:** 6.7 SEO, 6.8 Netlify, 6.9 polish → 6.10 launch review

## Build Health at Handover

```
Branch:  phase-5/advanced-interactives  (commit b2c2bf2)
Status:  Clean working tree
Pages:   71 (Pagefind indexed)
Tests:   231 passing (14 files)
E2E:     20 passed, 1 intentional skip (WebKit PDB 3D)
Lint:    0 errors, 1 permitted warning (PovertySimulator.tsx:340)
```

**Before Phase 6 starts:** PR `phase-5/advanced-interactives` → `main` must be merged. Ask User to confirm this has been done before assigning any Phase 6 tasks.

## Next Actions

**Immediate (before any Phase 6 work):**
1. Confirm `phase-5/advanced-interactives` has been merged to `main` — if not, ask User to create and merge the PR first
2. Cut `phase-6/polish-launch` branch from merged `main`

**First Phase 6 assignments (Batch 1, parallel-safe):**
- Task 6.1 → `Agent_Content` — Path 3 Data Justice Foundation stubs (6 modules). Full guidance in `Implementation_Plan.md §Task 6.1`.
- Task 6.1b → `Agent_Interactive_Advanced` — PH6-I1 through PH6-I6 interactives + PH6-E1 Benefit Taper enhancement. Full specs in `.apm/Handover_Task_5_10_QA_Sprint.md §Phase 6 Interactive Backlog`.
- Task 6.2 (partial) → `Agent_Content` — PH6-W1 (Mapper module prose) and PH6-W2 (TDA Case Studies capstone). Can run alongside 6.1.

## Working Notes

**Critical file locations:**
- `src/content/learn/` — all module MDX files (path1-module-1 through path4-module-14)
- `src/data/learnPaths.ts` — path hub registration (Paths 1 and 2 registered; Paths 3 and 4 to be added in Task 6.1a)
- `src/components/interactives/` — all interactive components
- `src/layouts/ModuleLayout.astro` — interactive slot pattern; imports need updating for each new interactive
- `src/pages/learn/interactives/[slug].astro` — dynamic route; slug conditionals needed per new interactive
- `.apm/Handover_Task_5_10_QA_Sprint.md` — Phase 6 Interactive Backlog (PH6-I1 through I6, PH6-E1, PH6-W1, PH6-W2) with full specs

**MDX authoring rules (hard-won from Phase 5):**
- En-dashes in YAML `title:` fields corrupt newlines — use ASCII hyphens
- `{,}` in MDX prose is a JSX expression — use plain commas outside `$...$`
- Unescaped apostrophes in single-quoted YAML crash build — reword or use `''`
- `status: 'stub'` is invalid; use `'drafting'`
- Always cross-check `interactive_slug` in frontmatter against prose body — they must agree

**Interactive infrastructure rules:**
- Colour scale: `getVizColorScale()` + `d3.scaleQuantize` (6-slot Okabe-Ito, built inside `useEffect`) — canonical pattern
- All new interactives: `client:visible`, `TextDescriptionToggle`, `AriaLiveRegion`, `useReducedMotion`
- Storybook stories must use `React.createElement`, not JSX (Storybook config limitation)
- Vitest unit tests required for all algorithmic/data logic; `afterEach(cleanup)` mandatory in React test files
- `NormalDistExplorer.tsx` remains the canonical reference implementation — read before building any new interactive

**User communication style:**
- Short, direct answers preferred — no lengthy preamble
- Test and build results should be summarised (pass/fail + key number), not pasted in full
- User reviews in the browser at `localhost:4321` — describe what they will see, not just what the code does
- Confirm completion of each discrete step; do not assume approval and move on
