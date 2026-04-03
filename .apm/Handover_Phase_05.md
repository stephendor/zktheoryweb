# Phase 5 Manager Handover

**Date:** 2026-04-03
**Outgoing manager:** GitHub Copilot (Claude Sonnet 4.6)
**Incoming phase:** Phase 5 — Advanced Interactives & Paths
**Repository:** stephendor/zktheoryweb
**Open PR:** [#2 feat: Phase 4 — Learning Paths](https://github.com/stephendor/zktheoryweb/pull/2) — Copilot review requested, awaiting merge to `main`

---

## 1. Current State

### Build health (as of handover)
```
Branch:     phase-4/learning-paths (PR #2, not yet merged)
Tests:      140 passing (10 test files)
Lint:       exit 0 — 0 errors, 1 intentional warning (see §4.2)
Build:      Complete — 37 pages indexed by Pagefind
```

### Working tree
All Phase 4 work is committed to `phase-4/learning-paths`. The `main` branch is at `cfa7f67` (Phase 3 merge). **Do not start Phase 5 tasks until PR #2 is merged.**

---

## 2. Task 3.8 Escalation Decisions (Carried from Phase 4)

These were approved at the Phase 3/4 boundary checkpoint. Task 5.1 must respect them:

| Interactive | Decision | Phase 5 action |
|---|---|---|
| Normal Distribution Explorer | Keep SVG | No change |
| Poverty Threshold Simulator | Keep SVG | No change |
| Research Pipeline Graph | Keep SVG (D3 force-directed) | No change |
| Five Transitions Timeline | Keep SVG | No change |
| **Persistence Diagram Builder** | **Escalate → 3D WebGL** | **Task 5.1: upgrade to Three.js/R3F** |

---

## 3. Phase 5 Task List

In dependency order per `Implementation_Plan.md §Phase 5`:

| Task | Agent | Depends on | Parallel-safe? |
|---|---|---|---|
| **5.1** Escalated Interactive Upgrades (WebGL) | Agent_Interactive_Advanced | PR #2 merged | Yes (with 5.2–5.4) |
| **5.2** Mapper Parameter Lab | Agent_Interactive_Advanced | PR #2 merged | Yes (with 5.1, 5.3, 5.4) |
| **5.3** Filtration Playground | Agent_Interactive_Advanced | PR #2 merged | Yes (with 5.1, 5.2, 5.4) |
| **5.4** Benefit Taper Calculator | Agent_Interactive_Advanced | PR #2 merged | Yes (with 5.1, 5.2, 5.3) |
| **5.5a** Pyodide Feasibility Research | Agent_Interactive_Advanced | PR #2 merged | Yes (with 5.1–5.4) |
| **5.5b** Pyodide Loader & Code Runner | Agent_Interactive_Advanced | 5.5a | No |
| **5.6** Path 4 MDX Stubs: TDA for Practitioners | Agent_Content | PR #2 merged | Yes (with 5.1–5.5a) |
| **5.7** Embed Advanced Interactives | Agent_Interactive_Advanced | 5.1–5.4, 5.5b, 5.6 | No |
| **5.8** Playwright Integration Testing | Agent_Infra | PR #2 merged | Yes (with 5.1–5.6) |
| **5.9** User Review Checkpoint | User | All Phase 5 tasks | — |

**Recommended parallel batches:**
- **Batch 1 (simultaneous):** 5.1, 5.2, 5.3, 5.4, 5.5a, 5.6, 5.8
- **Batch 2 (after 5.5a approved):** 5.5b
- **Batch 3 (after all above):** 5.7, then 5.9

---

## 4. Critical Context for Phase 5 Agents

### 4.1 Interactive infrastructure (all Agent_Interactive_Advanced tasks)

Read before starting any interactive task:

- `src/lib/viz/` — shared viz utilities: `scales.ts`, `tooltip.ts` (use `showTooltip` for plain text, `showTooltipHtml` for trusted HTML only), `responsiveContainer.ts`
- `src/lib/viz/a11y/` — `TextDescriptionToggle.tsx`, `keyboardNav.ts`, `paletteEnforcement.ts`
- `src/components/interactives/NormalDistExplorer.tsx` — canonical example of the D3 + React split-effect pattern; study before any new interactive
- `src/content/interactives/` — each interactive needs an MDX manifest here; `src/content.config.ts` `interactives` collection schema: `title`, `slug`, `description`, `complexity`, `related_paths`, `related_chapters`, `status`
- `src/pages/learn/interactives/[slug].astro` — dynamic route; add new slug conditionals here for each new interactive (do not use a component map)
- `src/layouts/ModuleLayout.astro` — interactive slot uses explicit slug conditionals; add imports and conditionals for each new interactive

**Storybook:** every interactive must have a story in `src/components/interactives/*.stories.tsx`. Stories must use `React.createElement`, not JSX (Storybook config limitation).

**Tests:** Vitest unit tests required for all algorithm/data logic. `afterEach(cleanup)` is mandatory in all test files that render React components.

**Performance target:** <3s TTI on broadband (PRD §4.4). Use `client:visible` for all interactives.

### 4.2 Known intentional lint warning — do not fix

```
src/components/interactives/PovertySimulator.tsx:331
  react-hooks/exhaustive-deps warning
```
This is intentional — the dependency array is deliberately constrained. Do not add the missing deps.

### 4.3 Module route gap

Learning module pages (`/learn/{pathSlug}/{moduleNumber}`) currently return 404. The dynamic route has **not** been built yet — it is not in the Phase 4 or Phase 5 Implementation Plan as a named task, but the module MDX files and `ModuleLayout.astro` are ready. The incoming Phase 5 manager should either:
- Add a `src/pages/learn/[path]/[module].astro` dynamic route task to the Phase 5 plan, OR
- Confirm it is intentionally deferred to Phase 6

The `MarkCompleteButton`, `PathModuleList` CTA links, and progress tracking all depend on these routes existing.

### 4.4 Pyodide notes for Task 5.5

- Task 5.5a is an ad-hoc research task — the agent should use `.github/prompts/apm-7-delegate-research.prompt.md` to delegate a feasibility investigation
- The implementation decision from 5.5a **must be reviewed by the user** before 5.5b begins, as it gates the entire Pyodide implementation strategy
- Memory log for 5.5a should include the specific micropip package names that were confirmed available

### 4.5 Benefit Taper Calculator (Task 5.4) policy parameters

Use current UK policy parameters (2025–26):
- Standard taper rate: 55% (reduced from 63% in 2021)
- Work allowance (higher, no housing): £673/month
- Work allowance (lower, with housing): £404/month
- Universal Credit standard allowance (single, 25+): £393.45/month

### 4.6 Path 4 content (Task 5.6)

- Files go in `src/content/learn/` (flat, no subdirectory) following the same pattern as `path1-module-{N}.mdx` and `path2-module-{N}.mdx`
- Name them `path4-module-{N}.mdx`
- `path` field must be `'tda-practitioners'` (confirmed enum value in `content.config.ts`)
- Include `{/* Pyodide code runner slot */}` comments as placeholders — actual embedding happens in Task 5.7

---

## 5. Key Files Added/Modified in Phase 4

### New files
```
src/data/learnPaths.ts          — Path/module data constants (types: LearnPath, LearnModule)
src/data/glossary.ts            — 27 glossary entries (types: GlossaryEntry, GlossaryDefinition)
src/data/readingLists.ts        — 5 curated reading lists, 43 entries (Zotero-integrated)
src/lib/progress.ts             — localStorage utilities (loadProgress, saveProgress, etc.)
src/lib/useProgress.tsx         — React context + useProgress hook (ProgressProvider)
src/lib/progress.test.ts        — 16 Vitest tests for progress utilities
src/components/learn/PathProgressBar.tsx + .css
src/components/learn/PathModuleList.tsx + .css
src/components/learn/MarkCompleteButton.tsx + .css
src/components/shared/GlossaryTooltip.tsx + .css
src/pages/learn/index.astro     — replaced stub
src/pages/learn/[path].astro    — new file (2 static paths)
src/pages/learn/interactives/index.astro — new file
src/pages/learn/glossary/index.astro
src/pages/learn/reading-lists/index.astro
src/pages/learn/reading-lists/[slug].astro
src/content/learn/path1-module-{1-8}.mdx  — 8 modules: Topology for Social Scientists
src/content/learn/path2-module-{1-8}.mdx  — 8 modules: Mathematics of Poverty
```

### Modified files
```
src/layouts/ModuleLayout.astro  — inline interactive embeds (explicit slug conditionals)
src/components/shared/SiteSearch.astro — fixed pagefind-ui.js loading (IIFE → script tag)
src/pages/dev/*.astro (5 files) — prod-guard moved to after imports
```

---

## 6. localStorage Schema Reference

Progress tracking uses:
```
Key:   zktheory:progress:{pathSlug}
Value: { version: 1, completedModules: string[], lastVisited: string | null, updatedAt: string }
```
Module identifiers are `String(module_number)` — e.g., `"1"`, `"2"`. Schema version mismatch triggers reinitialisation (no migration). All localStorage access is guarded against `typeof window === 'undefined'` for SSR safety.

---

## 7. APM Memory Files

All Phase memory logs are in `.apm/Memory/`. The Memory Root is at `.apm/Memory/Memory_Root.md` — read this first for cross-phase context.

Phase 5 memory directory to create: `.apm/Memory/Phase_05_Advanced_Interactives/`

Task logs to create (empty files) before issuing each Task Assignment Prompt:
```
Task_5_1_Escalated_Interactive_Upgrades_WebGL.md
Task_5_2_Mapper_Parameter_Lab.md
Task_5_3_Filtration_Playground.md
Task_5_4_Benefit_Taper_Calculator.md
Task_5_5a_Pyodide_Feasibility_Research.md
Task_5_5b_Pyodide_Loader_Code_Runner.md
Task_5_6_Path4_MDX_Stubs_TDA_Practitioners.md
Task_5_7_Embed_Advanced_Interactives.md
Task_5_8_Playwright_Integration_Testing.md
```

---

## 8. Recommended First Actions

1. **Wait for PR #2 merge** (Copilot review in progress — see [PR #2](https://github.com/stephendor/zktheoryweb/pull/2))
2. After merge: `git checkout main && git pull origin main`
3. Create branch `phase-5/advanced-interactives` from `main`
4. Create `.apm/Memory/Phase_05_Advanced_Interactives/` and empty log files
5. Issue Batch 1 Task Assignment Prompts in parallel: **5.1, 5.2, 5.3, 5.4, 5.5a, 5.6, 5.8**
6. After 5.5a report returned: **user review of Pyodide feasibility decision before issuing 5.5b**
7. After all Batch 1 tasks complete: issue **5.7** (embedding)
8. After 5.7: **Task 5.9 user review checkpoint**
