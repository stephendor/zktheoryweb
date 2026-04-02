# Product Requirements Document

## Research Portfolio Website — Stephen's Academic Platform

**Version:** 1.1  
**Date:** 2 April 2026  
**Author:** Stephen + Claude (Opus 4.6)  
**Status:** Draft for review  
**Domain:** zktheory.org (managed via Netlify)  
**Production method:** AI-agentic development in VSCode (Copilot models)

---

## 1. Vision and Purpose

### 1.1 The Problem

Two substantial, interconnected research programmes — a book (_Counting Lives: Statistics, Power, and the Mathematics of Human Worth_) and a multi-paper TDA research programme applying persistent homology to socioeconomic trajectory data — need a public-facing home that does more than list publications. Both projects involve mathematical ideas that are genuinely important for public understanding but are locked behind disciplinary walls: the political history of poverty measurement on one side, and the emerging topology of inequality on the other. No existing academic website format adequately serves the dual purpose of showcasing ongoing research and making that research's core ideas genuinely accessible.

### 1.2 The Vision

A single, cohesive website that functions simultaneously as:

- **Research portfolio** — a living home for both projects, with chapter previews, paper abstracts, data visualisations, and publication tracking
- **Teaching platform** — structured, interactive learning paths in topology and social justice mathematics, designed for audiences ranging from curious non-specialists to graduate students
- **Public scholarship** — long-form essays, interactive explainers, and visualisations that make the arguments of both projects legible to anyone willing to engage
- **Professional presence** — CV, contact, institutional affiliations, speaking/media

The site's animating principle is that the mathematics and the politics are inseparable, and the design should embody this: the topology section should feel politically grounded, and the social justice section should feel mathematically precise.

### 1.3 Target Audiences

| Audience                                                      | Needs                                                                                  | Priority   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- |
| Academic peers (sociology, TDA, computational social science) | Paper access, methodology detail, replication materials, research programme legibility | High       |
| Graduate students and early-career researchers                | Learning pathways, tutorials, code walkthroughs, career narrative                      | High       |
| Policy professionals and third-sector workers                 | Accessible summaries of findings, Scottish policy context, data justice framing        | Medium     |
| Informed general public                                       | Interactive explainers, chapter previews, essay-length treatments                      | Medium     |
| Potential collaborators and supervisors                       | Research programme overview, computational capability, publication pipeline            | High       |
| Journalists and media                                         | Clear summaries, quotable findings, contact information                                | Low–Medium |

---

## 2. Site Architecture

### 2.1 Top-Level Information Architecture

All routes live under `zktheory.org`:

```
/                           → Landing page (hero + project cards + recent activity)
/counting-lives/            → Book hub
/tda/                       → TDA research programme hub
/learn/                     → Teaching and learning hub
/writing/                   → Blog / essays / public scholarship
/about/                     → Bio, CV, contact, institutional affiliations
```

### 2.2 Counting Lives Section (`/counting-lives/`)

This section presents the book as a living intellectual project, not a static table of contents.

```
/counting-lives/
├── overview                → The argument, the five transitions, the two threads
├── transitions/            → Interactive timeline of the five transitions
│   ├── victorian-statistics
│   ├── welfare-consensus
│   ├── computational-turn
│   ├── new-eugenicists
│   └── automated-poorhouse
├── chapters/               → Chapter-by-chapter pages
│   ├── ch01-statisticians-stomach
│   ├── ch02-eugenic-ledger
│   ├── ...
│   └── ch18-conclusion
├── threads/
│   ├── scottish-thread     → The Highland Clearances to the Child Poverty Act
│   └── gender-thread       → Janet Philip to the Women's Budget Group
├── interludes/             → The four Mathematical Interludes
│   ├── mm1-normal-distribution
│   ├── mm2-correlation-regression
│   ├── mm3-logistic-regression
│   └── mm4-neural-networks
├── counter-mathematics     → Part IV as a standalone lens
├── figures/                → Key people, theorists, institutional actors
└── bibliography            → Searchable, filterable reference list
```

#### 2.2.1 Chapter Pages

Each chapter page includes:

- **Synopsis** (300–500 words) — the chapter's argument in accessible prose
- **Spine role** — a single sentence explaining what the chapter does in the book's architecture
- **Key claims** — 3–5 core assertions, each expandable with supporting detail
- **Key figures** — biographical cards for historical actors (Orshansky, Galton, Beveridge, Eubanks, etc.) with portrait/photo where available
- **Mathematical concepts** — inline links to the relevant Mathematical Interlude, with preview tooltips showing the concept in context
- **Thread markers** — visible indicators showing where the Scottish and Gender threads run through the chapter, with links to the thread pages
- **Chapter status indicator** — drafting / in review / complete
- **Related TDA work** — where the TDA programme connects (especially Ch10–Ch13 ↔ algorithmic scoring, Ch17 ↔ data justice)

#### 2.2.2 Five Transitions Interactive Timeline

A centrepiece interactive feature. The timeline should:

- Display all five transitions on a horizontal or vertical scrolling axis (1830s–present)
- Show overlapping eras with visual layering (transitions are not sequential — they overlap and inherit)
- Allow click-through to each transition's detail view, showing chapters, mathematical tools, key claims, and key figures
- Include a "counter-mathematics" running thread visible alongside all five transitions
- Highlight the Scottish and Gender threads as colour-coded strands woven through the timeline
- Support annotation: short pull-quotes or key claims visible on hover
- Be responsive and touch-friendly

#### 2.2.3 Thread Pages

Each thread page (Scottish, Gender) is a longitudinal reading of the entire book through a single lens:

