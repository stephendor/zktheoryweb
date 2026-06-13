# Phase 3 Website Contract Design

**Date:** 2026-06-13
**Project:** zktheory.org
**Status:** Approved design direction

## Summary

Phase 3 for `zktheoryweb` starts with a website-side contract and validation layer. The site already has Astro content collections, MDX pages, Zotero caching, learning paths, cross-project connection panels, and Two Lenses UI components. The next useful step is not a live vault importer. It is a small, testable boundary that defines what vault-derived exports must look like before they are allowed to influence the public site.

The website should treat TDA, Counting Lives, Obsidian vaults, and TDL exports as external inputs. The local Windows junction between the TDL repo and the TDA-Research Obsidian vault is useful for exporter development, but it must not become a production build dependency. Netlify should be able to build from checked-in generated JSON, the existing Zotero environment variables, and the standard Astro build.

## Background

The Phase 3 process document describes advanced integration work across several systems:

- 3.1 ephemeral focused research contexts
- 3.2 cross-vault linker
- 3.3 website content pipeline
- 3.4 hardened scripts
- 3.5 Zotero MCP integration
- 3.6 Claude Code and tooling profiles
- 3.7 later synthetic-data and fine-tuning ideas

For this repository, the relevant Phase 3 subset is 3.2 and 3.3, with 3.4 as a dependency for upstream exporters. The site already implements many public-facing targets by hand: Counting Lives chapters, TDA paper and method pages, learning modules, interactives, bibliography pages, Pagefind, and Zotero fetch/caching. Phase 3 should therefore define a migration path from hand-authored metadata to validated generated metadata, rather than replacing the current site architecture.

## Design Decision

Use a **contract-first** approach.

The website defines strict JSON contracts, fixtures, validation rules, and additive consumption helpers. Separate TDL or vault agents can later generate JSON matching these contracts. Until then, local fixtures allow the website behavior to be tested without requiring either vault, the junction, Zotero MCP, or TDL scripts.

## Goals

1. Define website-side schemas for vault-derived Phase 3 metadata.
2. Validate generated data before Astro pages consume it.
3. Preserve current MDX frontmatter as canonical rendered content during the first Phase 3 pass.
4. Add generated links and Two Lenses metadata only as additive derived context.
5. Keep Netlify builds deterministic and independent of local Windows junction paths.
6. Give separate agents clear handoff contracts for later exporter, linker, and Zotero-alignment work.

## Non-Goals

1. Do not build the cross-vault linker inside `zktheoryweb`.
2. Do not read Obsidian vaults directly during `npm run build`.
3. Do not require the TDL repo or the Windows junction for the website build.
4. Do not replace existing MDX content collections with generated content in the first pass.
5. Do not allow generated data to silently override hand-authored frontmatter.
6. Do not integrate Zotero MCP into the website build. The existing Zotero Web API cache remains the production bibliography path.

## Current Site Baseline

The contract layer should fit the current codebase:

- `src/content.config.ts` defines strict Astro content collection schemas.
- `astro.config.mjs` already prefetches Zotero data and falls back to cached data.
- `src/data/zotero-library.json` is the static bibliography cache.
- `src/components/shared/ConnectionsPanel.astro` renders cross-project connection cards.
- `src/components/shared/TwoLensesToggle.tsx` and `src/components/shared/LensSection.tsx` support the Two Lenses reading mode pattern.
- `src/layouts/ChapterLayout.astro`, `src/layouts/PaperLayout.astro`, and `src/layouts/ModuleLayout.astro` already resolve several hand-authored connections.
- `src/data/learnPaths.ts` is still the source of truth for learning path landing-page metadata.

The first Phase 3 implementation should add a layer beside these systems, then wire it in carefully.

## Proposed File Boundaries

The implementation plan should keep files small and purpose-specific:

- `src/lib/phase3/contracts.ts`
  - Zod schemas and TypeScript types for all Phase 3 JSON contracts.
- `src/lib/phase3/loadGeneratedData.ts`
  - Reads generated JSON files, validates them, and returns typed data.
- `src/lib/phase3/resolveSiteReferences.ts`
  - Resolves generated references against known site routes and content IDs.
- `src/lib/phase3/mergeDerivedConnections.ts`
  - Merges generated derived connections with hand-authored frontmatter without overwriting the hand-authored source.
- `scripts/validate-phase3-data.mjs`
  - CLI validation entry point for fixtures and checked-in generated JSON.
- `src/data/generated/phase3/`
  - Checked-in generated JSON intended for the site build.
- `src/data/generated/phase3/fixtures/valid/`
  - Small fixtures that normal validation can accept.
- `src/data/generated/phase3/fixtures/invalid/`
  - Small fixtures that tests use to prove validation fails correctly.
- `src/lib/phase3/*.test.ts`
  - Vitest coverage for contracts, validation, reference resolution, and merge behavior.

## Contract 1: Export Manifest

