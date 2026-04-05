---
agent: Agent_Integration
task_ref: Task 6.7
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 6.7 – SEO, Open Graph & Structured Data

## Summary

Implemented full site discoverability: extended OG/Twitter tags in BaseLayout, injected JSON-LD structured data on all four page types (Chapter, ScholarlyArticle, Person, LearningResource), added citation_* meta tags on paper pages, installed and configured @astrojs/sitemap, verified RSS feed, and added `rel="me"` to the ORCID link. Build passes, 126 pages, 420 tests, 0 lint errors.

## Details

- **Step 1 – BaseLayout (`src/layouts/BaseLayout.astro`):** Added `og:site_name` (`zktheory.org`), Twitter/X card tags (`twitter:card`, `twitter:title`, conditional `twitter:description`), and `<slot name="head" />` as last item before `</head>`. Slot enables per-layout JSON-LD injection via `<Fragment slot="head">` without altering BaseLayout's component API.

- **Step 2a – ChapterLayout (`src/layouts/ChapterLayout.astro`):** Injected `Chapter` JSON-LD with `name`, `isPartOf` (Book: "Counting Lives"), `position` (chapter_number), `description` (spine_role), and author stub.

- **Step 2b – PaperLayout (`src/layouts/PaperLayout.astro`):** Computed `canonicalURL` in frontmatter. Injected `ScholarlyArticle` JSON-LD with `name`, `description` (abstract ?? plain_summary), author, `isPartOf` (Collection: "TDA Research Programme"), and `position` (paper_number). Added four Google Scholar citation meta tags: `citation_title`, `citation_author` ("Dorling, Stephen"), `citation_publication_date` (current year), `citation_abstract_html_url`.

- **Step 2c – About page (`src/pages/about/index.astro`):** Injected `Person` JSON-LD with `name`, `url`, and `knowsAbout` array. ORCID link updated with `rel="me noopener noreferrer"`. See Important Findings re: missing ORCID/institution.

- **Step 2d – ModuleLayout (`src/layouts/ModuleLayout.astro`):** Injected `LearningResource` JSON-LD for both active learning paths (topology-social-scientists, mathematics-of-poverty) and any future paths. Includes `name`, `description` (core_concept), `educationalLevel`, `isPartOf` (Course with path name via existing `toPathLabel()`), `position` (module_number), `provider`, and `url`.

- **Step 3 – Sitemap:** Installed `@astrojs/sitemap@3.7.2`. Added `import sitemap from '@astrojs/sitemap'` and `sitemap()` to `astro.config.mjs` integrations. `site: 'https://zktheory.org'` was already present. Build produced `dist/sitemap-index.xml` and `dist/sitemap-0.xml` covering all 126 pages.

- **Step 4 – RSS feed:** `src/pages/writing/rss.xml.ts` verified correct — title "zktheory.org — Writing", uses `context.site`, includes all non-draft essays and notes, `pubDate` from `entry.data.date`. No changes needed.

- **Step 5 – ORCID `rel="me"`:** Done as part of Step 2c. The placeholder link now has `rel="me noopener noreferrer"`.

## Output

Modified files:
- `src/layouts/BaseLayout.astro` — og:site_name, Twitter/X tags, head slot
- `src/layouts/ChapterLayout.astro` — Chapter JSON-LD via Fragment slot="head"
- `src/layouts/PaperLayout.astro` — canonicalURL, ScholarlyArticle JSON-LD, citation_* meta tags
- `src/layouts/ModuleLayout.astro` — LearningResource JSON-LD via Fragment slot="head"
- `src/pages/about/index.astro` — Person JSON-LD, rel="me" on ORCID link
- `astro.config.mjs` — sitemap import and integration

Build artifacts confirmed:
- `dist/sitemap-index.xml` — created
- `dist/sitemap-0.xml` — created
- `dist/counting-lives/chapters/ch-01/index.html` — contains `application/ld+json`
- `dist/tda/papers/paper-01/index.html` — contains `citation_title`
- `dist/about/index.html` — contains `Person` JSON-LD

## Issues

None. No build errors, no new lint errors, 420/420 tests pass.

## Important Findings

1. **ORCID/institution are placeholders**: `src/pages/about/index.astro` contains TODO placeholder links (`href="/todo/orcid"`) and placeholder institution text (`[institution]`). The `identifier`, `sameAs`, and `affiliation` fields were intentionally omitted from the `Person` JSON-LD to avoid inventing values. These should be populated when the author supplies real ORCID and institutional affiliation. Manager should track this as a content task for pre-launch.

2. **`citation_publication_date` uses build year**: Per-paper publication dates are not in the schema (no `date` or `publication_date` field in `papers` collection frontmatter). Using `new Date().getFullYear().toString()` as a pragmatic fallback. If individual paper dates are added to the schema in future, this should be updated.

3. **Lint warnings pre-existing**: 2 `react-hooks/exhaustive-deps` warnings in `PovertySimulator.tsx`. These are pre-existing and unrelated to this task.

## Next Steps

- Author should supply real ORCID and institutional affiliation to complete Person JSON-LD (identifier, sameAs, affiliation fields).
- Consider adding a `date` field to the `papers` collection schema to support accurate `citation_publication_date`.