- A visual timeline specific to that thread
- Chapter-by-chapter annotations showing where the thread appears
- Key figures specific to the thread (Janet Philip, Alva Myrdal for Gender; Highland Clearances actors, CPAG Scotland for Scottish)
- A standalone essay summarising the thread's argument (1,500–2,500 words)

#### 2.2.4 Mathematical Interludes

These are the site's bridge between the two projects. Each interlude page should:

- Present the mathematical concept at three levels: intuitive (visual/narrative), intermediate (worked examples), and formal (notation and proofs)
- Include interactive visualisations (e.g., a draggable normal distribution showing how changing parameters changes who is "normal"; a regression line that users can fit to data points; a logistic threshold slider showing how moving the decision boundary changes who is classified)
- Link bidirectionally to the chapters that use the concept and to the TDA learning path where relevant
- Include historical context: who built the tool, for what purpose, and what political assumptions were embedded

### 2.3 TDA Research Programme Section (`/tda/`)

```
/tda/
├── overview                → Programme narrative, three-stage architecture
├── papers/                 → Individual paper pages
│   ├── paper-1-markov-memory-ladder
│   ├── paper-2-mapper
│   ├── paper-3-zigzag
│   ├── paper-4-multiparameter
│   ├── paper-5-cross-national
│   ├── paper-6-intergenerational
│   ├── paper-7-geometric-forecasting
│   ├── paper-8-gnn-household
│   ├── paper-9-ccnn
│   └── paper-10-topological-fairness
├── pipeline/               → Visual dependency graph of the research programme
├── methods/                → Technical methodology pages
│   ├── persistent-homology
│   ├── markov-memory-ladder
│   ├── mapper
│   ├── zigzag-persistence
│   ├── multiparameter-persistence
│   └── topological-deep-learning
├── data/                   → Data sources, access, ethics
│   ├── understanding-society
│   ├── bhps
│   └── cross-national-panels
├── code/                   → Code repositories, replication materials
├── visualisations/         → Interactive TDA visualisations gallery
└── computational-log       → Public research log / lab notebook
```

#### 2.3.1 Paper Pages

Each paper page includes:

- **Abstract** — formal abstract
- **Plain-language summary** — 200–300 words for non-specialist readers
- **Status badge** — pipeline position (drafting / submitted / in review / published) with target journal
- **Key findings** — expandable cards
- **Methodology summary** — with links to the relevant `/tda/methods/` page
- **Interactive figure** — at least one key result presented as an interactive visualisation (e.g., persistence diagram, Mapper graph, Wasserstein distance comparison)
- **Dependency graph position** — visual indicator showing where this paper sits in the 10-paper sequence
- **Computational requirements** — hardware, estimated runtime, cloud needs (from the resource map)
- **Downloads** — preprint PDF, supplementary materials, code repository link, data access instructions
- **BibTeX** — one-click copy

#### 2.3.2 Research Pipeline Visualisation

An interactive dependency graph showing:

- All 10 papers as nodes, grouped by stage (0, 1, 2, 3)
- Dependency edges between papers
- Status indicators (colour-coded by progress)
- Click-through to each paper page
- Timeline overlay showing the 0–48 month horizon
- Computational resource indicators (CPU-only vs. GPU vs. cloud)

#### 2.3.3 Methods Pages

Each methods page is both reference documentation and a learning resource:

- **Intuitive introduction** — what the method does, with a visual metaphor or toy example
- **Mathematical formulation** — formal definitions with LaTeX rendering
- **Implementation** — code snippets (Python), library references, parameter guidance
- **Application to the research** — how this method is used in specific papers
- **Interactive demo** — where feasible (e.g., a point cloud where users can run VR filtration and see a persistence diagram emerge; a Mapper graph with adjustable parameters)
- **Further reading** — annotated bibliography

### 2.4 Learning Hub (`/learn/`)

The teaching section is the site's most distinctive feature. It serves readers coming from either direction: mathematicians who want to understand the social justice stakes, and social scientists who want to understand the topology.

```
/learn/
├── paths/
│   ├── topology-for-social-scientists    → From intuition to persistence diagrams
│   ├── mathematics-of-poverty            → From grocery lists to algorithmic scoring
│   ├── data-justice-foundations           → Who counts, who decides, who benefits
│   └── tda-for-practitioners             → Hands-on TDA with Python (graduate level)
├── interactives/                         → Standalone interactive tools
│   ├── normal-distribution-explorer
│   ├── persistence-diagram-builder
│   ├── filtration-playground
│   ├── mapper-parameter-lab
│   ├── poverty-threshold-simulator
│   ├── benefit-taper-calculator
│   └── timeline-of-poverty-measurement
├── glossary/                             → Searchable glossary spanning both projects
└── reading-lists/                        → Curated lists by topic and level
```

#### 2.4.1 Learning Paths

Each learning path is a structured sequence of 6–12 modules. Each module includes:

- **Reading** — 800–1,500 words of expository prose
- **Interactive element** — a visualisation, simulation, or exercise
- **Connections** — links to relevant book chapters, TDA papers, and other modules
- **Check your understanding** — 2–3 self-assessment questions (not graded; for reflection)
- **Progress tracking** — localStorage-based, no login required; progress persists on the same device/browser

##### Path 1: Topology for Social Scientists

Target audience: Social science researchers with basic statistics but no topology background.

