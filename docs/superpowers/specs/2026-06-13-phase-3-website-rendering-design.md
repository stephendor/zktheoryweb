# Phase 3 Website Rendering Design

## Goal

Expose validated Phase 3 generated context in the website as a small, additive
rendering layer: derived connections on existing pages, confirmed Two Lenses
links on the learning hub, and a validation command that keeps generated data
honest before it becomes part of the normal build path.

## Context

Phase 3 already has strict contracts for generated exports, reference
resolution, fixture validation, and generated/hand-authored connection merging.
This phase consumes that contract layer from the Astro site without creating a
runtime dependency on the TDL repository, the TDA Research Obsidian vault, or the
Windows junction used to connect those local sources.

The junction is relevant to exporter design in later work, but not to this
website rendering layer. The website only reads checked-in JSON under
`src/data/generated/phase3/`.

## Scope

This rendering phase has six separated slices:

1. Generated data reader for Astro build code.
2. Page-level derived connection lookup.
3. `ConnectionsPanel` integration for generated links.
4. Layout integration, starting with chapter, paper, and learning module pages.
5. Confirmed Two Lenses rendering on the learning hub.
6. A validation gate script that makes Phase 3 checks easy to run before build.

Each slice should be independently testable and reviewable. The implementation
should avoid broad layout refactors and should not change the Phase 3 data
schemas unless rendering uncovers a genuine contract gap.

## Non-Goals

- Do not build the TDL or Obsidian exporter.
- Do not read from the vault junction, symlinks, or any local path outside the
  website repository during Astro build.
- Do not generate new public pages from Phase 3 JSON.
- Do not replace hand-authored frontmatter connections.
- Do not render `proposed` generated connections in public UI.
- Do not wire Phase 3 validation into `npm run build` until generated data has
  moved beyond small checked-in site exports.

## Data Policy

`src/data/generated/phase3/fixtures/` remains test-only. The rendering reader
should ignore fixture directories by default.

The site renderer reads direct JSON files under `src/data/generated/phase3/`.
If there are no non-fixture files, the reader returns an empty, valid render
payload. A website build with no generated Phase 3 data is a valid state.

If a non-fixture JSON file is present and fails `validatePhase3Export`, the
reader should fail loudly with an actionable error. Silent partial rendering is
allowed only for the absence of generated data, not for invalid generated data.

## Rendering Rules

Hand-authored connections remain the editorial source of truth. Generated
connections are appended after hand-authored groups and must be visually framed
as derived context, not as authorial claims.

The existing `mergeDerivedConnections` helper is the canonical merge rule:

- It keeps hand-authored links first.
- It filters out `proposed` generated links.
- It deduplicates generated targets already represented by hand-authored
  targets.
- It preserves pending-route metadata for unresolved future content.

Page lookup should be pure and keyed by contract references:

- chapter pages use `{ kind: "chapter", id: entry.id }`
- paper pages use `{ kind: "paper", id: entry.id }`
- learning modules use `{ kind: "learn-module", id: entry.id }`

The helper should return renderable connections and groups rather than asking
layouts to know Phase 3 contract details.

## UI Surfaces

### ConnectionsPanel

`ConnectionsPanel.astro` already supports flat connections and grouped
connections. It should remain a presentational component. If generated
connections need a distinct label, the layout should provide a group such as
`Derived from Phase 3` rather than adding Phase 3-specific logic to the
component.

### ChapterLayout

Chapter pages already render grouped connections for TDA papers and
mathematical interludes. The Phase 3 group should append to the existing
`Connections Forward` panel when generated links exist. Existing paper and
interlude links should be converted to keyed hand-authored connections only as
much as needed for dedupe.

### PaperLayout

Paper pages already render `Methods Used` and `Research Dependencies`. A
generated group should be added as a separate `ConnectionsPanel` or as an
additional group under a shared panel, whichever requires the smaller and
clearer layout change. Hand-authored methods and dependency links must still
render first.

### ModuleLayout

Learning modules use a sidebar list rather than `ConnectionsPanel`. Generated
links should be rendered in the sidebar as a small `Derived` group using the
same link style, after hand-authored related links. This keeps module pages
compact and avoids dropping full-width cards into the Tufte-style sidebar.

### Learn Index

The learning hub should render confirmed `twoLenses` entries as a concise
section between the path cards and the resources section. Draft entries stay out
of public UI. The section links to the contract `websitePath` and shows the
mathematical and political endpoints in a paired form.

## Test Strategy

Unit tests should cover:

- the rendering reader ignores fixtures and returns empty data when no
  non-fixture JSON exists;
- invalid non-fixture JSON fails with a useful error;
- page-level lookup filters by source reference and omits proposed links;
- generated links are deduped against hand-authored targets;
- confirmed Two Lenses entries are selected and draft entries are omitted.

Integration confidence should come from:

- `npm run validate:phase3`
- targeted Phase 3 unit tests
- `npm run check`
- `npm run build`

## Acceptance Criteria

- The website can build with zero non-fixture Phase 3 generated files.
- Checked-in non-fixture Phase 3 JSON can render derived links on matching pages.
- Public generated connections never include `proposed` items.
- Hand-authored page links continue to render first.
- Confirmed Two Lenses links appear on `/learn/`; draft links do not.
- No build-time code reads the TDL repo, the Obsidian vault, a junction target,
  or any local path outside this repository.
