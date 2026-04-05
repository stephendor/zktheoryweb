# zktheory.org Research Portfolio Website – APM Implementation Plan

**Memory Strategy:** Dynamic-MD
**Last Modification:** Task 6.10 / Phase 6 complete. ORCID (0009-0005-1387-7279) and institution (The Open University, UK) applied directly to about page and Person JSON-LD. Netlify live (all steps complete except Zotero build hook — deferred). Zotero library sync run manually. Papers currently unpublished — per-paper `date:` field schema in place for when paper 1 goes to arXiv. Phase 7 added to plan. 127 pages, 420 tests, 0 lint errors. Prior: Task 6.9 complete — ch-00-sample route exclusion pattern (`id !== 'ch-00-sample'`) confirmed correct and used in hub. Task 6.2 also corrected Ch09 (VC power-law replaces impact-investing placeholder) and Ch13 (British deserving/undeserving tradition replaces HDI/MPI placeholder) per outline files — these were correct updates. Paper 03 finding inverted (BHPS/USoc artefact, not GFC signature) and Paper 04 finding inverted (absence of H1 at low income, not isolated H0) — both confirmed correct by author. Prior: Task 6.1a-followup complete — Paths 3+4 registered; 18 chapter routes built; `/counting-lives/` and `/tda/` hub pages live. 103 pages, 420 tests, 0 lint errors. TWO IMPORTANT FINDINGS: (1) `ch-00-sample.mdx` has `chapter_number: 1` — same as real ch-01; ALL future chapter collection filters must use `id !== 'ch-00-sample'` NOT `chapter_number > 0`; (2) NO TDA paper detail route exists — `/tda/pages/tda/papers/[slug].astro` is absent; TDA hub paper cards currently 404 with `data-todo="paper-detail-route"`. This route must be created before Task 6.2 paper content is accessible — added as a companion infrastructure task to be issued alongside Task 6.2. Prior: content-source structure corrected: `Index.md` files are empty — ignore. Outline file per chapter is `Ch{NN} - {Title}.md` at top of chapter folder. Section drafts in `sections/` exist for Ch01–Ch07 only; Ch08–Ch18 have outline files only. Ch00 (Introduction) and Ch18 (Conclusion) are now present. Task 6.2 guidance updated accordingly. Prior: Task 6.1b complete — 6 new interactives + BenefitTaperCalculator enhancement delivered. 83 pages, 420 tests (20 files), 0 lint errors. Key findings: (1) `computePersistence` lives ONLY in `src/lib/tda/vietorisRips.ts` — `filtrationUtils.ts` does NOT re-export it; always import from `vietorisRips.ts`; (2) `death === birth` zero-length persistence intervals are valid — test assertions must use `toBeGreaterThanOrEqual` not `toBeGreaterThan`; (3) all 7 target MDX module files (path2-module-1 through path2-module-8) now have `interactive_slug` set. `content-source/` structure confirmed — structure differs from initial plan: chapters are organised by Part folder, then individual chapter folder, with an `Index.md` full-draft file and a `sections/` subdirectory of individual section drafts. TDA papers have `drafts/v{N}-{YYYY-MM}.md` versioned draft files plus `_outline.md`, `_project.md`. Exact mapping: `content-source/counting-lives/Part I - The State Learns to Count/Ch01.../` (17 chapters across 4 Parts); `content-source/tda/P01-VR-PH-Core/` through `P04-Multipers-Poverty/` (4 papers with draft files). Task 6.2 guidance must be updated to reflect this structure. Task 6.1 complete — 6 Path 3 (data-justice) MDX stubs created. 77 pages, 238 tests. THREE SCHEMA CORRECTIONS confirmed against `src/content.config.ts`, must be applied to all future learn-module content tasks: (1) `check_understanding` items use field `answer` not `guidance`; (2) `connections` object requires four sub-arrays: `chapters`, `papers`, `modules`, `methods` — all must be present (empty arrays are fine); (3) current passing test count is 238, not 231. Prior: Phase 6 branch cut from merged main (commit 267b2a4). `content-source/` directory created at project root for real content ingestion: `content-source/counting-lives/ch-{NN}-{outline|draft}.md` and `content-source/tda/paper-{NN}-draft.md`. PDFs gitignored. Task 6.2 updated with real-content ingestion guidance. `/tda/` and `/counting-lives/` hub pages are empty stubs — added to Task 6.1a scope. Prior: Task 5.10 complete — Phase 5 QA Sprint (Groups A–F) closed. Build: 71 pages, 231 tests, 0 lint errors. Key sprint findings integrated into Phase 6 plan below. Summary of changes: (A) PovertySimulator log-normal recalibrated by median anchor (£35k), OECD equivalisation applied to CDF query, household-scaled density curve — poverty rates now ~17–20% for single adult (correct); (B) FiltrationPlayground: simplex count subtitle added, radius sweep opacity raised; (C) MapperParameterLab: panel height 440px, D3 pan+zoom added, tooltip rewritten to plain language; (D) Learning paths: 8 MDX modules corrected (wrong interactive_slug removed, notional prose replaced with real guidance or honest placeholders), learnPaths.ts Path 2 titles/coreConcepts rewritten, path1-module-7/8 rewritten as Phase 6 stubs, 2 new path1 modules created, path4 renumbered to 14 modules, interactive slot moved after Content in ModuleLayout.astro, code block full-width breakout added to prose.css; (E) NormalDistExplorer verified clean; (F) Figure-eight teaching note added to path4-module-3.mdx. IMPORTANT CONTENT AUTHORING ISSUE: `interactive_slug` in MDX frontmatter was systematically incorrect across 5/8 Path 2 modules and 2/8 Path 1 modules — all corrected. `status: 'stub'` is invalid Zod enum; use `'drafting'`. Six net-new Phase 6 interactives (PH6-I1 through I6), one enhancement (PH6-E1), and two prose modules (PH6-W1/W2) identified and logged — see new Tasks 6.1a, 6.1b, updated Task 6.2. Prior: Task 5.8 complete (with Manager collateral fixes). All Phase 5 interactives embedded. Manager fixed: (1) path1-module-6.mdx + path2-module-3.mdx missing interactive_slug (these were NOT already set — build confirmed clean after adds); (2) .playwright-mcp/ added to .gitignore and untracked (Playwright MCP session artefacts accidentally committed). Finding 2 noted: no counting-lives chapter route exists — ch-16.mdx callout is in place waiting for Phase 6 chapter detail route task. All checks clean: 69 pages, 231 unit tests, 20 E2E passed / 1 skip, lint 0 errors. Prior: Task 5.7 complete — 12 Path 4 MDX stubs delivered. 69 pages. MDX/YAML authoring bugs now codebase patterns: (1) en-dashes in YAML `title:` fields corrupt newlines — use ASCII hyphens; (2) `{,}` in MDX prose is a JSX expression — use plain commas outside `$...$`; (3) unescaped apostrophes in single-quoted YAML crash build — reword or use `''`. Note: `learnPaths.ts` does not yet register `tda-practitioners` (path landing page won't list Path 4 until Phase 6); dynamic module route already serves all path4-module-{N} pages correctly. Pyodide code runner slots in modules 1,2,3,5,7,9,10 remain as `{/* Pyodide code runner slot */}` comments — pre-computed TDA Results Explorer (Task 5.5b) is the delivered solution; no further wiring needed. Prior: Task 5.9 complete — Playwright E2E testing delivered. 20 passed, 1 intentional skip (WebKit 3D animation on PDB). FOUR PATTERNS all future E2E agents must follow: (1) `client:visible` requires explicit `waitFor({ state:'visible', timeout:10_000 })` on React-rendered elements — Playwright auto-wait is insufficient; (2) PDB3D left panel is `role="application"` on WebGL2 browsers (Chromium/Firefox) vs `role="img"` SVG — use `.or()` locator; (3) `PathProgressBar` lives on `/learn/` hub, not path landing pages; (4) WebKit progress-bar hydration: use `expect(...).not.toHaveAttribute('aria-valuenow', '0', { timeout: 8_000 })` not a simple value read. Prior: Task 5.5b complete — TDA Results Explorer (pre-computed) delivered. 47 new tests (231 total), 63 pages. IMPORTANT TOPOLOGY NOTE: figure-eight H₁ = 2 loops only with *separate* lobes (two circles of r=0.5 centred at ±0.7, bridge point at origin). The live FiltrationPlayground/PersistenceDiagramBuilder figure-8 preset (shared-vertex, rr≈0.18) correctly shows only 1 H₁ loop at typical interactive radii — not a bug; a teaching point. Educational text in Path 4 Module 3 and any figure-8 annotation should note this. Prior: Task 5.5a complete — Pyodide INFEASIBLE. No WASM wheels for ripser/gudhi/giotto-tda; cold-load 10–18s violates 5s UX target. Strategy (c) APPROVED: pre-computed JSON only, no Pyodide runtime. Task 5.5b reframed to TDA Results Explorer (Python build script + static JSON + React D3 component). persim installable but useless without compute libs. Pyodide viable for future non-TDA light numeric work (NumPy 2.2.5, SciPy 1.14.1 both bundled). Prior: Task 5.6 complete (with Manager collateral fixes). Module dynamic route delivers 16 new pages (56 total). Two issues resolved by Manager: (1) `sample-module.mdx` deleted — was a Task 2.4 leftover conflicting with `path1-module-1.mdx` on `/learn/topology-social-scientists/1`; (2) `ModuleLayout.astro` prev/next and progress-strip hrefs fixed from `/learn/modules/${slug}/` to `/learn/${path}/${n}/` scheme; `connections.modules` sidebar links fixed via `moduleEntryIdToHref()` helper (parses `path{N}-module-{M}` entry ID). Build 56 pages, 184 tests, lint 0 errors. Prior: Task 5.3 complete — Filtration Playground delivered. 4 new bettiNumbers tests (188 total). CORRECTION: `buildComplex(points, radius)` returns `Simplex[]` (flat array), NOT `{ vertices, edges, triangles }`. Extract sub-lists with `.filter((s) => s.dimension === n)`. All future tasks consuming `buildComplex` must use this pattern. Agent created `filtrationUtils.ts` (50-pt wrapper) rather than modifying `PointCloudEditor` 30-pt cap — `maxPoints` prop added to PointCloudEditor with default 30. Prior: Task 5.4 complete — Benefit Taper Calculator delivered. 16 new calc tests (184 total). Verified: £1,000 gross (no housing, 55%) → UC £213.60, net £1,213.60. Poverty trap zone renders only when 63% comparison active (correct — 55% does not breach 60% EMR threshold). Prior: Task 5.2 complete — Mapper Parameter Lab delivered. 11 new tests (165 total). Established colour scale pattern: `getVizColorScale()` + `d3.scaleQuantize` (6-slot Okabe-Ito, built inside useEffect) — use this pattern in all subsequent interactives, not `d3.interpolateViridis`. Prior: Task 5.1 complete — Three.js/R3F 3D WebGL upgrade delivered. Bundle: ~253 KB gzip, `client:visible` lazy-load, TTI < 1s. Manager decision: accept single-chunk bundle (no code-splitting task added; Phase 6 Polish if needed). 154 tests passing. Prior: Phase 5 started. Task 5.6 (Learn Module Dynamic Route) added to Phase 5 Batch 1 to resolve `/learn/{pathSlug}/{moduleNumber}` 404 gap (§4.3 of Phase 5 Handover). Tasks renumbered: old 5.6→5.7, 5.7→5.8 (deps updated), 5.8→5.9, 5.9→5.10. Phase 5 branch `phase-5/advanced-interactives` created from merged main (PR #2). Prior: Phase 4 complete — 140 tests, lint exit 0, 37-page Pagefind build. Phase 3 escalation decisions: Persistence Diagram Builder → WebGL (Task 5.1 only); all others keep SVG. Intentional `react-hooks/exhaustive-deps` warning at PovertySimulator.tsx:331 — do not fix. Module path enum `path` values: `topology-social-scientists`, `mathematics-of-poverty`, `data-justice`, `tda-practitioners`.
**Project Overview:** Full build of zktheory.org — a research portfolio website for two interconnected research programmes (Counting Lives book + TDA research programme). Astro 6, Tailwind CSS 4, React 19, TypeScript. Features: dual-palette design system, 18 chapter pages, 10 paper pages, 4 learning paths (34 modules), 10+ interactive visualisations (D3/Three.js), Zotero bibliography integration, Pagefind search, Netlify deployment. Six-phase build from foundation through polish. Content-first approach with interactive escalation review gates.

## Phase 1: Foundation

### Task 1.1 – Astro Project Scaffold & Build Configuration - Agent_Infra

**Objective:** Initialize the Astro 6 project with all core integrations and the full directory structure.
**Output:** Working Astro project that builds and serves locally with React, Tailwind CSS 4, MDX, and Netlify adapter configured.
**Guidance:** Follow PRD §4.1 stack and §4.2 content architecture for directory structure. TypeScript strict mode.

1. Initialize Astro 6 project with TypeScript (strict mode), install core dependencies: `@astrojs/react`, `@tailwindcss/vite`, `@astrojs/mdx`, `@astrojs/netlify`, `react`, `react-dom`
2. Configure `astro.config.mjs` with all integrations (React, Tailwind, MDX, Netlify adapter), set output mode to `static`, configure site URL to `https://zktheory.org`
3. Set up Tailwind CSS 4 configuration with the project's custom token structure; create initial `src/styles/tokens.css` placeholder
4. Create the directory scaffold per PRD §4.2: `src/content/`, `src/components/` (with subdirectories: counting-lives, tda, learn, interactives, shared), `src/layouts/`, `src/styles/`, `src/pages/` with route stubs for all top-level routes (/, /counting-lives/, /tda/, /learn/, /writing/, /about/)
5. Verify the project builds cleanly and serves locally; confirm all integrations load without errors

### Task 1.2 – Code Standards Setup - Agent_Infra

**Objective:** Establish consistent code formatting, linting with a11y rules, and git conventions.
**Output:** Prettier, ESLint configs, npm scripts, git conventions documented.
**Guidance:** Include `eslint-plugin-jsx-a11y` from the start per a11y-first requirement. **Depends on: Task 1.1 Output**

- Install and configure Prettier with Astro plugin (`prettier-plugin-astro`); set consistent defaults (single quotes, semicolons, 2-space indent, trailing commas)
- Install and configure ESLint with `@typescript-eslint`, `eslint-plugin-astro`, `eslint-plugin-jsx-a11y` (a11y linting from start); add npm scripts `lint` and `format`
- Establish git conventions: branch naming `feature/<phase>-<description>`, `fix/<description>`; conventional commits format; update `.gitignore` for Astro build artifacts, environment files
- Create a brief `CONTRIBUTING.md` documenting these standards for consistency across agent sessions

### Task 1.3 – Design Token System & Colour Palettes - Agent_Design_System

**Objective:** Create the dual-palette design token system with light and dark mode structural support.
**Output:** Complete `src/styles/tokens.css` with all colour tokens, Tailwind integration.
**Guidance:** Follow PRD §3.2 colour system. WCAG AA contrast required for key pairings (body text on bg, heading on bg, link on bg, palette darkest on lightest). For the 8-colour data viz palette, use an established colour-blind-safe scheme (e.g., d3-chromatic categorical or ColorBrewer qualitative) rather than creating one from scratch. Dark mode as structural foundation (toggle deferred Phase 6). **Depends on: Task 1.1 Output**

- Define CSS custom properties in `src/styles/tokens.css` covering: neutral base (warm off-white, dark charcoal), Counting Lives palette (muted reds, deep ochre, archival cream), TDA palette (deep teal, slate blue, warm grey), shared highlight (warm amber), and 8-colour colour-blind-safe data viz palette sourced from an established scheme — verify WCAG AA contrast for key pairings: body text on page background, heading on page background, link colour on page background, each palette’s darkest on its lightest
- Create light and dark mode token variants using `:root` and `[data-theme="dark"]` selector patterns; dark mode as a structural foundation (toggle UI deferred to Phase 6)
- Integrate tokens into Tailwind CSS 4 configuration so utility classes map to custom properties (e.g., `text-cl-red`, `bg-tda-teal`, `text-neutral-body`)
- Define spacing scale, border radius, and shadow tokens for consistent component styling

### Task 1.4 – Typography Exploration & Integration - Agent_Design_System

**Objective:** Select and integrate fonts for all four typographic roles with a complete type scale.
**Output:** Integrated web fonts, typographic scale in tokens, typography sample page at `/dev/typography`.
**Guidance:** First selections: Charter/Source Serif Pro (body), Instrument Sans (UI), JetBrains Mono (code). Explore display serif options. PRD §3.2 typography specs. **Depends on: Task 1.3 Output**

1. Ad-Hoc Delegation – Font evaluation: Research and evaluate font pairings for the four typographic roles per PRD §3.2. Evaluation criteria: open-source licensing (required for Netlify hosting), rendering quality at body sizes on screen, visual harmony with KaTeX math output, WOFF2 availability, total file size budget (<200KB all fonts). Start with Charter/Source Serif Pro (body), Instrument Sans (UI), JetBrains Mono (code), and identify 1–2 display serif candidates (Freight Display space — consider Playfair Display, Libre Caslon, or similar open-source alternatives)
2. Integrate first-selection fonts: configure web font loading (self-hosted with `font-display: swap` for performance), set up @font-face declarations, add to Tailwind font family configuration
3. Define typographic scale in `tokens.css`: heading sizes (h1–h6), body size, small text, line heights (1.5–1.6 for body), letter-spacing; ensure measure targets 65–75 characters at content width
4. Create a typography sample page (`/dev/typography`) demonstrating all font roles, sizes, weights, and prose rendering — include placeholder blocks where KaTeX math samples will be added once Task 1.7 completes; serves as a reference and review artefact for user checkpoint

### Task 1.5 – Base Layout & Navigation Components - Agent_Design_Templates

**Objective:** Build the shared page shell with responsive navigation, footer, and layout grid.
**Output:** `BaseLayout.astro`, navigation component, footer component, responsive 12-column grid.
**Guidance:** Semantic HTML landmarks, skip-to-content link, `data-theme` attribute for future dark mode. PRD §3.2 layout specs (720px prose, 1080px viz, full-bleed). **Depends on: Task 1.1 Output by Agent_Infra, Task 1.3 Output by Agent_Design_System, Task 1.4 Output by Agent_Design_System**

1. Create `BaseLayout.astro` with HTML document structure: semantic `<header>`, `<main>`, `<footer>` landmarks, skip-to-content link, viewport meta, Open Graph metadata slots, font loading, token CSS import, and a `data-theme` attribute on `<html>` for future dark mode toggle; verify landmark structure with `eslint-plugin-jsx-a11y`
2. Build responsive site navigation component: desktop horizontal nav with links to all top-level routes (Home, Counting Lives, TDA, Learn, Writing, About), mobile hamburger menu using minimal vanilla JS with proper ARIA attributes (`aria-expanded`, `aria-controls`, `aria-label`) — avoid CSS-only toggle due to a11y limitations; active route highlighting; keyboard navigable (Tab through links, Escape to close mobile menu)
3. Build site footer component: copyright, institutional affiliation placeholder, links to ORCID/GitHub/Google Scholar/contact, site credits; semantic `<footer>` with `role="contentinfo"`
4. Implement responsive layout grid: 12-column grid with generous gutters using Tailwind, content width constraints (720px prose, 1080px viz, full-bleed hero), and asymmetric layout support for sidenote margins; verify colour contrast against tokens at all breakpoints

### Task 1.6 – Prose Styles, Sidenote System & Print Foundations - Agent_Design_System

**Objective:** Create the long-form reading experience with Tufte-tradition sidenotes and print stylesheet.
**Output:** `prose.css`, `<Sidenote>` component, `print.css`.
**Guidance:** Sidenotes in margin column on desktop, inline footnotes on mobile. PRD §3.2 layout and §3.3 interaction design. **Depends on: Task 1.4 Output, Task 1.5 Output by Agent_Design_Templates**

1. Create `src/styles/prose.css` with comprehensive long-form reading styles: heading hierarchy with appropriate font pairings (display serif for h1–h2, body serif for h3+), paragraph spacing, list styles, blockquote styling (archival feel), inline code, code blocks with syntax highlighting integration point, table styles, link styles with hover states per PRD §3.3, reading progress indicator CSS
2. Build `<Sidenote>` Astro/React component implementing Tufte-tradition margin notes: numbered sidenotes using CSS counter-increment for automatic numbering, CSS grid/flexbox positioning in the margin column on desktop (content width + margin = asymmetric layout from Task 1.5), collapsible inline footnotes on viewports narrower than 1024px; accessible with `aria-describedby` linking the inline marker to the note content
3. Create `src/styles/print.css` with clean print layout: hide navigation, footer, interactive chrome; proper pagination breaks; footnotes instead of sidenotes; legible typography without web-specific styling
4. Test prose styles with a sample MDX page containing headings, paragraphs, sidenotes, code blocks, LaTeX (placeholder), blockquotes, and lists — validate rendering at desktop, tablet, and mobile breakpoints

### Task 1.7 – MDX Pipeline Configuration - Agent_Schema_Platform

**Objective:** Configure compile-time KaTeX rendering and syntax highlighting for the MDX pipeline.
**Output:** Working MDX pipeline with KaTeX (zero client-side JS), Shiki syntax highlighting, test page.
**Guidance:** PRD §4.1 specifies rehype-katex compile-time. Include KaTeX aria-labels for accessibility (PRD §4.5). **Depends on: Task 1.1 Output**

- Install and configure `remark-math` and `rehype-katex` in the Astro MDX integration; add KaTeX CSS to the base layout; verify compile-time rendering produces zero client-side math JS
- Configure Shiki syntax highlighting (Astro's built-in) with a theme that complements the design tokens; support Python, TypeScript, JavaScript, YAML, and shell languages
- Add KaTeX `aria-label` configuration for screen-reader-compatible math rendering per PRD §4.5
- Create a test MDX file with inline math (`$...$`), display math (`$$...$$`), and code blocks to verify the full pipeline renders correctly

### Task 1.8 – User Review Checkpoint: Phase 1 - User

**Objective:** Review Phase 1 foundation output and approve before proceeding to content architecture.
**Output:** User approval or change requests for Phase 1 deliverables.
**Guidance:** Review covers: typography selections, colour palette, layout proportions, sidenote behaviour, navigation, MDX pipeline. **Depends on: All Phase 1 tasks**

1. Compile review artefacts: serve the site locally, document what's been built (layouts, tokens, typography sample page, prose styles with sidenotes, MDX math/code rendering), and present to user
2. User reviews and provides feedback on: typography selections (approve or request alternatives), colour palette feel, layout proportions, sidenote behaviour, navigation structure, overall Foundation quality
3. Incorporate any user-requested changes; confirm Phase 1 approval before proceeding to Phase 2

## Phase 2: Content Architecture

### Task 2.1 – Content Collection Schemas (Zod) - Agent_Schema_Platform

**Objective:** Define strict Zod schemas for all content collections matching PRD data models.
**Output:** Complete `src/content.config.ts` with all collections registered.
**Guidance:** Follow PRD §4.3 data models exactly. All frontmatter fields must be typed. **Depends on: Task 1.1 Output by Agent_Infra**

- Define Zod schemas for Counting Lives collections: `chapters` (matching PRD §4.3 chapter frontmatter exactly — title, chapter_number, part, transition, spine_role, status, key_figures, mathematical_concepts, interludes, threads, related_tda_papers, key_claims), `transitions`, `threads`, `interludes`, `figures`
- Define Zod schemas for TDA collections: `papers` (matching PRD §4.3 paper frontmatter exactly — title, paper_number, stage, status, target_journal, depends_on, enables, methods, datasets, compute, key_findings, abstract, plain_summary, bibtex), `methods`, `data-sources`
- Define Zod schemas for Learning and Writing collections: `learn-modules` (title, path, module_number, core_concept, interactive_slug, connections, check_understanding), `interactives` (matching PRD §4.3 interactive manifest), `essays`, `notes`
- Register all collections in `src/content.config.ts` using Astro's `defineCollection` API; export the complete config. **Note (Astro 6):** Import `z` from `zod` directly (`import { z } from 'zod'`), NOT from `astro:content` (deprecated in Astro 6).

### Task 2.2a – ChapterLayout & Shared Sticky ToC - Agent_Design_Templates

**Objective:** Build the chapter page layout structure and the shared sticky sidebar table of contents component.
**Output:** `ChapterLayout.astro` with hero, prose area, sticky ToC, chapter navigation. Sticky ToC is reusable by PaperLayout and other layouts.
**Guidance:** The sticky ToC is a shared component — build it generically for reuse. Follow PRD §2.2.1 for chapter layout structure. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 1.5 Output by Agent_Design_Templates**

**Pre-step (fix from Task 1.6):** Before building ChapterLayout, add a `.container-prose--wide` variant to `src/styles/layout.css`: `max-width: calc(var(--content-prose) + var(--sidenote-width) + var(--space-6))` (≈ 964px). Use this wider container on all pages that include the `.prose` sidenote grid, so the main text column preserves the 65ch target (~650px) rather than collapsing to the ~476px produced by the standard `.container-prose` (720px).

1. Build a shared sticky sidebar table of contents component: auto-generates from heading hierarchy, sticky positioning on desktop, collapsible disclosure on mobile, keyboard navigable, highlights current section on scroll; designed for reuse across ChapterLayout, PaperLayout, and ModuleLayout
2. Create `ChapterLayout.astro` extending `BaseLayout` with chapter-specific structure: hero section (title, part, chapter number, status badge), prose content area using the shared sticky ToC, next/previous chapter navigation; wrap prose content in `.container-prose--wide` (not `.container-prose`) to preserve 65ch reading measure
3. Test the layout with a minimal sample MDX file; verify sticky ToC works at all breakpoints and with varying heading depths

### Task 2.2b – Expandable Card & Figure Card Components (Shared) - Agent_Design_Templates

**Objective:** Build the reusable expandable card component and key figures biographical card — used across chapters, papers, and learning modules.
**Output:** `<ExpandableCard>` React island (reusable), `<FigureCard>` component.
**Guidance:** The expandable card pattern is reused for: chapter key claims, paper key findings, module reflection questions. Build generically. **Depends on: Task 1.5 Output by Agent_Design_Templates**

1. Build `<ExpandableCard>` React island: accepts title/summary text and detail content as props, expands on click to reveal detail, accessible expand/collapse with `aria-expanded` and `aria-controls`, smooth transition (200–300ms per PRD §3.3), keyboard operable (Enter/Space to toggle)
2. Build `<FigureCard>` component: portrait/photo placeholder, name, dates, role description, links to related chapters; supports grid layout for multiple figures on a page
3. Add Vitest tests for ExpandableCard expand/collapse behaviour and ARIA attribute toggling

### Task 2.2c – Thread Markers & Concept Tooltips - Agent_Design_Templates

**Objective:** Build the chapter-specific thread marker indicators and mathematical concept preview tooltips.
**Output:** `<ThreadMarker>` component, `<ConceptTooltip>` React island, integrated into ChapterLayout.
**Guidance:** Thread markers are chapter-specific. Concept tooltips link to Mathematical Interludes. **Depends on: Task 2.2a Output, Task 2.2b Output**

1. Build `<ThreadMarker>` component: visual indicators (Scottish = colour-coded strand using Counting Lives palette, Gender = colour-coded strand) showing which threads run through the chapter, with navigable links to thread pages; render from chapter frontmatter `threads` data
2. Build `<ConceptTooltip>` React island: mathematical concept inline links with preview tooltip showing the concept definition and link to the relevant Mathematical Interlude page; hover/focus triggered, dismissable, accessible with `role="tooltip"` and keyboard support
3. Integrate thread markers and concept tooltips into ChapterLayout; test with a sample chapter MDX file demonstrating all chapter-specific features end-to-end

### Task 2.3 – Paper Page Template & Layout - Agent_Design_Templates

**Objective:** Build the TDA paper page experience with all PRD §2.3.1 components.
**Output:** `PaperLayout.astro` with status badges, expandable findings, methodology links, BibTeX copy, downloads.
**Guidance:** Reuse shared sticky ToC from Task 2.2a and ExpandableCard from Task 2.2b for key findings. Follow PRD §2.3.1 spec. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 2.2a Output, Task 2.2b Output**

1. Create `PaperLayout.astro` extending `BaseLayout` with paper-specific structure: hero (title, paper number, stage badge, status badge with target journal), abstract section, plain-language summary section, shared sticky ToC from Task 2.2a
2. Build paper-specific components: reuse `<ExpandableCard>` from Task 2.2b for key findings cards, methodology summary linking to `/tda/methods/` pages, computational requirements display (hardware, runtime, cloud indicator), dependency graph position indicator showing where this paper sits in the 10-paper sequence (static visual — interactive version in Phase 3)
3. Build downloads and citation section: preprint PDF link, supplementary materials link, code repository link, data access instructions, BibTeX one-click copy button (React island using `navigator.clipboard`)
4. Integrate all components into PaperLayout; test with a sample paper MDX file; ensure all interactive elements are accessible

### Task 2.4 – Learning Module Template & Layout - Agent_Design_Templates

**Objective:** Build the learning path module page experience per PRD §2.4.1.
**Output:** `ModuleLayout.astro` with interactive slot, reflection questions, module navigation.
**Guidance:** Reuse shared sticky ToC from Task 2.2a and ExpandableCard from Task 2.2b for reflection questions. Follow PRD §2.4.1. Progress tracking logic deferred to Phase 4 (visual indicator only here). **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 2.2a Output, Task 2.2b Output**

1. Create `ModuleLayout.astro` extending `BaseLayout` with module-specific structure: path breadcrumb (path name > module title), prose content area, interactive element slot (for embedding React islands), connections sidebar (links to related chapters, papers, other modules), shared sticky ToC from Task 2.2a
2. Build "check your understanding" component using `<ExpandableCard>` from Task 2.2b: 2–3 reflection questions per module, each wrapping the question as summary and suggested thinking as expandable detail
3. Build module navigation: previous/next within the learning path, path progress indicator showing completed/current/upcoming modules (visual only — progress tracking logic in Phase 4), path overview link
4. Integrate components into ModuleLayout; test with a sample module MDX file; validate responsive behaviour and accessibility

### Task 2.5 – Blog/Writing Post Template & Layout - Agent_Design_Templates

**Objective:** Build the writing section post template with essay and note variants, tag archive, and RSS feed.
**Output:** `PostLayout.astro`, tag archive page, RSS feed.
**Guidance:** Follow PRD §2.5. Support LaTeX, code, embedded interactives, sidenotes. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 1.5 Output by Agent_Design_Templates**

1. Create `PostLayout.astro` extending `BaseLayout` with writing-specific structure: title, date, estimated reading time (calculated from word count), tags with links to tag archive pages, author byline; style essay variant (long-form with section headings, pull quotes, embedded interactive slots) and note variant (shorter, informal); both support LaTeX, code blocks, sidenotes, and embedded interactives via MDX component imports
2. Build tag archive page template (`/writing/archive/`) with chronological listing and tag-based filtering (client-side filter using URL parameters or Astro static routes per tag)
3. Build RSS feed generation for the writing section using Astro's `@astrojs/rss` integration; configure feed metadata, item descriptions, and publication dates
4. Test with sample essay and note MDX files; verify reading time calculation, tag links, tag archive filtering, and RSS output validates correctly

### Task 2.6a – Counting Lives: Overview & Chapter MDX Stubs - Agent_Content

**Objective:** Create the section overview and all 18 chapter MDX stubs with complete frontmatter and structured placeholder prose.
**Output:** 20 MDX files (overview, counter-mathematics page, 18 chapters).
**Guidance:** All frontmatter must validate against Zod schemas from Task 2.1. Placeholder prose should be realistic in length and structure. Use PRD Appendix A for chapter data. Chapters are the backbone content — prioritise frontmatter completeness. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 2.2a Output by Agent_Design_Templates**

1. Create the Counting Lives overview page (`/counting-lives/overview`) and the counter-mathematics page with structurally complete placeholder content describing the book's argument, five transitions, and two threads
2. Create all 18 chapter MDX files in `src/content/counting-lives/chapters/` with complete frontmatter per PRD §4.3 (title, chapter_number, part, transition, spine_role, status, key_figures, mathematical_concepts, interludes, threads, related_tda_papers, key_claims) and structured placeholder prose (synopsis ~400 words, spine role sentence, 3–5 key claims with expandable detail placeholders). **Schema note:** `key_claims` is `Array<{claim: string, detail: string}>` — author each entry as `- claim: "..." \n  detail: "..."` in YAML frontmatter. `threads` is `Array<string>` (thread slugs) — author as a YAML list e.g. `threads: [scottish-thread, gender-thread]` or as block sequence `- scottish-thread`. Do NOT use the old object format `{ scottish: boolean, gender: boolean }` — that schema was superseded in Task 2.2c.

### Task 2.6b – Counting Lives: Transitions, Threads, Interludes & Figures - Agent_Content

**Objective:** Create all supporting content: transition, thread, interlude, and figure MDX stubs.
**Output:** ~12 MDX files (5 transitions, 2 threads, 4 interludes, 5–8 figure stubs).
**Guidance:** These support the chapter backbone. Threads are essay-length (~2,000 words). Interludes have three-level mathematical structure. **Depends on: Task 2.6a Output**

1. Create 5 transition MDX files in `src/content/counting-lives/transitions/` with frontmatter and placeholder prose describing each transition era, date range, key chapters, and key figures
2. Create 2 thread MDX files (`scottish-thread.mdx`, `gender-thread.mdx`) with frontmatter and placeholder content (~2,000 words each) including thread-specific timeline, chapter annotations, key figures, and essay structure
3. Create 4 interlude MDX files in `src/content/counting-lives/interludes/` with three-level structure (intuitive, intermediate, formal) and placeholder content; create initial figure stub files for key historical actors (Orshansky, Galton, Beveridge, Eubanks, Quetelet — 5–8 stubs)

### Task 2.7 – TDA Section MDX Stubs - Agent_Content

**Objective:** Create structurally complete placeholder MDX files for the entire TDA section.
**Output:** ~23 MDX files (10 papers, 6 methods, 3 data sources, overview, code, computational log, visualisations gallery).
**Guidance:** All frontmatter must validate against Zod schemas. Use PRD Appendix B for paper data. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 2.3 Output by Agent_Design_Templates**

1. Create the TDA overview page (`/tda/overview`) with structurally complete placeholder describing the three-stage research programme architecture, 10-paper sequence, and programme narrative
2. Create all 10 paper MDX files in `src/content/tda/papers/` with complete frontmatter per PRD §4.3 (title, paper_number, stage, status, target_journal, depends_on, enables, methods, datasets, compute, key_findings, abstract, plain_summary, bibtex) and structured placeholder prose (abstract, plain-language summary, key findings, methodology summary). **Schema notes (post Task 2.3):** `key_findings` is `Array<{claim: string, detail: string}>` — author as `- claim: "..." \n  detail: "..."` in YAML; `status` enum is `planned | in-progress | submitted | in-review | revision | published` (6 values, not 3); `compute` is optional outer object with optional `hardware`, `runtime`, and required `cloud: boolean`. See `paper-01-sample.mdx` as a reference for correct frontmatter shape.
3. Create 6 methods MDX files in `src/content/tda/methods/` with structured placeholder content (intuitive introduction, mathematical formulation placeholder with LaTeX, implementation section with Python code stubs, application to research, further reading); create 3 data source MDX files with dataset descriptions, access information, and ethics notes
4. Create code/replication page, computational log page (public lab notebook format), and visualisations gallery page as MDX stubs with appropriate structure

### Task 2.8 – Landing Page & About Page - Agent_Design_Templates

**Objective:** Build the homepage and about section per PRD §2.1 and §2.6.
**Output:** Landing page with hero, project cards, activity feed; about page with bio, CV, contact, media kit.
**Guidance:** Recent activity feed pulls from content collections. **Depends on: Task 1.5 Output, Task 2.6a Output by Agent_Content, Task 2.7 Output by Agent_Content**

1. Build the landing page (`src/pages/index.astro`): hero section with site tagline and visual identity (full-bleed), two project cards (Counting Lives and TDA) with brief descriptions and links to section hubs, recent activity feed pulling latest content across all sections (chapters, papers, posts by date)
2. Build the about page (`src/pages/about/index.astro`): bio section with positionality statement placeholder, web CV with filterable sections (education, publications, presentations, teaching), research interests linked to both project hubs, teaching section linked to learning paths, contact section (email, institutional page, ORCID, Google Scholar, GitHub links), media kit (headshot placeholder, short bio 150 words, long bio 500 words — all placeholder)
3. Build a downloadable CV component: PDF download link placeholder, structured web version using the CV data; ensure both pages are responsive and accessible

### Task 2.9a – Zotero Fetch Script & Caching - Agent_Integration

**Objective:** Build the Zotero Web API v3 fetch script with incremental updates and resilient fallback caching.
**Output:** Fetch script (`src/lib/zotero.ts`), JSON cache at `src/data/zotero-library.json`, fallback logic.
**Guidance:** User provides Zotero credentials at task start (blocking user action). Use Web API v3 REST endpoints. Build must NEVER fail due to Zotero outage. **Depends on: Task 2.1 Output by Agent_Schema_Platform**

1. User provides Zotero API key and user ID; agent creates `.env` file (gitignored) with `ZOTERO_API_KEY` and `ZOTERO_USER_ID` environment variables; add `.env.example` documenting required variables
2. Build Zotero fetch script (`src/lib/zotero.ts`): fetch full library from `api.zotero.org/users/{userID}/items` with `format=json&include=data,bib,citation`, store library version number, support incremental updates with `?since={version}` header, handle pagination (Zotero returns 100 items per page), write results to `src/data/zotero-library.json`
3. Implement fallback logic: if Zotero API unreachable at build time, use cached JSON from last successful fetch; log warning but never fail the build; add npm script `fetch:zotero` for manual refresh (incremental by default; `npm run fetch:zotero -- --force` for full fetch); verify the fetch runs as part of Astro build pipeline (custom integration or prebuild script)

### Task 2.9b – Citation Components & Bibliography Pages - Agent_Integration

**Objective:** Build citation display components, inline popovers, bibliography pages, and BibTeX generation.
**Output:** Citation popover React island, bibliography list component, bibliography pages, citation resolution.
**Guidance:** Zotero tags map to filterable categories per PRD §6.3. Components read from the JSON cache produced by Task 2.9a. **Depends on: Task 2.9a Output**

1. Build inline citation popover (React island): hover/focus on a citation reference shows the full bibliographic entry in a positioned popover; dismiss on click-outside or Escape; accessible with `role="tooltip"` and keyboard support
2. Build bibliography list component: searchable, filterable list of all Zotero items; Zotero tags map to filterable category pills (e.g., "TDA-methods", "poverty-measurement", "Scottish-thread"); BibTeX one-click copy per entry using `navigator.clipboard`
3. Create bibliography pages: Counting Lives (`/counting-lives/bibliography`) and TDA references; integrate citation resolution so that chapter and paper MDX files can reference items by Zotero key and the build resolves to full citation data
4. Test citation resolution end-to-end: verify popover renders, bibliography filters work, BibTeX copy succeeds, fallback data displays correctly when API was unavailable

### Task 2.10 – Pagefind Search Integration - Agent_Integration

**Objective:** Integrate Pagefind static search across all content.
**Output:** Build-time indexing, search UI component accessible from navigation.
**Guidance:** PRD §4.1. Keyboard shortcut Ctrl/Cmd+K. **Depends on: Task 2.6a Output by Agent_Content, Task 2.7 Output by Agent_Content**

- Install and configure Pagefind as an Astro integration; ensure it indexes all content pages (chapters, papers, modules, posts) at build time with appropriate weighting (titles > headings > body). **Implementation notes (Task 2.10):** `astro-pagefind` writes index to `/pagefind/` (no underscore — NOT `/_pagefind/`); loading Pagefind UI JS requires `<script is:inline>` (regular Astro `<script>` causes Rollup to try to statically bundle the build artifact and fail, even with `/* @vite-ignore */`); `npm run preview` is unsupported by `@astrojs/netlify` adapter — use `npx serve dist` to verify built output locally.
- Build a search UI component (accessible from navigation): search input with keyboard shortcut (Ctrl/Cmd+K), results dropdown with highlighted matches, links to matching pages; style to match design tokens
- Test search across content types; ensure mathematical notation in content doesn't break indexing; verify accessibility (keyboard navigation, screen reader announcements for result counts)

### Task 2.11 – Vitest Setup & First Component Tests - Agent_Infra

**Objective:** Establish the test framework and write initial component tests.
**Output:** Vitest configured, initial tests for key components, `test` npm script.
**Guidance:** Incremental testing introduction. Test key interactive components from Phases 1–2. **Depends on: Task 1.5 Output by Agent_Design_Templates, Task 1.6 Output by Agent_Design_System**

1. Ad-Hoc Delegation – Test framework evaluation: Confirm Vitest is the right choice for Astro 6 + React 19 testing; install `vitest`, `@testing-library/react`, `happy-dom` (or `jsdom`), configure `vitest.config.ts` for Astro project structure
2. Write initial component tests: test `<Sidenote>` renders correctly and toggles on mobile, test expandable key claims component expand/collapse behaviour, test BibTeX copy button functionality; add `test` npm script
3. Verify test pipeline runs cleanly; document testing patterns in `CONTRIBUTING.md` for future agent sessions

### Task 2.12 – User Review Checkpoint: Phase 2 - User

**Objective:** Review all content templates, MDX stubs, integrations, and search before proceeding.
**Output:** User approval or change requests for Phase 2 deliverables.
**Guidance:** Review covers: page templates (chapter, paper, module, post), MDX stub quality, Zotero integration, Pagefind search, landing/about pages. **Depends on: All Phase 2 tasks**

1. Compile review artefacts: demonstrate chapter page template with sample content, paper page template, module template, post template, Zotero bibliography page, Pagefind search; serve locally
2. User reviews: content template quality (do chapter/paper/module pages feel right?), MDX stub structure (is placeholder content realistic enough?), bibliography integration (are citations rendering?), search functionality, landing page and about page
3. Incorporate user feedback; confirm Phase 2 approval before proceeding to Phase 3

## Phase 3: Interactive Core

### Task 3.1 – Shared Interactive Infrastructure - Agent_Interactive_Core

**Objective:** Establish reusable foundations for all interactive components: React island conventions, D3/Observable Plot setup, a11y helpers, Storybook.
**Output:** Shared utility modules, responsive container, a11y infrastructure, Storybook config.
**Guidance:** All interactives will use these patterns. Colour palette from design tokens. A11y infrastructure is substantial — give it focused attention. **Depends on: Task 1.1 Output by Agent_Infra, Task 1.3 Output by Agent_Design_System**

1. Establish React island conventions for interactives: standard props interface pattern (data, dimensions, callbacks), responsive container component that handles `ResizeObserver` and passes dimensions to child visualization, `client:visible` or `client:idle` loading strategy decisions documented
2. Set up D3.js and Observable Plot: install dependencies, create shared D3 utility functions (`src/lib/viz/`): scale factories, axis helpers, colour mapping from design tokens to D3 scales, reusable tooltip component with positioning logic, Observable Plot wrappers for lighter chart types. **Note (from Task 1.3):** When building the colour mapping from tokens to D3 scales, add a dark-mode override for `--color-viz-4` in `[data-theme="dark"]` inside `tokens.css`: suggest `#D4C000` or `#C8B800` to bring the yellow above 3:1 contrast on `#1A1A1A`. Also note that custom spacing uses a non-linear scale — `--space-7` = 2rem (32px), not 1.75rem; use `--space-*` custom properties in bespoke CSS rather than high Tailwind integer utilities.
3. Create shared a11y infrastructure for interactives (`src/lib/viz/a11y/`): keyboard navigation helpers (arrow-key focus management for data points), ARIA live region component for announcing dynamic data changes, text-description toggle component (shows text summary as alternative to visual), reduced-motion detection hook with static-rendering fallback, colour-blind-safe palette enforcement reading from tokens
4. Configure Storybook for interactive component development in isolation: React + TypeScript, import design tokens and shared utilities, create a template story demonstrating the responsive container and a11y toggle patterns

### Task 3.2 – Normal Distribution Explorer (Simple D3) - Agent_Interactive_Core

**Objective:** Build the normal distribution interactive with draggable parameters and historical overlays per PRD §2.4.2.
**Output:** Working interactive at `/learn/interactives/normal-distribution-explorer`, Storybook story, tests.
**Guidance:** Simple D3/SVG version. Escalation decision at Task 3.8. **Depends on: Task 3.1 Output**

1. Build the core normal distribution rendering: D3 SVG area chart showing the PDF curve, draggable handles for mean (μ) and standard deviation (σ) parameters, real-time curve update on drag, axis labels and value display
2. Add historical overlay system: toggle-able overlays showing named distributions (Quetelet's "average man" c.1835, Galton's hereditary talent ranking c.1869, IQ distribution c.1912, benefit eligibility threshold lines c.1960s) with contextual labels explaining each overlay's political significance — use structurally complete placeholder annotations connecting to relevant Counting Lives chapters (Ch 1, 2, 10); each overlay should have a 2–3 sentence political context note
3. Implement a11y: keyboard controls for parameter adjustment (arrow keys to shift mean/σ), ARIA live region announcing current values, text description mode toggle, reduced-motion fallback (static rendering with input fields instead of drag)
4. Create the interactive manifest MDX file, add Storybook story, test responsive behaviour at desktop and tablet breakpoints; write Vitest unit test for parameter calculation logic

### Task 3.3 – Poverty Threshold Simulator (Simple D3) - Agent_Interactive_Core

**Objective:** Build the poverty threshold interactive with parameter controls and measurement method comparison per PRD §2.4.2.
**Output:** Working interactive at `/learn/interactives/poverty-threshold-simulator`, Storybook story, tests.
**Guidance:** Simple D3/SVG version. Demonstrate that thresholds are political choices. **Depends on: Task 3.1 Output**

1. Build the data model: define poverty threshold calculation logic (basket-based — Rowntree/JRF Minimum Income Standard approach; relative — 60% of median income, ~£15,000 single adult 2024; equivalised — modified OECD scale), household parameters (size 1–6, composition with child/adult mix, region), simulated population distribution; use specific UK policy parameter values rather than abstract placeholders
2. Build the core visualization: D3 SVG showing population distribution with a moveable poverty line, colour-coded regions for above/below threshold, real-time poverty rate counter, household parameter controls as form inputs
3. Add equivalisation method comparison: toggle between different measurement approaches (absolute, relative 60% median, basket-based) and see how the line and rate change; contextual annotation explaining each method's political origin
4. Implement a11y (keyboard controls, ARIA, text mode, reduced-motion), create interactive manifest MDX, Storybook story, responsive testing, Vitest tests for threshold calculations

### Task 3.4 – Research Pipeline Graph (D3 Force-Directed) - Agent_Interactive_Core

**Objective:** Build the TDA research programme pipeline visualization per PRD §2.3.2.
**Output:** Working interactive at `/tda/pipeline/`, Storybook story, tests.
**Guidance:** D3 force-directed graph. Data from paper content collection (PRD Appendix B). If Task 2.7 content stubs aren't ready, hardcode initial data from PRD Appendix B paper index and add a TODO to switch to Astro content collection queries. **Depends on: Task 3.1 Output, Task 2.7 Output by Agent_Content**

1. Build the data layer: extract paper nodes from content collection (paper_number, title, stage, status, depends_on, enables, compute) and generate edge list from dependency data; group nodes by stage (0, 1, 2, 3)
2. Build D3 force-directed graph: nodes as circles sized/coloured by stage and status, directed edges for dependencies, force simulation with stage-based x-positioning (left-to-right progression), labels, hover tooltips showing paper title and status
3. Add interactive features: click-through to paper pages, timeline overlay showing 0–48 month horizon along x-axis, computational resource indicators (CPU/GPU/Cloud icons), status colour legend
4. Implement a11y (keyboard-navigable nodes with focus indicators, ARIA descriptions, text-list fallback for screen readers), Storybook story, responsive behaviour (simplified layout on mobile), Vitest test for data extraction logic

### Task 3.5 – User Review Checkpoint: Simple Interactives - User

**Objective:** Review first three interactives and confirm approach before building more complex ones.
**Output:** User feedback and approval to proceed.
**Guidance:** Mid-phase gate. Review interaction quality, visual styling, a11y, responsiveness. **Depends on: Task 3.2, 3.3, 3.4 Output**

1. Present the three completed interactives (Normal Distribution Explorer, Poverty Threshold Simulator, Research Pipeline Graph) for user review: interaction quality, visual styling, a11y, responsiveness
2. User provides feedback and confirms approach is correct before proceeding to the more complex interactives (Five Transitions Timeline, Persistence Diagram Builder)

### Task 3.6a – Five Transitions Timeline: Data Model & Visual Rendering - Agent_Interactive_Core

**Objective:** Build the timeline data model, core horizontal rendering, and thread strand visualization.
**Output:** Working timeline rendering showing five transitions with thread strands, viewable in Storybook.
**Guidance:** Simple D3/SVG version. Centrepiece Counting Lives interactive. Escalation decision at Task 3.8. **Depends on: Task 3.1 Output, Task 2.6a Output by Agent_Content**

1. Build timeline data model: define five transitions with date ranges (1830s–1900s, 1900s–1940s, 1940s–1970s, 1970s–2000s, 2000s–present), overlapping periods, associated chapters (per PRD Appendix A), key claims, key figures; define thread data (Scottish, Gender) with chapter-level markers; define counter-mathematics thread
2. Build core timeline rendering: D3 SVG horizontal scrolling timeline (1830s–present), transition eras as overlapping horizontal bands with visual layering and distinct colours from the Counting Lives palette, era labels and date markers, smooth horizontal scroll/pan
3. Add thread strands: colour-coded Scottish and Gender thread lines woven through the timeline, counter-mathematics running thread alongside all transitions, click-through links to transition detail pages; add Storybook story for the visual artefact

### Task 3.6b – Five Transitions Timeline: Interaction & Accessibility - Agent_Interactive_Core

**Objective:** Add the interaction layer, responsive mobile layout, and comprehensive a11y to the timeline.
**Output:** Fully interactive, accessible, responsive timeline at `/counting-lives/transitions/`.
**Guidance:** Mobile requires a fundamentally different layout (vertical). Reduced-motion needs a static alternative. **Depends on: Task 3.6a Output**

1. Add interaction: hover annotations (pull-quotes and key claims visible on hover/focus for each transition era), click through to transition detail views, touch/swipe support for mobile with momentum scrolling
2. Build responsive layout: vertical timeline layout on narrow viewports (stacked eras instead of horizontal scroll), maintaining all thread strands and interactive features; test transition between horizontal and vertical at breakpoint
3. Implement a11y: keyboard navigation through timeline eras (arrow keys to advance, Enter to open detail), ARIA landmarks for each era, text-list fallback for screen readers (ordered list of eras with chapters), reduced-motion static version (no scroll animation, all eras visible); update Storybook story, write Vitest tests for data model

### Task 3.7a – Persistence Diagram Builder: Algorithm & Point Cloud Input - Agent_Interactive_Core

**Objective:** Implement the Vietoris-Rips filtration algorithm in TypeScript and the point cloud input UI.
**Output:** Working VR filtration computation with point cloud editor, unit tests for known topological features.
**Guidance:** Pure computational logic — test thoroughly before building visualization. Max ~30 points for acceptable real-time SVG performance. Consider existing npm packages (e.g., `simplicial-complex`) before implementing from scratch. **Depends on: Task 3.1 Output**

1. Build point cloud input UI: allow users to click to place 2D points on a D3 scatter plot (or load preset point clouds — circle, clusters, figure-8, random), drag to reposition, clear/reset; cap at ~30 points for performance
2. Implement Vietoris-Rips filtration algorithm in TypeScript: given a set of 2D points and a radius parameter, compute the simplicial complex (0-simplices, 1-simplices, 2-simplices) and track birth/death of homological features (H₀ connected components, H₁ loops); handle edge cases (collinear points, duplicate points, empty input)
3. Write comprehensive Vitest unit tests for the algorithm: verify known topological features (circle point cloud should produce 1 persistent H₁ feature; two clusters should produce 2 H₀ features that merge; figure-8 should produce 2 H₁ features); test performance with 30 points

### Task 3.7b – Persistence Diagram Builder: Visualization & Interaction - Agent_Interactive_Core

**Objective:** Build the dual synchronized visualization panels, interaction controls, and a11y.
**Output:** Fully interactive persistence diagram builder at `/learn/interactives/persistence-diagram-builder`, Storybook story.
**Guidance:** Dual synchronized panels. Left = point cloud with growing complex, right = persistence diagram. WebGL escalation possible at Task 3.8. **Depends on: Task 3.7a Output**

1. Build dual synchronized visualization: left panel shows point cloud with growing balls/edges as filtration parameter increases (D3 SVG circles and lines), right panel shows persistence diagram populating in real time (birth-death scatter plot with diagonal reference line)
2. Add interactive features: filtration parameter slider with play/pause animation, step-through mode, speed control; highlight correspondence between features — clicking a point in the persistence diagram highlights the corresponding feature in the complex (and vice versa)
3. Implement a11y: keyboard slider control for filtration parameter, ARIA descriptions announcing current filtration state and feature counts (e.g., "Radius 0.3: 5 components, 1 loop"), text mode describing topological features in prose, reduced-motion static version; Storybook story, responsive layout (stacked panels on mobile)

### Task 3.8 – User Review Checkpoint: Phase 3 & Escalation Decisions - User

**Objective:** Review all Phase 3 interactives and make explicit escalation decisions for each one for Phase 5.
**Output:** User approval, escalation decisions documented for all 5 interactives.
**Guidance:** Every interactive gets a conscious keep/upgrade decision. Key upgrades to consider: Persistence Diagram Builder (2D SVG vs. 3D WebGL filtration), Five Transitions Timeline (SVG vs. canvas/WebGL for smoother scrolling). **Depends on: All Phase 3 tasks**

1. Present all five completed interactives for comprehensive review: visual quality, interaction feel, pedagogical effectiveness, performance, a11y compliance
2. User makes explicit escalation decisions for each of the 5 interactives: (a) Normal Distribution Explorer — likely sufficient as SVG, confirm or flag, (b) Poverty Threshold Simulator — likely sufficient, confirm or flag, (c) Research Pipeline Graph — evaluate force layout performance, (d) Five Transitions Timeline — SVG scroll vs. canvas/WebGL for smoother experience, (e) Persistence Diagram Builder — 2D SVG vs. 3D WebGL filtration with point cloud rotation
3. Incorporate user feedback; document all escalation decisions in a Phase 3 review summary; confirm Phase 3 approval before proceeding to Phase 4

## Phase 4: Learning Paths

### Task 4.1 – Learning Hub Structure & Path Landing Pages - Agent_Design_Templates

**Objective:** Build the `/learn/` section navigation: hub index, path landing pages, interactives gallery.
**Output:** Learn hub page, path landing page template, interactives gallery page.
**Guidance:** Path cards show progress summaries. **Depends on: Task 1.5 Output**

1. Build the learn hub index page (`/learn/`): display all four learning paths as cards with title, target audience, module count, estimated time, progress summary (visual progress bar); link to path landing pages; display standalone interactives gallery link
2. Build path landing page template: show all modules in sequence with title, core concept snippet, completion status indicator (integrates with progress tracking from Task 4.2), estimated reading time; start/continue button
3. Build the standalone interactives gallery page (`/learn/interactives/`): grid of all interactive tools with titles, descriptions, complexity indicators, thumbnail/preview; each links to its standalone page

### Task 4.2 – Progress Tracking System (localStorage) - Agent_Schema_Platform

**Objective:** Build localStorage-based learning progress tracking per PRD §2.4.1.
**Output:** Progress React context/hook, UI integration in module and path pages.
**Guidance:** No login required. Must handle SSR gracefully (client-only hydration). **Depends on: Task 2.4 Output by Agent_Design_Templates**

1. Design progress data model: define localStorage schema (path completion state per path, module completion per module, last visited module, timestamps), versioning for future migration, storage key naming convention
2. Build React context/hook (`useProgress`): read/write progress from localStorage, provide methods for marking module complete/incomplete, calculating path percentage, getting current module; handle SSR (Astro) gracefully with client-only hydration
3. Integrate progress UI into Module Layout: mark-complete button at end of each module, path progress bar on path landing page and module navigation, visual indicators (completed/current/upcoming) in module list
4. Test progress tracking: verify localStorage persistence across page loads, test edge cases (cleared storage, multiple paths), verify SSR doesn't break (no `window` access during build), add Vitest tests for progress logic

### Task 4.3 – Path 1 MDX Stubs: Topology for Social Scientists - Agent_Content

**Objective:** Create 8 structurally complete module MDX files for Path 1 per PRD §2.4.1.
**Output:** 8 MDX files in `src/content/learn/topology-social-scientists/`.
**Guidance:** PRD Path 1 table for module data. ~1,000 words per module structured as: (a) hook/motivation paragraph, (b) core concept explanation 500–600 words, (c) interactive context paragraph explaining what the embedded interactive demonstrates, (d) connections sidebar data linking to related chapters/papers/modules, (e) 2–3 “check your understanding” reflection questions. Reference Phase 3 interactives. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 2.4 Output by Agent_Design_Templates**

- Create modules 1–2 (What is a shape?, Point clouds and distance): frontmatter (path, module_number, core_concept, interactive_slug, connections, check_understanding), prose placeholder ~1,000 words each, interactive element reference, 2–3 reflection questions, connections to related TDA papers and methods
- Create modules 3–4 (Simplicial complexes, Homology: counting holes): increasing mathematical depth, LaTeX placeholder for formal definitions, interactive slots for filtration and homology count tools
- Create modules 5–6 (Persistence diagrams, From diagrams to statistics): reference the Persistence Diagram Builder interactive, include Wasserstein distance and landscape discussion placeholders, statistical interpretation connections
- Create modules 7–8 (The Markov memory ladder, Reading the results): connect to Paper 1, include placeholder walkthrough of results, reflection questions on methodology and findings

### Task 4.4 – Path 2 MDX Stubs: Mathematics of Poverty - Agent_Content

**Objective:** Create 8 structurally complete module MDX files for Path 2 per PRD §2.4.1.
**Output:** 8 MDX files in `src/content/learn/mathematics-of-poverty/`.
**Guidance:** PRD Path 2 table for module data. ~1,000 words per module structured as: (a) hook/motivation paragraph, (b) core concept explanation 500–600 words, (c) interactive context paragraph explaining what the embedded interactive demonstrates, (d) connections sidebar data linking to related chapters/papers/modules, (e) 2–3 “check your understanding” reflection questions. Reference Phase 3 interactives. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 2.4 Output by Agent_Design_Templates**

- Create modules 1–2 (Drawing the line, The average person): frontmatter, prose placeholder ~1,000 words each, references to Poverty Threshold Simulator and Normal Distribution Explorer interactives, connections to Counting Lives chapters 1 and 4, reflection questions
- Create modules 3–4 (Counting what counts, The welfare formula): reference Orshansky's thresholds and Beveridge, interactive slots for comparison tools, connections to chapters 3–4
- Create modules 5–6 (Optimisation and control, The score): increasing technical depth, logistic regression and algorithmic scoring contexts, connections to chapters 5–6 and 10–12
- Create modules 7–8 (The black box, Counter-mathematics): neural networks and data justice, reference chapters 14–17, interactive slots for classifier training and participatory measurement tools

### Task 4.5 – Embed Phase 3 Interactives in Learning Modules - Agent_Interactive_Core

**Objective:** Integrate completed Phase 3 interactives into relevant learning path modules.
**Output:** Interactives embedded in appropriate module MDX files with correct imports and configuration.
**Guidance:** Match interactive to module per PRD tables. **Depends on: Task 3.2, 3.3, 3.4, 3.7b Output, Task 4.3, 4.4 Output by Agent_Content**

- Embed Normal Distribution Explorer in Path 1 Module 2 (Point clouds) and Path 2 Module 2 (The average person); embed Poverty Threshold Simulator in Path 2 Module 1 (Drawing the line)
- Embed Persistence Diagram Builder in Path 1 Module 5 (Persistence diagrams); embed Research Pipeline Graph in a TDA overview context
- Verify all embedded interactives render correctly within module layout; test responsive behaviour and a11y within the module context

### Task 4.6 – Glossary Foundation - Agent_Integration

**Objective:** Build the shared glossary with dual definitions spanning both projects per PRD §7.2.
**Output:** Glossary data model, searchable glossary page, inline glossary tooltip component.
**Guidance:** Terms have dual definitions (TDA + Counting Lives). 20–30 initial terms. **Depends on: Task 2.6a Output by Agent_Content, Task 2.7 Output by Agent_Content**

1. Design glossary data model: YAML or JSON data file for glossary entries, each with term, slug, definitions array (each definition has domain — "TDA" or "Counting Lives" or "Shared" — and definition text), related terms, linked content (chapters, papers, modules)
2. Build glossary page (`/learn/glossary/`): alphabetical listing with search/filter, domain filter (show TDA terms, Counting Lives terms, or both), click to expand full entry with dual definitions displayed side-by-side where applicable; populate with 20–30 key initial terms as placeholder
3. Build inline glossary tooltip component: when a glossary term appears in prose, optionally render as a link with hover tooltip showing the brief definition; integrate with MDX rendering pipeline

### Task 4.7 – Reading Lists & Curated Resources - Agent_Content

**Objective:** Create curated reading lists by topic and level per PRD §2.4.
**Output:** Reading list data model, page template, 4–6 placeholder lists.
**Guidance:** Organized by topic and level. Connect to Zotero library. **Depends on: Task 2.9b Output by Agent_Integration**

- Create reading list data model and page template at `/learn/reading-lists/`: lists organized by topic (topology, poverty measurement, data justice, TDA methods) and level (introductory, intermediate, advanced)
- Create 4–6 placeholder reading lists with annotated entries: title, author, year, brief annotation, difficulty level, relevance to site content (which chapters/papers/paths it connects to); reference Zotero library integration where applicable
- Build reading list page with filtering by topic and level, clean typography for annotations

### Task 4.8 – User Review Checkpoint: Phase 4 - User

**Objective:** Review learning path infrastructure, module content, progress tracking, glossary.
**Output:** User approval or change requests for Phase 4 deliverables.
**Guidance:** Review covers: learning hub UX, path landing pages, module with embedded interactive, progress tracking, glossary, reading lists. **Depends on: All Phase 4 tasks**

1. Compile review artefacts: demonstrate learning hub, path landing pages, sample module with embedded interactive, progress tracking flow (mark complete, see progress bar update), glossary page, reading lists
2. User reviews: learning path UX, progress tracking behaviour, module structure quality, glossary usefulness, embedded interactive quality within modules
3. Incorporate feedback; confirm Phase 4 approval before proceeding to Phase 5

## Phase 5: Advanced Interactives & Paths

### Task 5.1 – Escalated Interactive Upgrades (Conditional) - Agent_Interactive_Advanced

**Objective:** Upgrade Phase 3 interactives to WebGL/3D/canvas as per user escalation decisions from Task 3.8.
**Output:** Upgraded interactive versions (or no-op if no escalations requested).
**Guidance:** Progressive enhancement — keep SVG fallback. Performance target <3s TTI. **Depends on: Task 3.8 Output**

1. Review escalation decisions documented in Task 3.8; identify which interactives require upgrade and the specific target (WebGL, canvas, 3D)
2. For each escalated interactive: build the upgraded version alongside the simple version (progressive enhancement, not replacement), implement Three.js/R3F or canvas rendering as appropriate, maintain all existing a11y features with fallback to SVG version for reduced-motion or unsupported browsers
3. Test upgraded interactives: verify performance targets (PRD §4.4 — <3s TTI on broadband), compare with simple versions, update Storybook stories; if no escalations were requested, this task is complete with zero work

### Task 5.2 – Mapper Parameter Lab - Agent_Interactive_Advanced

**Objective:** Build the Mapper interactive per PRD §2.4.2 with adjustable cover, overlap, and clustering parameters.
**Output:** Working interactive at `/learn/interactives/mapper-parameter-lab`, Storybook story, tests.
**Guidance:** Simplified Mapper algorithm in TypeScript. D3 force-directed graph output. **Depends on: Task 3.1 Output**

1. Implement a simplified Mapper algorithm in TypeScript: given a point cloud, a filter function (e.g., PCA projection), cover parameters (resolution, overlap percentage), and a clustering method (single linkage), compute the Mapper graph (nodes = cluster groups, edges = shared points)
2. Build the parameter control panel: sliders for cover resolution, overlap percentage, filter function selector (PCA, density, eccentricity), clustering threshold; all controls with real-time updates
3. Build the Mapper graph visualization: D3 force-directed layout of the Mapper graph with nodes sized by cluster membership count, edges weighted by shared points, colour by filter function value; load preset datasets (synthetic circles, blobs, or anonymised/synthetic trajectory data)
4. Implement a11y (keyboard parameter controls, ARIA descriptions, text-list fallback), Storybook story, responsive, Vitest tests for Mapper algorithm

### Task 5.3 – Filtration Playground - Agent_Interactive_Advanced

**Objective:** Build the VR filtration step-through interactive with simplicial complex visualization.
**Output:** Working interactive at `/learn/interactives/filtration-playground`, Storybook story, tests.
**Guidance:** Extends Phase 3 persistence diagram work. Focus on complex construction visualization. **Depends on: Task 3.1 Output, Task 3.7a Output**

1. Build point cloud editor: click-to-place, drag-to-move, preset shapes; density/distribution controls; integrate with or extend the Phase 3 point cloud input component
2. Build step-through filtration visualization: at each radius increment, show balls growing around points, edges forming (1-simplices as lines), triangles filling (2-simplices as shaded triangles); step-by-step mode with forward/back, continuous animation mode with speed control
3. Add educational annotations: at each step, display Betti numbers (β₀, β₁, β₂), highlight births and deaths of homological features with explanatory text, link to relevant learning path modules
4. Implement a11y, Storybook story, responsive layout, Vitest tests; ensure performance is acceptable for up to ~50 points

### Task 5.4 – Benefit Taper Calculator - Agent_Interactive_Advanced

**Objective:** Build the Universal Credit taper rate interactive per PRD §2.4.2.
**Output:** Working interactive at `/learn/interactives/benefit-taper-calculator`, Storybook story, tests.
**Guidance:** Realistic UK policy parameters. Show poverty traps and effective marginal tax rates. **Depends on: Task 3.1 Output**

1. Build Universal Credit data model: taper rate (currently 55%), work allowances, housing element calculation, childcare element, sanctions regime (levels and durations); use realistic UK policy parameters
2. Build core visualization: D3 line/area chart showing income vs. benefit withdrawal, effective marginal tax rate curve, net income curve; input controls for earnings level, household composition, housing costs
3. Add poverty trap visualization: highlight income ranges where effective marginal rates exceed 60%, show how sanctions create cliff edges; add comparison mode showing historical parameter changes (pre-2024 vs. current)
4. Implement a11y, Storybook story, responsive, Vitest tests for calculation logic; contextual annotations linking to relevant Counting Lives chapters

### Task 5.5a – Pyodide Feasibility Research - Agent_Interactive_Advanced

**Objective:** Evaluate Pyodide for in-browser TDA computation and produce a design decision record.
**Output:** Feasibility report documenting: available TDA libraries in Pyodide, performance benchmarks, limitations, recommended fallback strategy.
**Guidance:** Ad-hoc research task. The outcome gates Task 5.5b implementation. If Ripser/scikit-tda aren't available via micropip, document alternatives (giotto-tda, pre-computed results, server-side API). **Depends on: Task 3.1 Output**

1. Ad-Hoc Delegation – Pyodide feasibility: Test Pyodide loading time, determine which TDA libraries are available as WASM packages via micropip (Ripser, scikit-tda, giotto-tda), benchmark a small persistence computation (~20 points) for acceptable performance (<5s)
2. Identify limitations: memory constraints, missing C extensions, numerical precision issues; determine max point cloud size for real-time computation
3. Recommend implementation strategy: (a) full Pyodide with TDA libs if available, (b) Pyodide with pre-computed heavy results and live light computations, (c) fallback to pre-computed-only with no live Python if Pyodide TDA is infeasible; document decision for user review before proceeding

### Task 5.5b – TDA Results Explorer (Pre-Computed) - Agent_Interactive_Advanced

**Objective:** Build the pre-computed TDA results explorer: a Python build script that generates static JSON assets via native ripser, and a React component that displays the results interactively.
**Output:** `scripts/compute-tda.py`, JSON assets in `src/data/tda/`, `TDAResultsExplorer` React component.
**Guidance:** Strategy (c) — pre-computed only. Pyodide is NOT used (no WASM wheels exist for ripser/gudhi/giotto-tda; cold-load 10–18s violates UX target). No CodeMirror, no micropip. Browser runtime: React + D3 only. **Depends on: Task 5.5a Output**

1. Create `scripts/compute-tda.py`: native ripser script generating JSON assets for 4 preset point clouds (circle, two-clusters, figure-eight, random-3d) to `src/data/tda/`; JSON schema: `{ metadata, point_cloud, diagrams: { H0: [{birth, death}], H1: [{birth, death}] } }`
2. Build `TDAResultsExplorer` React island: prop `presetId` selects JSON asset; left panel = D3 SVG point cloud scatter; right panel = D3 SVG persistence diagram (reuse PersistenceDiagram interface from PersistenceDiagramBuilder); filtration radius slider highlights which features are born/alive at current radius (read from pre-computed data — no live computation); full a11y (AriaLiveRegion, TextDescriptionToggle, useReducedMotion)
3. Register slug `tda-results-explorer` in `[slug].astro`; MDX manifest; TypeScript JSON schema type in `src/lib/tda/types.ts`; Storybook stories; Vitest tests for JSON schema validation helper

### Task 5.6 – Learn Module Dynamic Route - Agent_Design_Templates

**Objective:** Build the dynamic page route `/learn/[path]/[module]` so all learning module pages resolve instead of returning 404.
**Output:** `src/pages/learn/[path]/[module].astro` with `getStaticPaths()` generating all path/module combinations, rendered via `ModuleLayout.astro`.
**Guidance:** As of Phase 4, all `MarkCompleteButton`, `PathModuleList` CTA links, and progress tracking target `/learn/{pathSlug}/{moduleNumber}` and return 404. Module content MDX files are flat in `src/content/learn/` named `path1-module-{N}.mdx`, `path2-module-{N}.mdx`, etc. The path-to-file-prefix mapping must be derived from `src/data/learnPaths.ts`. Module identifier in the progress system is `String(module_number)`. **Depends on: Task 2.4 Output by Agent_Design_Templates, Task 4.2 Output by Agent_Schema_Platform**

1. Read `src/data/learnPaths.ts` to understand the `LearnPath` and `LearnModule` types; map each path `slug` to its MDX filename prefix (e.g., `topology-social-scientists` → `path1-module-{N}`) and confirm module number range per path
2. Create `src/pages/learn/[path]/[module].astro`: implement `getStaticPaths()` iterating all paths and modules from `learnPaths.ts`, generating one route entry per module with `params: { path: pathSlug, module: String(module_number) }` and passing the MDX content entry and path data as props
3. Build the page body: query the correct MDX entry using path/module params, render using `ModuleLayout.astro` with full frontmatter; ensure `MarkCompleteButton` and `PathModuleList` navigation components receive the correct `pathSlug` and `moduleNumber` props
4. Run `npm run build` to confirm all routes generate without errors; run `npm test` to verify the existing 140 tests still pass; spot-check at least two module URLs in the built output to confirm correct content renders

### Task 5.7 – Path 4 MDX Stubs: TDA for Practitioners - Agent_Content

**Objective:** Create 12 structurally complete module MDX files for Path 4 per PRD §2.4.1.
**Output:** 12 MDX files in `src/content/learn/` named `path4-module-{N}.mdx` (flat, not in a subdirectory).
**Guidance:** Graduate-level content. PRD Path 4 table. ~1,200 words per module structured as: (a) hook/motivation, (b) core concept 600–800 words with LaTeX, (c) interactive/code runner context, (d) connections, (e) reflection questions. Include Python code block placeholders with `{/* Pyodide code runner slot */}` comments — actual Pyodide integration happens in Task 5.8, not here. `path` field must be `'tda-practitioners'`. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 2.4 Output by Agent_Design_Templates**

- Create modules 1–3 (Setup and first computation, Point cloud preprocessing, VR persistent homology): frontmatter, prose placeholder ~1,200 words each, Python code blocks referencing Pyodide integration, interactive slots for code runner and step-through filtration
- Create modules 4–6 (Reading persistence diagrams, Null models/hypothesis testing, Mapper): reference Persistence Diagram Builder and Mapper Parameter Lab interactives, statistical interpretation focus, connections to papers 1–2
- Create modules 7–9 (Zigzag persistence, Multi-parameter persistence, Wasserstein/landscape distances): advanced TDA methods, LaTeX for formal definitions, connections to papers 3–4, interactive slots for bifiltration explorer and distance calculator
- Create modules 10–12 (TDA to deep learning, Fairness and topology, Designing your own TDA study): connect to papers 7–10, topological deep learning placeholders, fairness audit pipeline reference, checklist generator interactive slot

### Task 5.8 – Embed Advanced Interactives in Paths & Content - Agent_Interactive_Advanced

**Objective:** Integrate Phase 5 interactives into relevant learning modules and content pages.
**Output:** All Phase 5 interactives properly embedded in appropriate pages.
**Guidance:** Match interactive to content per PRD tables. Module pages must exist before embedding (Task 5.6). **Depends on: Task 5.2, 5.3, 5.4, 5.5b Output, Task 5.6 Output, Task 5.7 Output by Agent_Content**

- Embed Mapper Parameter Lab in Path 4 Module 6 and TDA methods/mapper page; embed Filtration Playground in Path 1 Module 3 and Path 4 Module 3
- Embed Benefit Taper Calculator in Path 2 Module 4 and relevant Counting Lives chapter pages; embed Pyodide code runner in Path 4 modules 1–12 where code execution is specified
- Verify all embeddings render correctly; test responsive and a11y within page context

### Task 5.9 – Playwright Integration Testing Setup - Agent_Infra

**Objective:** Set up Playwright for end-to-end testing of interactives and page flows.
**Output:** Playwright configured, integration tests for key interactives and progress tracking.
**Guidance:** Incremental testing juncture. Test interactive flows and cross-page behaviour. **Depends on: Task 3.2, 3.7b Output by Agent_Interactive_Core, Task 4.2 Output by Agent_Schema_Platform**

1. Install Playwright and configure for the Astro project; set up test runner, browser targets (Chromium, Firefox, WebKit), create npm script `test:e2e`
2. Write integration tests for key interactives: test Normal Distribution Explorer drag interaction, test Persistence Diagram Builder point-to-diagram flow, test Research Pipeline Graph click-through, test progress tracking persistence across page navigation
3. Verify all tests pass; integrate into CI-ready scripts (even if CI not yet configured); document Playwright testing patterns in `CONTRIBUTING.md`

### Task 5.10 – User Review Checkpoint: Phase 5 - User

**Objective:** Review advanced interactives, Pyodide, TDA practitioners path, module routes, integration tests.
**Output:** User approval or change requests for Phase 5 deliverables.
**Guidance:** Key areas: advanced interactive quality, Pyodide performance, Path 4 structure, module route functionality, test coverage. **Depends on: All Phase 5 tasks**

1. Compile review artefacts: demonstrate module route (click a module link from a path landing page, verify it loads), Mapper Parameter Lab, Filtration Playground, Benefit Taper Calculator, Pyodide code runner, any escalated interactive upgrades, TDA Practitioners path modules, Playwright test results
2. User reviews: advanced interactive quality, Pyodide performance (acceptable for toy examples?), Path 4 module structure, integration test coverage
3. Incorporate feedback; confirm Phase 5 approval before proceeding to Phase 6

## Phase 6: Polish & Launch

### Task 6.1 – Path 3 MDX Stubs: Data Justice Foundations - Agent_Content

**Objective:** Create 6 structurally complete module MDX files for Path 3 per PRD §2.4.1.
**Output:** 6 MDX files in `src/content/learn/data-justice/`.
**Guidance:** Target audience: activists, policy workers, community researchers. PRD Path 3 table. ~1,000 words per module. Tonal guidance: use narrative style, case studies, and plain-language explanations. Avoid LaTeX except where explaining how data categories are constructed. Connect to lived-experience examples from Counting Lives chapters. Structure: (a) real-world scenario hook, (b) concept explanation in plain language, (c) interactive context, (d) connections to chapters, (e) reflection questions framed as practical/ethical considerations. **Schema note (from Task 2.1):** The `learn-modules` `path` enum value for this path is `'data-justice'` (not `'data-justice-foundations'`). Use `path: data-justice` in all module frontmatter. **Depends on: Task 2.1 Output by Agent_Schema_Platform, Task 2.4 Output by Agent_Design_Templates**

- Create modules 1–2 (Who counts?, Whose categories?): frontmatter, prose placeholder ~1,000 words each, interactive slots for missing data explorer and category builder, connections to Counting Lives chapters 14–15
- Create modules 3–4 (The view from above, Indigenous data sovereignty): Scott's legibility thesis and Kukutai's CARE principles, connections to counter-mathematics thread, interactive slots
- Create modules 5–6 (Feminist data gaps, Algorithmic accountability): D'Ignazio and Klein references, Eubanks digital poorhouse, connections to chapters 10–13, interactive slots for gender gap calculator and algorithm audit

### Task 6.1a – Learning Path Hub Registration & Chapter Route - Agent_Infra

**Objective:** Register Paths 3 and 4 in `learnPaths.ts`, build the individual counting-lives chapter route, and flesh out the empty `/tda/` and `/counting-lives/` section hub pages.
**Output:** All four learning paths visible on `/learn/` hub; `/counting-lives/chapters/[slug]` route rendering chapter MDX files; `/tda/` and `/counting-lives/` hub pages with real section structure.
**Guidance:** `learnPaths.ts` currently registers Paths 1 and 2 only. Path 3 (`data-justice`) stubs land in Task 6.1; Path 4 (`tda-practitioners`, 14 modules) stubs already exist in `src/content/learn/path4-module-*.mdx`. The chapter-slug route should use `getCollection('chapters')` and render via `ChapterLayout.astro`. The ch-16.mdx callout (no US interactive yet) is already in place but has no route — this task creates it. **Hub pages:** `src/pages/tda/index.astro` and `src/pages/counting-lives/index.astro` are currently empty stubs (`// TODO: Implement`). Build them out as proper section hub pages: TDA hub aggregates 10 paper cards (title, status badge, stage), links to `/tda/pipeline/` and methods/data pages; Counting Lives hub aggregates 18 chapter cards (title, part, transition), links to `/counting-lives/overview/` and bibliography. Both hubs should pull from their respective content collections. Note: Path 4 `module_number` frontmatter runs 1–14 and filenames are `path4-module-{N}.mdx`; `moduleEntryIdToHref()` in ModuleLayout.astro handles navigation correctly. **Depends on: Task 6.1 Output (Path 3 stubs must exist before Path 3 is registered)**

- Register Path 3 (`data-justice`, 6 modules) in `learnPaths.ts` with correct slugs, titles, and coreConcepts matching MDX frontmatter
- Register Path 4 (`tda-practitioners`, 14 modules) in `learnPaths.ts` — verify all 14 module slugs, `module_number` values, and `path` enum match MDX frontmatter
- Build `src/pages/counting-lives/chapters/[slug].astro` dynamic route: `getStaticPaths` from `chapters` collection, render via `ChapterLayout.astro`, verify all 18 chapter slugs generate pages
- Build out `/tda/index.astro` and `/counting-lives/index.astro` as section hub pages pulling from content collections
- Verify `/learn/` hub now shows all four paths with correct progress bars, and `/counting-lives/` bibliography links to chapter pages

### Task 6.1b – Phase 6 Interactive Backlog Delivery - Agent_Interactive_Advanced

**Objective:** Build the six new interactives and one enhancement identified during the Phase 5 QA sprint.
**Output:** Six new interactive components registered in ModuleLayout.astro and wired to their module MDX files; BenefitTaperCalculator enhanced with adjustable taper slider and fiscal cost readout.
**Guidance:** Full specs for each item are in `.apm/Handover_Task_5_10_QA_Sprint.md` under "Phase 6 Interactive Backlog". Follow established patterns: Okabe-Ito colour scale (`getVizColorScale()` + `d3.scaleQuantize`), `client:visible`, `TextDescriptionToggle`, `AriaLiveRegion`, Vitest unit tests for all algorithmic logic, Storybook stories using `React.createElement`. Each component needs an MDX manifest in `src/content/interactives/`. **Depends on: Task 5.x Output (all Phase 5 infrastructure must be in place)**

**PH6-I1 — Point Cloud & Distance Explorer** (`path1-module-2.mdx`): 2D scatter, ε-ball expansion on click, Euclidean vs Manhattan metric toggle, pairwise distance matrix. Wire to `path1-module-2.mdx` with `interactive_slug: 'point-cloud-explorer'`.
**PH6-I2 — Simplex/Homology Editor** (`path1-module-4.mdx`): SVG simplicial complex, click edges/triangles to add/remove, live β₀/β₁ readout. Wire to `path1-module-4.mdx` with `interactive_slug: 'homology-editor'`.
**PH6-I3 — Equivalisation Scale Comparator** (`path2-module-4.mdx`): Three OECD scale variants (original, modified, McClements), household composition sliders, poverty rates side by side. Wire to `path2-module-4.mdx` with `interactive_slug: 'equivalisation-comparator'`.
**PH6-I4 — Decision Threshold Explorer** (`path2-module-6.mdx`): Logistic regression on synthetic welfare data, threshold τ slider, confusion matrix and FPR/FNR by sub-group. Wire to `path2-module-6.mdx` with `interactive_slug: 'scoring-threshold-explorer'`.
**PH6-I5 — SHAP Instability Demonstrator** (`path2-module-7.mdx`): Small neural network on synthetic welfare data, feature perturbation sliders, SHAP values updating while score stays constant. Wire to `path2-module-7.mdx` with `interactive_slug: 'shap-instability-demo'`.
**PH6-I6 — Participatory vs Official Barcode Comparator** (`path2-module-8.mdx`): Two PersistenceDiagramBuilder-style panels, Wasserstein distance live readout, dimension toggles. Wire to `path2-module-8.mdx` with `interactive_slug: 'participatory-barcode-comparator'`.
**PH6-E1 — BenefitTaperCalculator Enhancement**: Add adjustable taper rate slider (40%–75%), remove hard-coded 55%/63% toggle (or make 63% a reference line only), add approximate fiscal cost readout relative to 55% baseline. Update `path2-module-5.mdx` "Using the Interactive" section to reference new features.

### Task 6.2 – Complete Remaining Content Pages - Agent_Content

**Objective:** Audit and fill all remaining content gaps across all sections, incorporating the author's real content from `content-source/`.
**Output:** All content pages structurally complete with real content where available; glossary expanded to 50+ terms.
**Guidance:** Real source content lives in `content-source/` at the project root. **Actual structure (confirmed — supersedes all prior descriptions):** `Index.md` files are EMPTY — ignore them. The outline document for each chapter is the file named `Ch{NN} - {Title}.md` at the top level of the chapter folder (e.g. `Ch01 - The Statistician's Stomach.md`). Section draft files live in `sections/` subdirectories. **Coverage:** All 20 chapters have outline files (Ch00 Introduction, Ch01–Ch17, Ch18 Conclusion). Section-level drafts exist for Ch01–Ch07 only (Ch08–Ch18 have empty `sections/` directories or none). For each chapter, read the outline `.md` first; if `sections/` contains files, read them for the actual draft prose. Papers: `content-source/tda/{Paper folder}/drafts/v{N}-{YYYY-MM}.md` — take the highest version. Paper folders: `P01-VR-PH-Core` (submitted), `P02-Mapper`, `P03-Zigzag`, `P04-Multipers-Poverty`. Agent instructions: read outline first; supplement with section drafts where present; ignore `Index.md` entirely. **Critical authoring rules (from previous phases):** (1) No en-dashes in YAML `title:` fields; (2) no bare `{` or `}` in MDX prose outside JSX/math; (3) apostrophes in single-quoted YAML strings must be escaped as `''`; (4) `status: 'drafting'` for in-progress content — never `'stub'`; (5) `status: 'submitted'` for Paper 1; (6) `check_understanding` items use `{question, answer}` — NOT `{question, guidance}`; (7) `connections` object requires all four arrays: `chapters`, `papers`, `modules`, `methods`. Survey all sections for structural gaps. Priority items from QA sprint: PH6-W1 and PH6-W2 (Path 1 prose stubs), and Path 4 full prose (14 modules currently at `status: 'drafting'`). **Depends on: All Phase 2 and Phase 4 content tasks, Task 6.1a Output (Path 4 hub registration)**

1. Audit all content pages: compile gap list. Priority: `path1-module-7.mdx` (PH6-W1), `path1-module-8.mdx` (PH6-W2), all 14 `path4-module-*.mdx`, and all chapter/paper MDX stubs
2. **Chapters (all 18):** Read `content-source/counting-lives/ch-{NN}-outline.md` for all chapters; read `content-source/counting-lives/ch-{NN}-draft.md` for chapters 1–10 where present. Replace the placeholder `synopsis` prose in each chapter MDX with the real content, adapted for the web (add subheadings, sidenotes where appropriate). Do NOT overwrite frontmatter fields unless correcting an error. Set `status: 'published'` for chapters with full drafts; `status: 'drafting'` for outline-only.
3. **TDA Papers:** Read `content-source/tda/paper-{NN}-draft.md` for papers 1–4. Replace abstract, plain_summary, and key_findings prose with real content. Set Paper 1 `status: 'submitted'`. Papers 2–4 as appropriate to their stage.
4. **PH6-W1:** Write full prose for `path1-module-7.mdx` — introduce Mapper to non-mathematical readers: cover→cluster→nerve graph, filter function intuition, how to read a Mapper graph (node=cluster, edge=overlap, size=count), one concrete social-science example. No algebra. "Using the Interactive: Mapper Parameter Lab" section to follow main text.
5. **PH6-W2:** Write full prose for `path1-module-8.mdx` — three TDA case studies: (1) voting-pattern geometry, (2) health-inequality clustering, (3) poverty-trajectory topology. Each: what conventional analysis missed + what TDA found. No technical background required. Path 1 capstone module.
6. Complete Path 4 prose: expand all 14 `path4-module-*.mdx` stubs from ~500-word drafts to full graduate-level modules (~1,200–1,500 words each). Python code blocks currently commented out remain as placeholders pending Pyodide Phase 7 decision.
7. Complete all figure/biographical card stubs, transition detail pages, thread annotations, expand glossary to 50+ terms. Ensure all section hub pages aggregate child content correctly.

### Task 6.3 – Cross-Project Connections & "Two Lenses" Feature - Agent_Integration

**Objective:** Build bidirectional linking between projects and the "Two Lenses" toggle per PRD §7.
**Output:** Bidirectional link components, interlude↔method connections, "Two Lenses" toggle.
**Guidance:** PRD §7.1–7.3. The site's intellectual coherence depends on visible cross-project navigation. **Depends on: Task 2.6a Output by Agent_Content, Task 2.7 Output by Agent_Content**

1. Build bidirectional link resolution: using frontmatter data (related_tda_papers, methods, interludes), generate "Related in TDA" sections on chapter pages and "Related in Counting Lives" sections on paper/methods pages; render as linked cards with title and brief description
2. Implement interlude↔method bidirectional links: each Mathematical Interlude page links to TDA methods that formalize the concept; each methods page links back to the chapters examining its political stakes
3. Build "Two Lenses" toggle component (React island): on key concept pages (e.g., logistic regression), provide "Read as Mathematics" / "Read as Politics" toggle or split view; content rendered from the same MDX with conditional sections
4. Verify all cross-project connections render correctly; test navigation flow between projects (can a user follow a thread from chapter → interlude → method → paper seamlessly?); ensure links are valid

### Task 6.4 – Dark Mode Toggle & Palette Tuning - Agent_Design_System

**Objective:** Build the dark mode UI toggle and tune dark mode colours for all components.
**Output:** Toggle component in navigation, tuned dark mode palette, localStorage persistence.
**Guidance:** Tokens already support dark mode (Phase 1). This task adds the toggle UI and visual tuning. **Depends on: Task 1.3 Output**

1. Build dark mode toggle component: accessible toggle button in navigation (sun/moon icon or similar), persist preference in localStorage, respect system preference via `prefers-color-scheme` as default, toggle `data-theme` attribute on `<html>`, no flash of incorrect theme on load (inline script in `<head>`)
2. Tune dark mode colour palette: review all tokens in dark mode context, ensure WCAG AA contrast across all component types (prose, cards, navigation, interactive backgrounds, code blocks, KaTeX rendering), adjust any tokens that don't work well in dark mode
3. Test dark mode comprehensively: verify all page types (chapter, paper, module, post, interactive, landing, about), verify interactives render correctly in dark mode (D3 colours pick up token changes), verify print stylesheet ignores dark mode

### Task 6.5 – Accessibility Audit & Remediation - Agent_Design_System

**Objective:** Comprehensive site-wide a11y audit per PRD §4.5.
**Output:** Audit report, all issues remediated, WCAG 2.1 AA compliance confirmed.
**Guidance:** Automated (axe-core via Playwright) + manual audit. Both light and dark modes. **Depends on: Task 6.4 Output**

1. Run automated a11y audit using axe-core (via Playwright): scan all major page types, compile report of violations by severity
2. Manual audit checklist: keyboard navigation through all interactive components, screen reader testing of KaTeX output and interactive state announcements, colour contrast verification in both light and dark modes, touch target size verification (44×44px minimum), reduced-motion mode verification
3. Remediate all identified issues: fix colour contrast failures, add missing ARIA labels, fix keyboard traps, add missing skip links or landmarks, ensure all images have alt text
4. Re-run automated audit to confirm all issues resolved; document remaining known issues (if any) with rationale

### Task 6.6 – Performance Optimization - Agent_Infra

**Objective:** Meet all PRD §4.4 performance targets.
**Output:** Lighthouse scores meeting targets, optimized bundle, documented exceptions.
**Guidance:** Targets: ≥95 prose, ≥80 interactive, LCP <1.5s, <50KB JS on prose pages. **Depends on: All prior phases**

1. Run Lighthouse audits on representative pages (prose chapter, paper with interactive, learning module, landing page); identify performance gaps against PRD targets
2. Optimize asset loading: verify zero JS on prose pages (Astro islands only hydrate when needed), lazy-load interactive components with `client:visible`, optimize font loading (subset, `font-display: swap`), optimize images (if any — use Astro image optimization)
3. Optimize interactive loading: code-split D3 and Three.js per-interactive (not bundled into main), tree-shake unused D3 modules, defer Pyodide loading, ensure Storybook and dev-only code is excluded from production builds
4. Re-run Lighthouse audits; verify all PRD §4.4 targets met; document any exceptions with rationale (e.g., interactive pages with Pyodide may exceed 50KB JS target)

### Task 6.7 – SEO, Open Graph & Structured Data - Agent_Integration

**Objective:** Implement full discoverability per PRD §8.
**Output:** OG/Twitter cards, JSON-LD, sitemap, RSS, Google Scholar metadata.
**Guidance:** PRD §8. ScholarlyArticle for papers, Person for about, Course for learning paths. **Depends on: Task 1.5 Output by Agent_Design_Templates**

1. Build SEO component integrated into BaseLayout: generate Open Graph and Twitter Card meta tags for every page type (chapter, paper, module, post, interactive) with appropriate titles, descriptions, and images (placeholder OG images)
2. Add JSON-LD structured data: ScholarlyArticle for paper pages, Person for about page (with ORCID link), Course/LearningResource for learning paths, WebSite for site-level search; validate with Google's Rich Results Test
3. Configure sitemap generation (Astro built-in `@astrojs/sitemap`), verify RSS feed from writing section works correctly, add ORCID integration linking publications to profile
4. Optimize for Google Scholar indexing: ensure paper pages have correct meta tags (`citation_title`, `citation_author`, `citation_publication_date`, `citation_pdf_url`); verify crawlability

### Task 6.8 – Netlify Deployment Configuration - Agent_Infra

**Objective:** Configure and verify Netlify deployment for zktheory.org.
**Output:** `netlify.toml`, production deployment, deploy previews working.
**Guidance:** User connects repo to Netlify. Configure security headers, caching, redirects. **Depends on: Task 6.6 Output**

1. Create `netlify.toml` with Astro build configuration: build command, publish directory, Astro Netlify adapter settings, redirect rules (if needed), header configuration (security headers, caching)
2. User connects GitHub repo to Netlify, configures environment variables (ZOTERO_API_KEY, ZOTERO_USER_ID), enables deploy previews per branch
3. Verify production build deploys correctly to zktheory.org; verify deploy previews work for feature branches; set up Zotero build hook for bibliography updates (optional)

### Task 6.9 – Final Polish - Agent_Design_System

**Objective:** Complete remaining polish: print stylesheet, reduced-motion, 404 page, favicon, cross-browser testing.
**Output:** Polished, production-ready site.
**Guidance:** Final quality pass across all page types and browsers. **Depends on: Task 6.4, 6.5 Output**

- Finalize print stylesheet: test all major page types print cleanly, sidenotes convert to footnotes, interactives show static fallback or hide, pagination breaks are sensible, bibliography entries print correctly
- Verify reduced-motion mode works across all interactives: all animations disabled, static alternatives displayed, no functionality lost
- Create custom 404 page with helpful navigation links, create favicon set (using site identity colours), add web app manifest for PWA basics
- Final cross-browser testing: verify in Chrome, Firefox, Safari, Edge; verify mobile responsiveness on iOS Safari and Chrome Android (via device emulation)

### Task 6.10 – User Review Checkpoint: Phase 6 / Launch Readiness - User

**Objective:** Final comprehensive review and launch approval.
**Output:** Launch approval or final change requests.
**Guidance:** Full site walkthrough. All PRD requirements verified. **Depends on: All Phase 6 tasks**

1. Compile final review: full site walkthrough covering all sections, dark mode, cross-project navigation, search, bibliography, all interactives, learning paths with progress tracking, a11y compliance report, Lighthouse scores, deployed site on Netlify
2. User performs comprehensive review: navigate all major page types, test dark mode, try learning paths, verify deployment, check mobile experience, review overall quality against PRD vision
3. Address any final issues; confirm launch readiness; site goes live at zktheory.org

## Phase 7: Post-Launch Hardening & Author Content

### Task 7.1 – About Page Content Pass - User-Guided

**Objective:** Replace all placeholder content on the about page with real author-supplied data.
**Output:** Complete about page with no TODO placeholders remaining.
**Guidance:** This is a user-guided authoring task. The page structure is final; only the prose content, CV data, and links need updating. Agent should make changes as the user provides data — do not fabricate content. **Depends on: Phase 6 complete**

Placeholders requiring author input:
- **Positionality statement** (~100 words): replace the `[position]` / `[department]` template text in `src/pages/about/index.astro`
- **CV — Education**: replace `201x–201x`, `[Institution Name]`, `[Discipline]`, `[Thesis title placeholder]` entries
- **CV — Presentations**: replace `202x`, `[Conference Name]`, `[Presentation title placeholder]` entries
- **Contact — Email**: replace `name@institution.ac.uk` with real email
- **Contact — GitHub**: replace `/todo/github` with real GitHub profile URL
- **Contact — Google Scholar**: replace `/todo/scholar` with real Google Scholar profile URL
- **Contact — Institutional page**: currently links to `https://www.open.ac.uk` (homepage); replace with direct staff/profile URL when available
- **Media kit — Short bio (~150 words)**: replace placeholder blockquote
- **Media kit — Long bio (~500 words)**: replace placeholder blockquote
- **Media kit — Headshot**: replace `.headshot-placeholder` div with real `<img>` once photograph is available; add to `public/images/`
- **CV — PDF download**: add real CV PDF to `public/cv.pdf` and the download link will resolve automatically

For each item, the user provides real content and the agent applies it directly to the file. No agent should invent biographical or professional details.

### Task 7.2 – Paper 1 arXiv Publication Update - Agent_Content

**Objective:** Update Paper 1 metadata when it is published to arXiv.
**Output:** Updated `src/content/tda/papers/paper-01.mdx` frontmatter and Person JSON-LD.
**Guidance:** Triggered when arXiv submission is confirmed. **Depends on: arXiv submission**

1. Update `src/content/tda/papers/paper-01.mdx` frontmatter: set `status: 'submitted'` → appropriate status, add `date: "YYYY-MM-DD"` (arXiv submission date), add `bibtex:` field with real BibTeX entry including arXiv DOI/URL
2. Update `citation_abstract_html_url` in PaperLayout if a dedicated abstract page URL exists on arXiv
3. Re-run build to confirm `citation_publication_date` now uses the real date

### Task 7.3 – rAF Animation Pause Controls - Agent_Interactive_Advanced

**Objective:** Add "Pause animation" controls to `FiltrationPlayground` and `PersistenceDiagramBuilder`/`PersistenceDiagramBuilder3D` to provide proper `prefers-reduced-motion` support beyond CSS.
**Output:** Pause/resume button on all three components; animation auto-paused when `useReducedMotion()` returns true.
**Guidance:** These components use `requestAnimationFrame` loops that CSS reduced-motion cannot stop. The WCAG 2.1 §2.2.2 Pause, Stop, Hide success criterion (Level A) applies. **Depends on: Phase 6 complete**

1. Add a visible "Pause / Resume" toggle button to `FiltrationPlayground.tsx`, `PersistenceDiagramBuilder.tsx`, and `PersistenceDiagramBuilder3D.tsx`
2. Wire `useReducedMotion()` hook: if `reducedMotion` is true on mount, start paused and do not auto-play. Allow user to explicitly resume if desired.
3. Ensure pause state is reflected in `aria-label` on the button and announced via `AriaLiveRegion`
4. Add Vitest tests and update Storybook stories

### Task 7.4 – Content Security Policy (CSP) Hardening - Agent_Infra

**Objective:** Add a Content-Security-Policy header to `netlify.toml` with nonce support for Astro inline scripts.
**Output:** CSP header in `netlify.toml`; all inline scripts either nonced or replaced with external scripts.
**Guidance:** Blocked from Phase 6 because Astro's `<script is:inline>` (no-FOCT script) requires a nonce. This task implements nonce injection via Astro middleware or a Netlify Edge Function. **Depends on: Phase 6 complete**

1. Audit all `<script is:inline>` usage in `BaseLayout.astro` and other layouts; identify all inline event handlers (should be none — verify)
2. Implement nonce injection: either via Astro middleware (`src/middleware.ts`) generating a per-request nonce and attaching it to `Astro.locals`, or via a Netlify Edge Function
3. Add CSP header to `netlify.toml` scoped to allow: `'self'`, `'nonce-{nonce}'` for scripts, `'self' data:` for styles (KaTeX uses `data:` URIs for fonts), `https://cdn.jsdelivr.net` if any CDN assets remain
4. Verify build, e2e tests, and axe scan still pass with CSP enabled

### Task 7.5 – Zotero Build Hook Setup - User Action

**Objective:** Create a Netlify build hook for bibliography-triggered rebuilds.
**Output:** Build hook URL created in Netlify UI; documented in project.
**Guidance:** Manual Netlify UI step — cannot be automated. **Depends on: Phase 6 Netlify deployment complete**

1. In Netlify UI → Site Settings → Build Hooks → create hook named "Zotero bibliography update"
2. Copy the generated POST URL
3. Configure Zotero to call the hook on library updates (Zotero server-side; or use a cron job / webhook service)
4. Record the hook URL in `.env.example` as `NETLIFY_ZOTERO_BUILD_HOOK` (do not commit the real URL)