| Module | Title                       | Core Concept                                        | Interactive                                     |
| ------ | --------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| 1      | What is a shape?            | Intuitive topology — coffee cups and doughnuts      | Drag-and-deform 3D shapes                       |
| 2      | Point clouds and distance   | From data tables to geometric objects               | Plot survey data as point clouds                |
| 3      | Simplicial complexes        | Building shapes from data                           | Vietoris-Rips filtration step-by-step           |
| 4      | Homology: counting holes    | H₀ (components), H₁ (loops), H₂ (voids)             | Adjustable filtration with live homology counts |
| 5      | Persistence diagrams        | Which features are real?                            | Birth-death diagram builder                     |
| 6      | From diagrams to statistics | Wasserstein distance, landscapes, total persistence | Compare two persistence diagrams                |
| 7      | The Markov memory ladder    | Null models for trajectory topology                 | Simulate and compare shuffled vs. observed      |
| 8      | Reading the results         | What the UK trajectory topology tells us            | Guided walkthrough of Paper 1 results           |

##### Path 2: The Mathematics of Poverty

Target audience: Anyone interested in how mathematical tools shape poverty policy.

| Module | Title                    | Core Concept                                                     | Interactive                                      |
| ------ | ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------ |
| 1      | Drawing the line         | What is a poverty threshold and who decides?                     | Poverty threshold simulator                      |
| 2      | The average person       | Quetelet, the normal distribution, and normality                 | Normal distribution explorer                     |
| 3      | Counting what counts     | Orshansky's 124 thresholds vs. the one that survived             | Compare basket-based vs. relative measures       |
| 4      | The welfare formula      | Beveridge, contribution records, and the male-breadwinner model  | Benefit calculator with historical parameters    |
| 5      | Optimisation and control | From needs-based to cost-effective welfare                       | Objective function explorer                      |
| 6      | The score                | Credit scores, risk scores, algorithmic eligibility              | How a logistic regression classifies you         |
| 7      | The black box            | Neural networks and the right to explanation                     | Train a toy classifier on simulated welfare data |
| 8      | Counter-mathematics      | Participatory measurement, data justice, democratic alternatives | Design your own poverty measure                  |

##### Path 3: Data Justice Foundations

Target audience: Activists, policy workers, community researchers.

| Module | Title                       | Core Concept                                          | Interactive                 |
| ------ | --------------------------- | ----------------------------------------------------- | --------------------------- |
| 1      | Who counts?                 | The politics of data collection                       | Missing data explorer       |
| 2      | Whose categories?           | How statistical categories make people                | Category builder exercise   |
| 3      | The view from above         | Scott's legibility thesis — states simplify to govern | Simplification simulator    |
| 4      | Indigenous data sovereignty | Kukutai, CARE principles, community governance        | Case study explorer         |
| 5      | Feminist data gaps          | D'Ignazio and Klein, the WBG's 86%, care economy      | Gender gap calculator       |
| 6      | Algorithmic accountability  | Eubanks, the digital poorhouse, the right to contest  | Audit an algorithm exercise |

##### Path 4: TDA for Practitioners

Target audience: Graduate students and researchers wanting to use TDA.

| Module | Title                               | Core Concept                                    | Interactive                     |
| ------ | ----------------------------------- | ----------------------------------------------- | ------------------------------- |
| 1      | Setup and first computation         | Python environment, Ripser, Gudhi               | Jupyter-style code runner       |
| 2      | Point cloud preprocessing           | Embedding, PCA, landmark sampling               | Parameter effect explorer       |
| 3      | Vietoris-Rips persistent homology   | Full pipeline on toy data                       | Step-through filtration         |
| 4      | Reading persistence diagrams        | Statistical interpretation, confidence          | Diagram annotation tool         |
| 5      | Null models and hypothesis testing  | Permutation tests, the Markov memory ladder     | Build a null model              |
| 6      | Mapper                              | KeplerMapper, cover functions, parameter tuning | Mapper parameter lab            |
| 7      | Zigzag persistence                  | Time-varying topology                           | Zigzag on synthetic time series |
| 8      | Multi-parameter persistence         | Bifiltrations, Hilbert functions, multipers     | Bifiltration explorer           |
| 9      | Wasserstein and landscape distances | Comparing diagrams rigorously                   | Distance calculator             |
| 10     | From TDA to deep learning           | GNNs, CCNNs, topological features as inputs     | Architecture comparison         |
| 11     | Fairness and topology               | Topological bias detection                      | Fairness audit pipeline         |
| 12     | Designing your own TDA study        | Study design, reporting, replication            | Checklist generator             |

#### 2.4.2 Interactive Tools (Standalone)

These are the flagship interactive features, usable both within learning paths and independently. Each should be:

- Self-contained (no login, no setup)
- Responsive (desktop and tablet; mobile where feasible)
- Accessible (keyboard navigable, screen-reader compatible, colour-blind safe)
- Shareable (unique URL, Open Graph metadata for social sharing)

**Priority interactives (build first):**

1. **Persistence Diagram Builder** — Users upload or generate a 2D point cloud, adjust a filtration parameter with a slider, watch simplicial complexes form, and see the persistence diagram populate in real time. This is the TDA programme's signature visualisation.

2. **Poverty Threshold Simulator** — Users set parameters (household size, region, basket contents, equivalisation method) and see how the poverty line moves, who falls above and below it, and how the "poverty rate" changes with each decision. Demonstrates that thresholds are political choices.

3. **Normal Distribution Explorer** — Drag mean and standard deviation; overlay historical uses (Quetelet's average man, Galton's ranking, IQ distribution, benefit eligibility thresholds). Shows how the same mathematical object serves different political purposes.

4. **Mapper Parameter Lab** — Load a sample dataset (or the UK trajectory data in anonymised/synthetic form), adjust cover resolution, overlap, and clustering parameters, and see the Mapper graph change in real time.

