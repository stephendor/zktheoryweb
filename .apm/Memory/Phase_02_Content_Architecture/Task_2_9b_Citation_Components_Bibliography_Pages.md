---
agent: Agent_Integration
task_ref: Task 2.9b
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 2.9b — Citation Components & Bibliography Pages

## Summary

Built the full citation display system: `bibliography.ts` utilities, `CitationPopover` React island, `BibliographyFilter` React island, `BibliographyList.astro` shell, both bibliography pages, and dev integration test. `npm run lint` and `npm run build` pass with 0 errors.

## Details

**Step 1 — `src/lib/bibliography.ts` + `CitationPopover`**
- `getBibliographyItems()` imports `@data/zotero-library.json` at module level, filters out `note`/`attachment` types, returns 136 real items.
- `getCitationByKey(key)`, `formatAuthorList(creators)`, `formatCitation(item)` implemented per spec.
- `generateBibTeX(item)` added to this file (also Step 3 spec): maps Zotero `itemType` → BibTeX entry type; citation key as `{lastname}{year}{firstTitleWord}`; includes all optional fields when present.
- `CitationPopover.tsx` + `CitationPopover.css`: button-wrapped `<cite>` trigger; tooltip below trigger with right-edge flip via `getBoundingClientRect`; `role="tooltip"`, `aria-describedby`, `aria-hidden`; mouse + keyboard open/close; Escape + click-outside dismiss; reduced motion via `.cp-tooltip--instant` class.

**Step 2 — `BibliographyFilter.tsx` + `BibliographyList.astro` + bibliography pages**
- `BibliographyFilter.tsx` + `BibliographyFilter.css`: React island (`client:load`) with live text search + tag pill filtering, `aria-pressed` tags, `aria-live` count, clear-filters button, per-item author/year/title/venue/DOI/URL/tags/BibTeX button.
- `BibliographyList.astro`: Astro shell component that wraps the React island.
- `src/pages/counting-lives/bibliography.astro`: CL red accent, falls back to full 136-item list (see Important Findings).
- `src/pages/tda/bibliography.astro`: TDA teal accent, same fallback.

**Step 3 — BibTeX generation boundary correction**
- Refactored: `generateBibTeX(item)` is called in `BibliographyList.astro` (server/build time) per item, producing `BibliographyEntry = ZoteroItem & { bibtex: string }`. Pre-computed strings are passed as props to the React island. `BibliographyFilter.tsx` uses `item.bibtex` directly — `generateBibTeX` is NOT imported client-side. Keeps client bundle lean; no risk of JSON cache being bundled into client JS.
- `BibliographyEntry` type is exported from `BibliographyFilter.tsx` and imported by `BibliographyList.astro`.

**Step 4 — Integration test + build**
- `src/content/writing/essays/citation-test.mdx`: draft essay with 3 real Zotero keys (`G7VZ6UKQ`, `X3E3AWXN`, `RQ2S8QZX`); imports `getBibliographyItems()` filtered to test keys; uses `<CitationPopover client:visible>` inline in prose.
- `src/pages/dev/citation-test.astro`: renders the draft essay via `PostLayout` for dev inspection at `/dev/citation-test/`.
- `npm run lint`: 0 errors (confirmed).
- `npm run build`: clean, 22 pages pre-rendered including `/counting-lives/bibliography/`, `/tda/bibliography/`, `/dev/citation-test/`, `/writing/essays/citation-test/`.

## Output

Created files:
- `src/lib/bibliography.ts` — utility functions + BibTeX generator
- `src/components/shared/CitationPopover.tsx` — React island
- `src/components/shared/CitationPopover.css` — scoped `.cp-` styles, CL red accent
- `src/components/shared/BibliographyFilter.tsx` — searchable/filterable React island (`client:load`)
- `src/components/shared/BibliographyFilter.css` — scoped `.bibf-` styles, accent via CSS custom prop
- `src/components/shared/BibliographyList.astro` — Astro shell, pre-computes BibTeX at build time
- `src/pages/counting-lives/bibliography.astro` — CL bibliography page
- `src/pages/tda/bibliography.astro` — TDA bibliography page
- `src/content/writing/essays/citation-test.mdx` — dev integration test (draft: true)
- `src/pages/dev/citation-test.astro` — dev test route

## Issues

None — all lint and build checks pass.

## Important Findings

**Zotero library tags do not match expected project-specific tags.** The `zotero-library.json` cache (136 real items) contains only generic Library of Congress subject headings: `Great Britain`, `Poor`, `History`, `Statistics`, `Biography`, `Objectivity`, etc. No tags matching `counting-lives`, `poverty-measurement`, `tda-methods`, `topology`, or `persistent-homology` were found. As a result, both bibliography pages (`/counting-lives/bibliography/` and `/tda/bibliography/`) currently fall back to rendering the full unfiltered 136-item list. Each page displays a prominent note explaining this. The tag filter code is in place and will activate automatically once the Zotero library is tagged with project-specific values. Manager Agent should consider whether tagging the Zotero library is a planned action or whether an alternative filtering strategy is needed (e.g. filtering by Zotero collection ID rather than tags).

## Next Steps

- Tag Zotero library items with project-specific tags (`counting-lives`, `tda-methods`, etc.) and update the `CL_TAGS`/`TDA_TAGS` sets in the bibliography pages, OR switch filtering to use Zotero collection IDs (`item.collections` field is present in `ZoteroItem`).
- Verify `CitationPopover` manually at `/dev/citation-test/` — hover, keyboard (Tab/Enter/Escape), tooltip content, right-edge flip behaviour.
- Verify `/counting-lives/bibliography/` and `/tda/bibliography/` — item list renders, tag filter pills appear, search input filters results, BibTeX copy button works.
