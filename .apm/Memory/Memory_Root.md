# zktheory.org Research Portfolio Website – APM Memory Root

**Memory Strategy:** Dynamic-MD
**Project Overview:** Full build of zktheory.org — a research portfolio combining the _Counting Lives_ book (18 chapters on poverty measurement history) and a TDA Research Programme (10 papers). Stack: Astro 6, Tailwind CSS 4, React 19, TypeScript, deployed on Netlify. Features dual-palette design system, 10+ D3/Three.js interactives, 4 learning paths (34 modules), Zotero bibliography integration, and Pagefind search. Six-phase build from Foundation through Polish & Launch, with User Review Checkpoints at each phase end.

---

## Phase 1 – Foundation Summary

* **Outcome:** All 7 implementation tasks completed and approved by User. Full Astro 6.1.3 project foundation built and verified locally via `npm run dev`. Build, type-check, and lint all pass cleanly.
* **Key findings carried forward:** (1) Astro 6 installed instead of v5 — accepted, all plan references updated. (2) `.container-prose--wide` needed for sidenote pages — fix specified in Task 2.2a. (3) `--color-viz-4` (yellow) needs dark-mode override — fix specified in Task 3.1.
* **Agents involved:** Agent_Infra (Tasks 1.1, 1.2), Agent_Design_System (Tasks 1.3, 1.4, 1.6), Agent_Design_Templates (Task 1.5), Agent_Schema_Platform (Task 1.7)

**Phase 1 Memory Logs:**
- `.apm/Memory/Phase_01_Foundation/Task_1_1_Astro_Project_Scaffold_Build_Configuration.md`
- `.apm/Memory/Phase_01_Foundation/Task_1_2_Code_Standards_Setup.md`
- `.apm/Memory/Phase_01_Foundation/Task_1_3_Design_Token_System_Colour_Palettes.md`
- `.apm/Memory/Phase_01_Foundation/Task_1_4_Typography_Exploration_Integration.md`
- `.apm/Memory/Phase_01_Foundation/Task_1_5_Base_Layout_Navigation_Components.md`
- `.apm/Memory/Phase_01_Foundation/Task_1_6_Prose_Styles_Sidenote_System_Print_Foundations.md`
- `.apm/Memory/Phase_01_Foundation/Task_1_7_MDX_Pipeline_Configuration.md`

---

## Phase 2 – Content Architecture Summary

* **Outcome:** All 11 implementation tasks completed and approved by User (Task 2.12 review checkpoint passed). Full content architecture built: Zod schemas for 12 collections, all page templates (Chapter, Paper, Module, Post), all content stubs (18 chapters, 10 papers, 6 methods, 3 data sources, 2 threads, 5 transitions, 4 interludes), Zotero integration, Pagefind search, landing and about pages, and Vitest test framework with initial tests.
* **Key findings carried forward:** (1) `key_claims` uses `{claim, detail}` object shape (PRD canonical — diverged from initial Task Assignment spec). (2) Paper `status` enum: `planned | in-progress | submitted | in-review | revision | published`. (3) `compute` field optional outer object with optional `hardware`/`runtime` and required `cloud: boolean`. (4) Zotero library tags are generic LoC subject headings — bibliography filtering by tag will not work until library is tagged with project-specific values. (5) `data-justice` (not `data-justice-foundations`) is the canonical path enum value.
* **Agents involved:** Agent_Schema_Platform (2.1, 2.11), Agent_Design_Templates (2.2a–2.5, 2.8), Agent_Content (2.6a, 2.6b, 2.7), Agent_Integration (2.9a, 2.9b, 2.10)

**Phase 2 Memory Logs:** `.apm/Memory/Phase_02_Content_Architecture/`

---

## Phase 3 – Interactive Core Summary

* **Outcome:** All 7 implementation tasks completed and approved by User (Task 3.8 review checkpoint passed). Full interactive infrastructure built: shared viz utilities, a11y helpers, Storybook config, and 5 interactive components. Escalation decision: Persistence Diagram Builder → WebGL upgrade deferred to Phase 5 Task 5.1; all others keep SVG.
* **Key findings carried forward:** (1) Intentional `exhaustive-deps` warning in `PovertySimulator.tsx` line 331 — do not fix. (2) Storybook stories must use `React.createElement` not JSX. (3) `afterEach(cleanup)` required in all React component test files. (4) `ExpandableCard` uses `inert` not `aria-hidden` on collapsed panels. (5) `TextDescriptionToggle` is additive (description shown below viz, not replacing it). (6) `showTooltipHtml` (not `showTooltip`) for HTML content in tooltips. (7) `[slug].astro` and `ModuleLayout.astro` must use explicit slug conditionals for dynamic component rendering.
* **Test count at phase end:** 124 tests (9 files)
* **Agents involved:** Agent_Interactive_Core (3.1–3.4, 3.6a, 3.6b, 3.7a, 3.7b)

**Phase 3 Memory Logs:** `.apm/Memory/Phase_03_Interactive_Core/`

---

## Phase 4 – Learning Paths Summary

* **Outcome:** All 7 implementation tasks completed; Task 4.8 User Review Checkpoint pending. Complete learning path infrastructure built: hub page, path landing pages, progress tracking, 16 module MDX stubs (8 per path), embedded interactives, glossary, and reading lists.
* **Key findings carried forward:** (1) Module identifier in progress system uses `String(module_number)` — integer cast to string. (2) Module links (`/learn/{pathSlug}/{moduleNumber}`) will return 404 until a dynamic module route is built (not in Phase 4 scope). (3) `GlossaryTooltip` uses `aria-hidden` as string `'true'`/`'false'` (jsx-a11y `aria-proptypes` rule). (4) Dev page prod-guard `return new Response(null, {status:404})` must appear after import statements. (5) Zotero key lookup uses `item.key` (8-char), not `citationKey`.
* **Test count at phase end:** 140 tests (10 files)
* **Agents involved:** Agent_Design_Templates (4.1), Agent_Schema_Platform (4.2), Agent_Content (4.3, 4.4, 4.7), Agent_Integration (4.6), Agent_Interactive_Core (4.5)

**Phase 4 Memory Logs:** `.apm/Memory/Phase_04_Learning_Paths/`