5. **Five Transitions Timeline** — The interactive timeline described in §2.2.2.

6. **Benefit Taper Calculator** — Model Universal Credit's taper rate, housing element, and sanctions regime. Show effective marginal tax rates and poverty traps as interactive graphs.

### 2.5 Writing / Blog Section (`/writing/`)

```
/writing/
├── essays/                 → Long-form public scholarship (1,500–5,000 words)
├── notes/                  → Shorter research notes, reading responses
├── updates/                → Project updates, publication news
└── archive/                → Chronological and tag-based archive
```

Each post supports:

- LaTeX rendering for inline and display mathematics
- Syntax-highlighted code blocks
- Embedded interactive visualisations (from the `/learn/interactives/` library)
- Footnotes and bibliography
- Estimated reading time
- Tags linking to both projects

### 2.6 About Section (`/about/`)

- **Bio** — academic and personal, with the positionality statement from the book
- **CV** — downloadable PDF and web version with filterable sections
- **Research interests** — linked to both project hubs
- **Teaching** — linked to learning paths
- **Contact** — email, institutional page, ORCID, Google Scholar, GitHub
- **Media kit** — headshot, short bio (150 words), long bio (500 words)

---

## 3. Design System

### 3.1 Design Principles

1. **Scholarly but not stiff** — the site should feel like a well-designed academic monograph, not a corporate template or a generic Bootstrap site. Think _n+1_, _Aeon_, _Works in Progress_ — editorial web design with mathematical precision.

2. **Mathematics is visible** — LaTeX is rendered beautifully, diagrams are first-class content, and interactive elements feel like natural extensions of mathematical argument rather than gamified add-ons.

3. **Two registers, one voice** — the Counting Lives material and the TDA material have different tones (essayistic vs. methodological) but should feel like they belong to the same mind. Shared typography, shared colour logic, differentiated accent palettes.

4. **Accessibility is non-negotiable** — WCAG 2.1 AA minimum. The site's subject matter is about who gets counted; the site itself must not exclude.

5. **Progressive disclosure** — every page should be useful at first glance and reward sustained attention. Key claims visible immediately; supporting detail available on expansion; full technical depth available on click-through.

### 3.2 Visual Identity

#### Colour System

Two project palettes sharing a common neutral base:

- **Neutral base:** warm off-white backgrounds, dark charcoal text, generous whitespace
- **Counting Lives accent palette:** muted reds, deep ochre, archival cream — evoking historical documents, institutional records, the material culture of governance
- **TDA accent palette:** deep teal, slate blue, warm grey — evoking topological diagrams, mathematical precision, computational outputs
- **Shared highlight:** a single accent colour (e.g., a warm amber) used across both projects for interactive elements, links, and calls to action
- **Data visualisation palette:** a carefully chosen 8-colour palette that is colour-blind safe (test with Coblis) and prints legibly in greyscale

#### Typography

- **Display / headings:** A serif with character — something in the space of Freight Display, Tiempos, or Canela. Must render LaTeX-adjacent content naturally.
- **Body text:** A highly legible serif for long-form reading — something in the space of Freight Text, Charter, or Source Serif Pro. Line height 1.5–1.6, measure 65–75 characters.
- **Code and mathematical notation:** JetBrains Mono or Fira Code for code blocks. KaTeX or MathJax for LaTeX rendering, styled to harmonise with the body serif.
- **UI elements:** A clean sans-serif for navigation, labels, and interface elements — something in the space of Söhne, Graphik, or Instrument Sans.

#### Layout

- **Content width:** 720px max for prose, 1080px for visualisations and data displays, full-bleed for hero sections and immersive interactives
- **Grid:** 12-column with generous gutters; asymmetric where appropriate (sidenotes, margin figures in the Tufte tradition)
- **Sidenotes:** Where screen width permits, use margin notes rather than footnotes — this is an academic site and the Tufte pattern suits both the content and the audience
- **Chapter/paper navigation:** Sticky sidebar table of contents on desktop; collapsible on mobile
- **Reading progress:** Subtle progress indicator on long-form pages

### 3.3 Interaction Design

- **Hover states:** Informative, not decorative. Hovering on a chapter reference shows a preview card; hovering on a mathematical term shows a tooltip definition; hovering on a timeline element shows the key claim.
- **Transitions:** Smooth, purposeful, fast (200–300ms). No gratuitous animation. Interactives may have longer transitions where pedagogically useful (e.g., filtration animation).
- **Dark mode:** Supported as a toggle. Colour palettes must work in both modes.
- **Print stylesheet:** Long-form content should print cleanly with proper pagination, footnotes, and no interactive chrome.

---

## 4. Technical Architecture

### 4.1 Stack Recommendation

Given the requirements (static-first, LaTeX-heavy, interactive components, blog, learning paths, AI-agentic development workflow), the recommended stack is:

| Layer                   | Choice                                                                    | Rationale                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**           | Astro 5.x                                                                 | Content-first, ships zero JS by default, island architecture for interactive components, excellent MDX support, good DX for AI-agentic coding |
| **Interactive islands** | React 19 + TypeScript                                                     | Mature ecosystem for complex interactives (D3, Three.js, WebGL); Copilot models have deep training data                                       |
| **Styling**             | Tailwind CSS 4 + custom design tokens                                     | Utility-first for rapid iteration; design tokens for the dual-palette system                                                                  |
| **Content**             | MDX (Markdown + JSX)                                                      | LaTeX in prose via KaTeX plugin; React components embedded in content; version-controllable                                                   |
| **Math rendering**      | KaTeX (compile-time via rehype-katex)                                     | Faster than MathJax; compile-time rendering means no client-side flash                                                                        |
| **Visualisations**      | D3.js + Observable Plot for data viz; Three.js/R3F for 3D topology        | D3 for bespoke interactives; Observable Plot for simpler charts                                                                               |
| **Code execution**      | Pyodide (WebAssembly Python) for in-browser TDA demos                     | Users can run Python (Ripser, scikit-tda) in the browser without a server                                                                     |
| **Search**              | Pagefind (static search)                                                  | Fast, zero-config, indexes at build time, works offline                                                                                       |
| **CMS layer**           | File-based (MDX in Git) with optional Decap CMS for non-technical editing | AI agents work directly with files; optional GUI for content updates                                                                          |
| **Bibliography**        | Zotero Web API v3 (live, fetched at build time)                           | Keeps citations current without manual export; cached JSON fallback                                                                           |
| **Deployment**          | Netlify                                                                   | Already managing zktheory.org; native Astro adapter; deploy previews per branch; edge functions if needed                                     |
| **Analytics**           | Plausible or Fathom                                                       | Privacy-respecting, no cookie banner needed, GDPR-compliant                                                                                   |

### 4.2 Content Architecture

```
src/
├── content/
│   ├── counting-lives/
│   │   ├── chapters/           → ch01.mdx, ch02.mdx, ...
│   │   ├── transitions/        → victorian.mdx, welfare.mdx, ...
│   │   ├── threads/            → scottish.mdx, gender.mdx
│   │   ├── interludes/         → mm1.mdx, mm2.mdx, ...
│   │   └── figures/            → orshansky.mdx, galton.mdx, ...
│   ├── tda/
│   │   ├── papers/             → paper-1.mdx, paper-2.mdx, ...
│   │   ├── methods/            → persistent-homology.mdx, mapper.mdx, ...
│   │   └── data/               → usoc.mdx, bhps.mdx, ...
│   ├── learn/
│   │   ├── topology-social-scientists/  → module-01.mdx, ...
│   │   ├── mathematics-of-poverty/      → module-01.mdx, ...
│   │   ├── data-justice/                → module-01.mdx, ...
│   │   └── tda-practitioners/           → module-01.mdx, ...
│   ├── writing/
│   │   ├── essays/             → yyyy-mm-dd-slug.mdx
│   │   └── notes/              → yyyy-mm-dd-slug.mdx
│   └── interactives/           → Component manifests for standalone tools
├── components/
│   ├── counting-lives/         → ChapterCard, TransitionTimeline, ThreadMarker, ...
│   ├── tda/                    → PaperCard, PipelineGraph, PersistenceDiagram, ...
│   ├── learn/                  → ModuleLayout, ProgressTracker, QuizCard, ...
│   ├── interactives/           → Each standalone interactive as a React island
│   │   ├── PersistenceDiagramBuilder/
│   │   ├── PovertyThresholdSimulator/
│   │   ├── NormalDistributionExplorer/
│   │   ├── MapperParameterLab/
│   │   ├── FiltrationPlayground/
│   │   └── BenefitTaperCalculator/
│   └── shared/                 → Layout, Nav, Footer, Sidenote, MathBlock, ...
├── layouts/
│   ├── BaseLayout.astro
│   ├── ChapterLayout.astro
│   ├── PaperLayout.astro
│   ├── ModuleLayout.astro
│   └── PostLayout.astro
└── styles/
    ├── tokens.css              → Design tokens (colours, type scale, spacing)
    ├── prose.css               → Long-form reading styles
    └── print.css               → Print stylesheet
```

### 4.3 Data Models

#### Chapter Frontmatter

```yaml
---
title: "The Statistician's Stomach"
chapter_number: 1
part: 'Part I — The State Learns to Count'
part_number: 1
transition: 1
spine_role: "Establishes the book's epistemological tension between material specificity and administrative abstraction."
status: 'drafting' # drafting | in-review | complete
key_figures: ['orshansky', 'johnson-admin']
mathematical_concepts: ['poverty-threshold', 'equivalisation']
interludes: ['mm1']
threads:
  scottish: false
  gender: true
related_tda_papers: []
key_claims:
  - claim: "Orshansky's 124 thresholds were simplified into one for political, not technical, reasons."
    detail: 'The SSA adopted the economy food plan threshold...'
  - claim: '...'
---
```

#### Paper Frontmatter

```yaml
---
title: 'The Markov Memory Ladder'
paper_number: 1
stage: 0
status: 'drafting' # drafting | submitted | in-review | revision | published
target_journal: 'Sociological Methodology'
depends_on: []
enables: [2, 3, 4, 5, 6]
methods: ['persistent-homology', 'markov-memory-ladder']
datasets: ['understanding-society', 'bhps']
compute:
  local: true
  gpu: false
  cloud: false
  estimated_time: 'Minutes'
key_findings:
  - 'UK employment trajectories exhibit topological structure significantly exceeding Markov-1 null expectations (z ≈ −3.7).'
  - '...'
abstract: '...'
plain_summary: '...'
bibtex: |
  @article{...}
---
```

#### Interactive Manifest

```yaml
---
title: 'Persistence Diagram Builder'
slug: 'persistence-diagram-builder'
description: 'Build a point cloud, run a Vietoris-Rips filtration, and watch the persistence diagram emerge.'
tech: ['react', 'd3', 'webgl']
complexity: 'high'
used_in:
  - learn/topology-social-scientists/module-05
  - tda/methods/persistent-homology
responsive: true
min_width: 768 # tablet minimum for full experience
a11y_notes: 'Keyboard controls for filtration parameter; text descriptions of topological features'
---
```