Every generated export should include a manifest so the site can explain where the data came from and whether it is fresh enough to trust.

Required fields:

- `schemaVersion`: semantic version string, initially `"1.0.0"`.
- `generatedAt`: ISO timestamp.
- `exporter`: object with `name`, `version`, and optional `commit`.
- `sources`: array of source descriptors.
- `warnings`: array of non-fatal warning objects.

Source descriptor fields:

- `sourceId`: stable ID such as `"tda-research"` or `"counting-lives"`.
- `sourceType`: enum of `"obsidian-vault"`, `"tdl-repo"`, `"manual-fixture"`, or `"zotero-cache"`.
- `label`: human-readable source label.
- `localPath`: optional local path for development diagnostics only.
- `vaultMapPath`: optional relative path to the relevant `VAULT-MAP.md`.
- `lastIndexedAt`: optional ISO timestamp when the upstream index was last refreshed.

The validator must never require `localPath` to exist during a production build.

## Contract 2: Site References

Generated metadata should refer to the public website through stable typed references rather than raw paths wherever possible.

Reference fields:

- `kind`: enum of `"chapter"`, `"paper"`, `"method"`, `"interlude"`, `"learn-module"`, `"interactive"`, `"writing-note"`, `"writing-essay"`, or `"external"`.
- `id`: stable content ID, such as `"ch-17"` or `"paper-01"`.
- `slug`: optional URL slug when the ID and route differ.
- `href`: optional explicit URL for external references or pending routes.
- `status`: enum of `"resolved"`, `"pending"`, or `"external"`.
- `label`: short display label.
- `title`: display title.

Validation rules:

- Internal references with `status: "resolved"` must resolve to an existing content entry or known route.
- Internal references with `status: "pending"` may fail route resolution but must include a label and title.
- External references must include `href`.
- Raw local vault paths must not be used as website links.

## Contract 3: Two Lenses Links

Two Lenses links represent confirmed mathematical/political pairings. Proposed links belong in reports, not in the public site data.

Required fields:

- `id`: stable slug-like identifier.
- `title`: public-facing title.
- `status`: enum of `"confirmed"` or `"draft"`.
- `mathematical`: site reference.
- `political`: site reference.
- `rationale`: 1-3 sentence explanation.
- `websitePath`: proposed or actual website path, for example `"/learn/topology-and-justice/"`.
- `concepts`: array of concept labels.
- `sourceNoteRefs`: optional array of upstream note references for traceability.
- `zoteroKeys`: optional array of Zotero item keys or citation keys.

Validation rules:

- The public renderer only consumes `status: "confirmed"`.
- Every confirmed entry must have one mathematical side and one political side.
- Both sides must be resolved or explicitly pending.
- `websitePath` must be a root-relative URL beginning with `/`.
- `rationale` must not be empty.

## Contract 4: Derived Connections

Derived connections describe links inferred from vault metadata, VAULT-MAP entries, shared citations, or a cross-vault report.

Required fields:

- `id`: stable connection ID.
- `source`: site reference for the page receiving the connection.
- `target`: site reference for the linked page.
- `connectionType`: enum of `"two-lenses"`, `"method-used"`, `"chapter-related-paper"`, `"shared-citation"`, `"learning-path"`, or `"manual-curation"`.
- `confidence`: enum of `"confirmed"`, `"reviewed"`, or `"proposed"`.
- `rationale`: short explanation.
- `origin`: enum of `"vault-export"`, `"cross-vault-linker"`, `"manual-fixture"`, or `"manual-curation"`.

Validation rules:

- Public renderers may show `confirmed` and `reviewed` connections.
- Public renderers must not show `proposed` connections unless a page explicitly asks for a review/debug view.
- Generated connections are additive. They cannot delete, replace, or mutate MDX frontmatter arrays such as `related_tda_papers`, `related_interludes`, or `connections`.
- Duplicate target links should be deduped by target `kind` and `id`, with hand-authored links winning over generated links.

## Contract 5: Learning Path Export

Learning path export metadata should enrich the existing `src/data/learnPaths.ts` and `learn-modules` collection without replacing either in the first pass.

Required fields:

- `pathSlug`: one of the current learning path slugs.
- `generatedModules`: array of module descriptors.
- `recommendedConnections`: array of derived connection IDs.
- `twoLensesIds`: array of confirmed Two Lenses IDs relevant to the path.

Module descriptor fields:

- `moduleId`: existing content entry ID such as `"path2-module-6"`.
- `concepts`: array of concept labels.
- `sourceNoteRefs`: optional traceability references.
- `status`: enum of `"aligned"`, `"needs-review"`, or `"missing-site-content"`.

Validation rules:

- `pathSlug` must exist in `src/data/learnPaths.ts`.
- `moduleId` must resolve to a `learn-modules` entry unless marked `"missing-site-content"`.
- Missing modules are allowed only as planning signals, not rendered page links.

## Fixture Strategy

Check in small fixtures under `src/data/generated/phase3/fixtures/`.

