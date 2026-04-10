---
agent: Agent_Schema_Platform
task_ref: Task 7.6 - Homepage Latest Updates — Mixed Editorial Feed
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: false
---

# Task Log: Task 7.6 - Homepage Mixed Editorial Feed

## Summary

Replaced the broken sort-by-number homepage feed with a three-slot mixed editorial feed: one featured chapter, one featured paper, and the most recent non-draft writing entry. All five steps completed successfully; build, tests, and lint passed and changes are pushed to main.

## Details

1. **Schema (Step 1):** Added `featured: z.boolean().default(false)` to both the `chapters` schema (after `key_claims`) and the `papers` schema (after `bibtex`) in `src/content.config.ts`.

2. **Frontmatter (Step 2):** Added `featured: true` to `src/content/counting-lives/chapters/ch-01.mdx` (inserted before `key_claims`) and to `src/content/tda/papers/paper-01.mdx` (inserted before `bibtex`).

3. **Query logic (Step 3):** Replaced the old `recentChapters`/`recentPapers` sort-by-number queries in `src/pages/index.astro` frontmatter block with the full mixed-feed query: `featuredChapter` (filtered with `ch.id !== 'ch-00-sample'`), `featuredPaper`, and `latestWriting` (essays + notes merged, sorted by date desc, first non-draft entry). Typed with a local `WritingEntry` type.

4. **Template (Step 4):** Replaced the `<ul class="activity-list">` block and section heading. New heading: "Selected Work & Writing". Three conditional `<li>` slots — chapter links to `/counting-lives/ch-{chapter_number}/`, paper links to `/tda/papers/{p.id}/`, writing links to `/writing/{slug}/`. Each slot silently skipped if undefined. `activity-footer` links unchanged.

5. **Verification (Step 5):**
   - `npm run build`: ✓ 127 pages built, no errors
   - `npm test`: ✓ 429 tests passed (21 test files)
   - `npm run lint`: ✓ 0 errors (2 pre-existing warnings in `PovertySimulator.tsx`, unrelated to this task)
   - Commit: `4f7b6c9` — `feat: homepage mixed editorial feed (featured chapter/paper + latest writing)`
   - Pushed to `origin/main`

## Output

- `src/content.config.ts` — `featured` field added to `chapters` and `papers` schemas
- `src/content/counting-lives/chapters/ch-01.mdx` — `featured: true` added to frontmatter
- `src/content/tda/papers/paper-01.mdx` — `featured: true` added to frontmatter
- `src/pages/index.astro` — query logic and template rewritten with mixed editorial feed

## Issues

None

## Next Steps

None — task complete. The two pre-existing lint warnings in `PovertySimulator.tsx` were present before this task; they do not require action here but could be addressed in a future cleanup task.