### 4.4 Performance Targets

| Metric                                     | Target            |
| ------------------------------------------ | ----------------- |
| Lighthouse Performance (prose pages)       | ≥ 95              |
| Lighthouse Performance (interactive pages) | ≥ 80              |
| Largest Contentful Paint                   | < 1.5s            |
| First Input Delay                          | < 100ms           |
| Cumulative Layout Shift                    | < 0.1             |
| Time to Interactive (interactives)         | < 3s on broadband |
| Total JS shipped (prose pages)             | < 50KB            |
| KaTeX render (compile-time)                | 0ms client-side   |

### 4.5 Accessibility Requirements

- WCAG 2.1 AA compliance across all pages
- All interactive visualisations must have text alternatives or text-description mode
- Colour-blind safe palettes (tested with Coblis and Sim Daltonism)
- Keyboard navigation for all interactive elements
- Skip-to-content links
- Semantic HTML throughout
- Screen-reader-compatible LaTeX (KaTeX aria-labels)
- Reduced-motion mode for all animations
- Minimum touch target 44×44px on mobile

---

## 5. AI-Agentic Development Considerations

### 5.1 Development Workflow

The site will be built primarily through AI-agentic coding in VSCode using Copilot models. This shapes the architecture:

- **File-based content** — MDX files in a clear directory structure are ideal for AI agents to read, write, and modify
- **Component isolation** — each interactive is a self-contained React component with clear props interfaces, making it easy for agents to build and iterate on individual pieces
- **Type safety** — TypeScript throughout, with Zod schemas for frontmatter validation, giving agents clear contracts to code against
- **Test harness** — Vitest for component testing; Playwright for integration tests on interactives; agents can run tests to verify their work
- **Storybook** — for interactive component development in isolation; agents can build and preview components without full site builds

### 5.2 Agent Task Decomposition

The project naturally decomposes into agent-sized tasks:

**Phase 1 — Foundation (Weeks 1–4)**

- Astro project scaffold with routing, layouts, design tokens
- Base components: navigation, footer, prose styles, sidenote system
- MDX pipeline: KaTeX, syntax highlighting, frontmatter schemas
- Deploy pipeline: Netlify (existing zktheory.org config) with preview deployments per branch

**Phase 2 — Content Architecture (Weeks 5–8)**

- Chapter page template and first 3 chapter pages (content stubs)
- Paper page template and Paper 1 page
- Learning path module template and first module of Path 1
- Zotero Web API build-time integration: fetch script, JSON cache, citation components, bibliography page
- Pagefind search integration
- Blog/writing section with first post

**Phase 3 — Interactive Core (Weeks 9–16)**

- Five Transitions Timeline (centrepiece)
- Normal Distribution Explorer
- Persistence Diagram Builder
- Poverty Threshold Simulator
- Research Pipeline visualisation (D3 force-directed graph)

**Phase 4 — Learning Paths (Weeks 17–24)**

- Complete Path 1: Topology for Social Scientists (8 modules)
- Complete Path 2: Mathematics of Poverty (8 modules)
- Interactive tools for each path
- Progress tracking (localStorage)

**Phase 5 — Advanced Interactives (Weeks 25–32)**

- Mapper Parameter Lab
- Filtration Playground
- Benefit Taper Calculator
- Pyodide integration for in-browser Python execution
- TDA for Practitioners path (12 modules)

**Phase 6 — Polish and Launch (Weeks 33–40)**

- Data Justice Foundations path (6 modules)
- Complete all chapter pages with full content
- Complete all paper pages
- Glossary
- Accessibility audit and remediation
- Performance optimisation
- SEO and Open Graph metadata
- Print stylesheets
- Dark mode

### 5.3 Agent Prompting Strategy

For Copilot-model execution, each task should be specified with:

1. **Context file** — a markdown file describing the component's purpose, props interface, design intent, and acceptance criteria
2. **Reference files** — existing components that demonstrate the project's patterns and conventions
3. **Test specification** — what the component should do, expressed as test cases
4. **Design tokens** — the CSS custom properties and Tailwind classes available
5. **Content sample** — real or realistic content for the component to render

This PRD itself serves as the master context file. Individual component specs should be broken out as the project progresses.

---

## 6. Content Production Plan

### 6.1 Content Types and Sources

| Content Type               | Source                                 | Production Method                                               |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| Chapter synopses           | Counting Lives drafts (Obsidian vault) | Author-written, AI-assisted editing                             |
| Key claims                 | Book Spine and chapter outlines        | Author-curated                                                  |
| Paper abstracts            | TDA paper drafts                       | Author-written                                                  |
| Plain-language summaries   | Paper abstracts                        | AI-assisted rewriting with author review                        |
| Learning path modules      | Author outlines                        | AI-drafted prose, author-reviewed; interactives built by agents |
| Interactive specifications | This PRD + author briefs               | Author specifies; agent implements                              |
| Blog essays                | Author-written                         | AI-assisted editing (humanizer skill)                           |
| Biographical cards         | Research                               | AI-drafted, author fact-checked                                 |
| Glossary entries           | Both projects                          | AI-generated from content, author-curated                       |
| Bibliography               | Zotero library                         | Live API fetch at build time; Zotero tags map to site filters   |

### 6.2 Content Pipeline

```
Author outline → AI draft → Author review → AI revision → Final review → Publish
```

For learning path modules, the cycle is:

```
Author specifies learning objective + key concepts
  → AI drafts prose and exercise specifications
    → Agent builds interactive component
      → Author tests and reviews
        → Iteration
          → Publish
```

### 6.3 Bibliography Integration (Live Zotero)

