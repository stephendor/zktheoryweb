CLAUDE.md — Project Guide for zktheory.org

1.  Project Context & Vision

    Core Principle: The mathematics (TDA) and the politics (poverty measurement) are inseparable; design and code must reflect this duality.

    Primary Stack: Astro 5.x (Content Layer), Tailwind CSS 4, React 19 (for interactive islands), TypeScript.

    Math Rendering: Use rehype-katex for compile-time LaTeX rendering; avoid client-side MathJax.

2.  Specialized Code Standards

    Content Architecture: Use MDX for all long-form content to allow React components inside prose.

    Type Safety: Every content collection must have a strict Zod schema in src/content/config.ts matching the PRD data models.

    Styling Palette: \* Counting Lives: Use the "Archival" palette (muted reds, ochre, charcoal).

        TDA: Use the "Mathematical" palette (deep teals, slate blue).

        Typography: Serif for body (Charter/Source Serif); Sans-serif for UI (Instrument Sans); Monospace for code (JetBrains Mono).

3.  Workflow for Agents (Claude Code / Copilot)

    Design Pattern: Follow the "Tufte" tradition—use sidenotes/margin notes instead of standard footnotes where screen width permits.

    Interactive Components: Use D3.js or Three.js for visualisations; ensure every interactive is a self-contained React island.

    Accessibility: All components must meet WCAG 2.1 AA standards, including keyboard-navigable filtration sliders.

    Bibliography: Integrate with the Zotero Web API v3 at build-time to fetch and cache citations in src/data/zotero-library.json.

4.  Important Metadata

    Domain: zktheory.org.

    Deployment: Netlify with Astro adapter.

    Search: Pagefind for static, zero-config indexing.
