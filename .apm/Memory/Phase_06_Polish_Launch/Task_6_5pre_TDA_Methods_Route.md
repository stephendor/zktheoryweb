---
agent: Agent_Infra
task_ref: Task 6.5-pre - TDA Methods Detail Route
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: false
---

# Task Log: Task 6.5-pre – TDA Methods Detail Route

## Summary

Created `src/pages/tda/methods/[slug].astro` generating 6 dynamic routes at `/tda/methods/{method_slug}`. Updated `PaperLayout.astro` to resolve method connection card hrefs to real URLs, removing `data-todo` flags.

## Details

1. **MethodLayout check**: `src/layouts/MethodLayout.astro` does not exist. Implemented layout inline in `[slug].astro` using `BaseLayout` with `section="tda"` as instructed.

2. **Route creation** (`src/pages/tda/methods/[slug].astro`):
   - `getStaticPaths()` collects all entries via `getCollection('methods')`, generates `params: { slug: entry.data.method_slug }` (not `entry.id`) for clean URLs.
   - Renders: TDA hero band with eyebrow "TDA Method", h1 title, status badge; prose article via `<Content />`; `ConnectionsPanel` with `related_papers` resolved to paper titles/hrefs via `getCollection('papers')` and `related_interludes` resolved via `getCollection('interludes')`.
   - Interlude connections use `href: '#'` with `dataTodo: 'interlude-route-missing'` since no interlude detail route exists yet.
   - Status badges use same modifier classes as PaperLayout (`planned`, `in-review`, `published`) with `drafting` mapped to `planned`.

3. **PaperLayout.astro update**:
   - Removed comment `// Method route does not exist yet — flag each card with data-todo`.
   - Changed both branches of `methodConnections` map from `href: '#'` to `href: \`/tda/methods/${slug}\``.
   - Removed `dataTodo: 'method-route-missing'` from both branches.

4. **Build/test/lint**: All three passed cleanly.

## Output

- `src/pages/tda/methods/[slug].astro` — new file, 6 routes
- `src/layouts/PaperLayout.astro` — methodConnections href updated, dataTodo removed

Page count: 126 (up from 120; +6 method pages)
Test count: 420 passing
Lint: 0 errors, 2 pre-existing warnings in `PovertySimulator.tsx` (react-hooks/exhaustive-deps, unrelated to this task)

Routes generated:
- `/tda/methods/persistent-homology`
- `/tda/methods/mapper`
- `/tda/methods/zigzag-persistence`
- `/tda/methods/multi-parameter-ph`
- `/tda/methods/markov-memory-ladder`
- `/tda/methods/graph-neural-networks`

## Issues

None.

## Next Steps

Interlude detail routes do not exist. `related_interludes` connections on method pages currently render with `href: '#'` and `dataTodo: 'interlude-route-missing'`. A future task should create `/counting-lives/interludes/[slug].astro` and update this panel when ready.