Valid fixtures:

- `valid-minimal.json`
  - One manifest, one confirmed Two Lenses link, one derived connection, one learning path enrichment.
- `pending-reference.json`
  - A pending route with complete label and title; validation must pass but emit a warning.
- `proposed-link.json`
  - A proposed cross-vault connection; validation passes, public consumption excludes it.
- `local-junction-path.json`
  - Includes development-only `localPath`; validation must not require the path to exist.

Invalid fixtures:

- `broken-reference.json`
  - A resolved internal route that does not exist; validation must fail in the negative fixture test.
- `duplicate-ids.json`
  - Two records with the same stable ID; validation must fail in the negative fixture test.

These fixtures let agents test the website contract without reading either vault. Normal validation reads checked-in generated JSON and valid fixtures. Unit tests explicitly load invalid fixtures and assert that they fail.

## Validation Behavior

The validation script should support:

```bash
npm run validate:phase3
```

Expected behavior:

- Validate checked-in generated JSON and fixtures under `src/data/generated/phase3/fixtures/valid/`.
- Print clear counts for manifests, Two Lenses links, derived connections, pending references, warnings, and errors.
- Exit with code `0` for valid data and warnings.
- Exit with nonzero status for schema errors, missing required fields, unresolved `resolved` references, invalid URLs, or duplicate IDs.

This script should be runnable in CI and locally. It should not perform network access.

## Consumption Behavior

Consumption should be introduced after validation exists.

Initial render behavior:

- Existing MDX frontmatter remains canonical.
- Generated data is read as derived context.
- `ConnectionsPanel.astro` can receive a visible label such as "Derived Connections" or grouped entries that distinguish hand-authored and generated sources.
- Chapter, paper, method, and module pages may show generated links only after dedupe and confidence filtering.
- Two Lenses pages or sections should consume only confirmed links.

Merge rule:

1. Load hand-authored content collection data.
2. Load validated generated data.
3. Resolve generated references against the site.
4. Filter out `proposed` connections.
5. Dedupe against hand-authored links.
6. Render hand-authored links first, derived links second.

This makes generated data useful while keeping editorial control clear.

## Junction and Deployment Policy

The Windows junction between the TDL repo and the TDA-Research Obsidian vault is a local development convenience. It may be used by upstream exporter scripts, but the website contract treats it only as optional diagnostic metadata.

Policy:

- `npm run build` must not traverse the junction.
- `npm run validate:phase3` must not require the junction.
- Generated JSON may include `localPath` for traceability.
- Validators may check the syntax of `localPath` but not its existence by default.
- A future local-only diagnostic mode may check path existence, but it must be opt-in.

## Agent Handoff Boundaries

After this contract is implemented, separate agents can work without blocking each other.

### Website Contract Agent

Owns schemas, fixtures, validation, and tests in `zktheoryweb`.

### Website Rendering Agent

Owns helpers and page integration after the contract is stable. It consumes validated data only.

### TDL/Vault Export Agent

Works outside this repo. Reads VAULT-MAP files, Two Lenses frontmatter, shared citekeys, and junction-aware local paths. Emits JSON matching the website contract.

### Cross-Vault Linker Agent

Works outside the public renderer. Produces proposed and confirmed link reports. It should not silently write public website data.

### Zotero Alignment Agent

Checks citekey and Zotero key consistency later. It may use Zotero MCP during development, but production website builds keep using the Web API cache.

## Testing Plan

The implementation plan should include:

- Unit tests for each Zod schema.
- Fixture validation tests covering success, warning, and failure cases.
- Reference resolution tests against Astro content collections or a stable route manifest.
- Merge tests proving hand-authored metadata wins over generated duplicates.
- A script test proving validation does not require local vault paths.
- A build/check step confirming the new contract layer does not break `npm run check` or `npm run build`.

## Risks

### Scope Creep

Risk: The website contract turns into a full vault exporter.

Mitigation: Keep vault reading out of this repository. Accept only JSON fixtures and checked-in generated JSON.

### Hidden Local Dependency

Risk: The Windows junction works locally and accidentally becomes required.

Mitigation: Treat local paths as diagnostic metadata only. Do not check existence during normal validation or build.

### Generated Data Overrides Editorial Intent

Risk: Derived connections overwrite hand-authored MDX frontmatter.

Mitigation: Generated connections are additive and lower priority than hand-authored content.

### Proposed Links Leak Publicly

Risk: Cross-vault suggestions appear on public pages before review.

Mitigation: Public renderers consume only `confirmed` and `reviewed` connections. `proposed` connections remain validation/reporting data.

## Acceptance Criteria

The design is ready to become an implementation plan when:

1. The website-side JSON contracts are stable enough for an exporter agent to target.
2. The first implementation can be completed without touching external vaults.
3. Validation can run against fixtures in this repository.
4. Netlify build behavior remains unchanged except for optional validation.
5. Later exporter and linker agents have clear output expectations.
