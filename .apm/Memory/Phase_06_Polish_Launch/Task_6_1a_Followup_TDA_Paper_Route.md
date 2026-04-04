---
agent: Agent_Infra
task_ref: Task 6.1a-followup - TDA Paper Detail Route
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 6.1a-followup – TDA Paper Detail Route

## Summary

Created `src/pages/tda/papers/[slug].astro` generating 10 paper detail routes, and removed `data-todo="paper-detail-route"` attributes from the TDA hub. Build passes at 113 pages; 420 tests passing; 0 lint errors.

## Details

**`paper-01-sample.mdx` exclusion decision:**
No separate `paper-01.mdx` exists — `paper-01-sample.mdx` is the actual Paper 1 file with real content (`paper_number: 1`, genuine `key_findings`, methods, etc.). It was **not** excluded. All 10 paper files are included in the route. The `-sample` suffix in the filename is cosmetic — it follows a different naming pattern from the chapter collection's `ch-00-sample.mdx` (which was a true template with no real chapter number). This naming asymmetry is worth noting for future content management.

**Route creation:**
- `getStaticPaths()` collects all papers, sorts by `paper_number`, builds prev/next refs with `{slug: entry.id, title: entry.data.title}` shape matching `PaperLayout.astro`'s `PaperRef` interface.
- Pattern follows `src/pages/counting-lives/chapters/[slug].astro` from Task 6.1a exactly.
- Paper 1 URL: `/tda/papers/paper-01-sample/` (entry.id is the file stem).

**TDA hub cleanup:**
- Removed `data-todo="paper-detail-route"` attribute from paper card `<a>` elements in `src/pages/tda/index.astro`.

## Output

- **Created:** `src/pages/tda/papers/[slug].astro`
- **Modified:** `src/pages/tda/index.astro` (removed `data-todo` attributes)
- **Final page count:** 113 pages (Pagefind indexed; +10 from Task 6.1a's 103)
- **Tests:** 420 passing, 20 test files
- **Lint:** 0 errors, 2 pre-existing warnings in `PovertySimulator.tsx`

## Issues

None.

## Important Findings

**Naming inconsistency — `paper-01-sample.mdx` vs real paper:**
The TDA papers collection uses `paper-01-sample.mdx` as the filename for the actual Paper 1, while the chapters collection used `ch-00-sample.mdx` as a true template (excluded from routes). These are not parallel patterns — `paper-01-sample` is real content, `ch-00-sample` is a placeholder. If content authors add more paper files in future, the `-sample` name may cause confusion. Manager may wish to rename `paper-01-sample.mdx` to `paper-01.mdx` in a future clean-up task (would require updating any hardcoded references and the TDA hub's existing `/tda/papers/paper-01-sample` link would need updating).

## Next Steps

- Optional: rename `paper-01-sample.mdx` → `paper-01.mdx` for naming consistency with other paper files.
- All TDA paper card links in `/tda/` hub are now live.