The Zotero MCP server is already configured on the Windows development machine. The site should use **live Zotero API integration** rather than static exports:

**Build-time integration (recommended primary approach):**

- At build time, an Astro integration or custom script fetches the full library (or a tagged collection) from the Zotero Web API (`api.zotero.org/users/{userID}/...`) using the existing API key
- Fetched items are written to a local JSON cache (`src/data/zotero-library.json`) that Astro's content layer can consume
- Chapter and paper pages reference items by Zotero item key; the build resolves these to full citation data
- A Netlify build hook can be triggered manually or via a Zotero webhook (using the Zotero API's `If-Modified-Since-Version` header) to rebuild when the library changes
- This keeps the site fully static while the bibliography stays current

**Implementation details:**

- Use the Zotero Web API v3 (REST, JSON) — no dependency on the local Zotero client at build time
- Fetch items with `format=json` and `include=data,bib,citation` to get structured data and pre-rendered citations
- Store the library version number; on subsequent builds, use `?since={version}` for incremental updates
- Render bibliography entries in a searchable, filterable page (`/counting-lives/bibliography` and `/tda/code` sections)
- Support inline citation popovers: hovering on a citation in chapter/paper prose shows the full reference
- Generate BibTeX download for individual entries (from the Zotero data, client-side)
- Tags in Zotero map to filterable categories on the site (e.g., "TDA-methods", "poverty-measurement", "Scottish-thread")

**Fallback:** If the Zotero API is unreachable at build time, the build uses the cached JSON from the last successful fetch. The site never fails to build because of a Zotero outage.

---

## 7. Cross-Project Connections

The site's intellectual coherence depends on visible, navigable connections between the two projects. These should be implemented as:

### 7.1 Bidirectional Links

- Every Mathematical Interlude links to both the chapters that use the concept and the TDA methods that formalise it
- Every TDA methods page links to the Counting Lives chapters where the method's political stakes are examined
- Ch10 (Risk Scores) ↔ Paper 10 (Topological Fairness)
- Ch13 (The Respectable Calculus) ↔ Paper 5 (Cross-National Welfare State Topology)
- Ch17 (Ethics of Measurement) ↔ Papers 10 (Fairness) and Paper 5 (Cross-National)
- The counter-mathematics thread ↔ the data justice learning path
- Mathematical Interludes ↔ TDA for Practitioners path

### 7.2 Shared Concepts

A unified glossary and concept system where terms like "persistence," "threshold," "classification," "score" appear with definitions that acknowledge both their technical TDA meaning and their political poverty-measurement meaning. This duality is the site's intellectual signature.

### 7.3 "Two Lenses" Feature

On key concept pages, offer a toggle or split view: "Read this as mathematics" / "Read this as politics." For example, the logistic regression page could show the same mathematical object explained as a classification tool (TDA lens) and as a welfare eligibility boundary (Counting Lives lens).

---

## 8. SEO and Discoverability

- **Semantic HTML** with proper heading hierarchy
- **Open Graph and Twitter Card metadata** for every page, with custom images for chapters, papers, and interactives
- **Structured data** (JSON-LD) for academic publications (ScholarlyArticle), person (the author), and educational content (Course, LearningResource)
- **Sitemap** generated at build time
- **RSS feed** for the writing section
- **ORCID integration** — link publications to ORCID profile
- **Google Scholar** — ensure paper pages are crawlable and have correct metadata for Scholar indexing

---

## 9. Future Considerations

### 9.1 Community Features (Post-Launch)

- **Discussion threads** on learning path modules (could use Giscus — GitHub Discussions-backed comments)
- **Annotation layer** (Hypothesis integration) for collaborative reading of chapter previews
- **Student submissions** — a gallery of TDA projects built using the practitioner learning path

### 9.2 Data Exploration Tools (Post-Launch)

- **Synthetic data explorer** — anonymised/synthetic versions of the UK trajectory data, explorable through the site's TDA tools
- **Replication dashboard** — for each paper, a live dashboard showing the pipeline from raw data to results, with parameter adjustments

### 9.3 Multilingual Support

- The data justice and counter-mathematics content has natural audiences beyond English (particularly the cross-national welfare comparison and indigenous data sovereignty material)
- Astro supports i18n natively; design the content architecture to accommodate future translation

### 9.4 Accessibility Beyond Compliance

- **Plain-language versions** of all key content (linked, not replacing)
- **Audio versions** of learning path modules (TTS or recorded)
- **BSL video summaries** for key chapters (aspirational; depends on resources)

---

## 10. Success Metrics

| Metric                            | Target (6 months post-launch)                         | Measurement                                       |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| Monthly unique visitors           | 2,000+                                                | Plausible analytics                               |
| Learning path completions         | 100+ across all paths                                 | localStorage tracking (anonymous, on-device only) |
| Interactive engagement            | Average 3+ minutes per interactive session            | Plausible custom events                           |
| Academic citation of site content | Any                                                   | Google Scholar alerts                             |
| Paper downloads                   | Tracked per paper                                     | Plausible download events                         |
| Accessibility score               | WCAG 2.1 AA pass                                      | axe-core automated + manual audit                 |
| Lighthouse score (prose)          | ≥ 95                                                  | CI pipeline check                                 |
| Search indexing                   | All paper and chapter pages indexed in Google Scholar | Search Console                                    |
| Time on site (learning paths)     | > 8 minutes average                                   | Plausible                                         |

---

## 11. Risks and Mitigations

| Risk                                                             | Likelihood | Impact | Mitigation                                                                                 |
| ---------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------ |
| Scope creep — too many interactives before core content is solid | High       | High   | Strict phasing; content-first approach; interactives only after prose is stable            |
| Pyodide performance — in-browser Python too slow for real TDA    | Medium     | Medium | Pre-compute results for demos; Pyodide for toy examples only; link to Colab for full-scale |
| Content staleness — book/papers evolve faster than site          | Medium     | Medium | MDX files in same Git repo as working drafts; CI deploys on push                           |
| Accessibility debt — interactives built without a11y from start  | Medium     | High   | a11y requirements in every component spec; automated testing in CI                         |
| AI-agent quality variance — Copilot produces inconsistent code   | High       | Medium | Component specs + Storybook + test suites constrain agent output; human review gates       |
| LaTeX rendering inconsistency                                    | Low        | Medium | Compile-time KaTeX; visual regression tests for math-heavy pages                           |

---

## Appendix A: Counting Lives Chapter Index

| Ch  | Title                                     | Part      | Transition | Status |
| --- | ----------------------------------------- | --------- | ---------- | ------ |
| 01  | The Statistician's Stomach                | I         | 1          | —      |
| 02  | The Eugenic Ledger                        | I         | 1          | —      |
| 03  | From Poor Law to Social Insurance         | I         | 2          | —      |
| 04  | The Grocery List as Resistance            | I         | 2          | —      |
| 05  | Cybernetics and Control                   | II        | 3          | —      |
| 06  | The RAND Corporation's Poor               | II        | 3          | —      |
| 07  | PayPal's Philosophers                     | II        | 4          | —      |
| 08  | Effective Altruism's Cold Equations       | II        | 4          | —      |
| 09  | Venture Capital's Ledger                  | II        | 4          | —      |
| 10  | Risk Scores and Redlining                 | III       | 5          | —      |
| 11  | Palantir's Panopticon                     | III       | 5          | —      |
| 12  | The Credit Score Society                  | III       | 5          | —      |
| 13  | The Respectable Calculus                  | III       | 5          | —      |
| 14  | The Mathematics of Solidarity             | IV        | Counter    | —      |
| 15  | Participatory Statistics and Data Justice | IV        | Counter    | —      |
| 16  | Orshansky's Children                      | IV        | Counter    | —      |
| 17  | Toward an Ethics of Measurement           | IV        | Counter    | —      |
| 18  | Conclusion — The Reckoning                | —         | —          | —      |
| MM1 | The Normal Distribution                   | Interlude | —          | —      |
| MM2 | Correlation and Regression                | Interlude | —          | —      |
| MM3 | Logistic Regression and Classification    | Interlude | —          | —      |
| MM4 | Neural Networks and the Black Box         | Interlude | —          | —      |

## Appendix B: TDA Research Programme Paper Index

| #   | Title                                          | Stage | Dependencies | Target Journal           | Compute        |
| --- | ---------------------------------------------- | ----- | ------------ | ------------------------ | -------------- |
| 1   | Markov Memory Ladder                           | 0     | —            | Sociological Methodology | CPU, minutes   |
| 2   | Mapper for Interior Trajectory Structure       | 1     | Paper 1      | Soc Methods & Research   | CPU, hours     |
| 3   | Zigzag Persistence for Business Cycle Topology | 1     | Paper 1      | Soc Methods & Research   | CPU, hours–day |
| 4   | Multi-Parameter PH for Poverty Trap Detection  | 2     | Paper 1      | JASA                     | GPU optional   |
| 5   | Cross-National Welfare State Topology          | 2     | Paper 1      | AJS                      | CPU            |
| 6   | Intergenerational Topological Inheritance      | 2     | Paper 1      | BJS                      | CPU            |
| 7   | Geometric Trajectory Forecasting               | 3     | Papers 1–3   | JMLR / NeurIPS           | GPU, hours     |
| 8   | GNNs on Household Social Graphs                | 3     | Paper 7      | Comp Social Science      | GPU            |
| 9   | Combinatorial Complex Neural Networks          | 3     | Paper 7      | NeurIPS / ICML           | Cloud GPU      |
| 10  | Topological Fairness Analysis                  | 3     | Paper 7      | FAccT                    | CPU, minutes   |

## Appendix C: Interactive Component Priority Matrix

| Interactive                    | Complexity | Dependency   | Learning Paths Using It | Priority     |
| ------------------------------ | ---------- | ------------ | ----------------------- | ------------ |
| Five Transitions Timeline      | High       | None         | Path 2                  | P0 — Phase 3 |
| Persistence Diagram Builder    | High       | D3/WebGL     | Paths 1, 4              | P0 — Phase 3 |
| Normal Distribution Explorer   | Medium     | D3           | Paths 1, 2              | P0 — Phase 3 |
| Poverty Threshold Simulator    | Medium     | D3           | Path 2                  | P0 — Phase 3 |
| Research Pipeline Graph        | Medium     | D3 force     | None (TDA hub)          | P0 — Phase 3 |
| Mapper Parameter Lab           | High       | D3/WebGL     | Path 4                  | P1 — Phase 5 |
| Filtration Playground          | High       | WebGL        | Paths 1, 4              | P1 — Phase 5 |
| Benefit Taper Calculator       | Medium     | D3           | Path 2                  | P1 — Phase 5 |
| Pyodide TDA Runner             | High       | Pyodide/WASM | Path 4                  | P1 — Phase 5 |
| Logistic Regression Classifier | Medium     | D3           | Paths 2, 4              | P2 — Phase 6 |
| Missing Data Explorer          | Low        | D3           | Path 3                  | P2 — Phase 6 |
| Category Builder               | Medium     | React        | Path 3                  | P2 — Phase 6 |
