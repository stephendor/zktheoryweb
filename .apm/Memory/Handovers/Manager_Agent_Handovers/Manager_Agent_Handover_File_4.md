---
agent_type: Manager
agent_id: Manager_4
handover_number: 4
current_phase: "Phase 7: Post-Launch Hardening & Author Content"
active_agents: []
---

# Manager Agent Handover File — zktheory.org Research Portfolio Website

## Active Memory Context

**User Directives (standing — carry forward always):**
- One issue per exchange. Do not batch multiple tasks into a single response. User confirms after each step.
- Verify against actual code before treating anything as a bug. Many reported issues are correct behaviour.
- Present options as lettered choices with a recommendation when multiple approaches exist. User picks, then says "proceed".
- **Verification:** `npm test` (unit tests) + `npm run lint`. For local preview: `npx serve dist`. Do NOT rely on `npm run build` output alone — Netlify adapter was removed; build now completes cleanly both locally and in Netlify CI.
- Never create markdown documentation files unless explicitly requested.
- Commit and push each unit of work immediately after verification. Do not batch commits.
- Push fixes directly to `main` for small changes. Feature branch + PR for larger multi-task phases.
- `status: 'stub'` is invalid in Zod schemas — use `'drafting'` for placeholder content.
- **Scope discipline:** Only stage/commit files directly modified by the task. Audit any drifting files in `git status` before staging. Never commit `astro.config.mjs`, `.gitignore`, or config files unless the task explicitly targets them.
- User is the website author — never fabricate biographical, academic, or institutional content. Always wait for author-supplied text.
- User is terse. No preamble. Show test/build results inline (e.g. "429 tests, 0 errors"). Direct pushes to `main` for small changes are expected.

**Standing technical constraints:**
- `ch-00-sample.mdx` has `chapter_number: 1` (same as real Ch.1). All chapter collection filters MUST use `id !== 'ch-00-sample'`, NOT `chapter_number > 0`.
- `<script type="application/ld+json">` is exempt from `script-src` — do not include these in CSP hash lists.
- Two CSP-hashed scripts contain `<` in their minified bodies (pagefind init = `gMV9`, Astro islands bootstrap = `QJZDUlo`). The hash generator `scripts/gen-csp-hashes.mjs` must use non-greedy `[\s\S]*?` matching — never `[^<]+`. Run `node scripts/gen-csp-hashes.mjs` after any change to BaseLayout.astro, SiteNav.astro, StickyToC.astro, glossary/index.astro, reading-lists/index.astro, or any Astro/pagefind upgrade.
- CSP `style-src 'unsafe-inline'` is intentional — required by KaTeX inline `style=` attributes. Do not remove.
- `react-hooks/exhaustive-deps` warning at `PovertySimulator.tsx:340` — intentional, permitted.
- WebKit E2E test skip for PDB 3D animation — intentional.
- `TwoLensesToggle.tsx` uses `document.querySelector('.interlude-content')` to set `data-lens` — NOT a DOM-walk via `parentElement`. Astro island wrappers (`<astro-island>`) break the parent chain. Do not revert to the walk pattern.
- Pyodide is INFEASIBLE (no WASM wheels for TDA libs). TDA Results Explorer uses pre-computed JSON. Final decision — do not revisit.

## Current Build State (main, as of 2026-04-09)

- **Last deploy:** 531e041 — "fix: restore 12 CSP hashes"
- **Pages:** 127 | **Tests:** 429 (21 files) | **Lint:** 0 errors, 2 warnings (permitted)
- **Vulnerabilities:** 0
- **CSP:** 12 executable inline script hashes in `netlify.toml`. Correct and verified.
- **Node:** 22 (`netlify.toml`)
- **Netlify adapter:** Removed (`@astrojs/netlify` incompatible with `output: 'static'`). Headers/redirects via `netlify.toml` only.
- **Zotero cache:** `src/data/zotero-library.json` version 682. Build hook wired in `astro.config.mjs`. Env vars `ZOTERO_USER_ID` + `ZOTERO_API_KEY` set in Netlify UI.

## Phase 7 Task Status

| Task | Title | Status | Notes |
|------|-------|--------|-------|
| 7.1 | About Page Content Pass | **Partially complete** | Email, GitHub, ORCID, Scholar, institution live. Still needed (author must supply): positionality statement, CV education, CV presentations, short bio, long bio, headshot, institutional staff profile URL, CV PDF. File: `src/pages/about/index.astro`. |
| 7.2 | Paper 1 arXiv Update | **Blocked** | Waiting on arXiv submission. Mark complete when author provides submission date + BibTeX key. |
| 7.3 | rAF Animation Pause Controls | **Complete** | Commit f3bc7a3. |
| 7.4 | CSP Hardening | **Complete** | 12 hashes, corrected regex in gen-csp-hashes.mjs (531e041). |
| 7.5 | Zotero Build Hook | **Complete** | Cache + hook + env vars all in place. |

## Next Actions

**Immediate:** Task 7.1 — user is ready to supply remaining about page content. Items needed from author:
1. Positionality statement (prose)
2. CV education entries (institution, years, discipline, thesis title)
3. CV presentations (conference, year, title)
4. Short bio (~150 words)
5. Long bio (~500 words)
6. Headshot photograph (any format; will be converted/optimised)
7. Institutional staff profile URL (direct OU staff page when available — currently points to `https://www.open.ac.uk` homepage as placeholder)
8. CV PDF (optional — for download link)

**Blocked:** Task 7.2 — no action until author notifies of arXiv submission.

## Key File Locations

| File | Purpose |
|------|---------|
| `src/pages/about/index.astro` | About/author page — Task 7.1 target |
| `src/components/shared/SiteFooter.astro` | Footer — ORCID, GitHub, Scholar, email links |
| `src/components/shared/TwoLensesToggle.tsx` | Interlude lens toggle (uses querySelector, not DOM walk) |
| `src/components/shared/LensSection.tsx` | MDX wrapper for lens-aware content blocks |
| `src/pages/counting-lives/index.astro` | CL hub — MM1–MM4 bridge interludes + supplementary interludes |
| `src/pages/counting-lives/interludes/[slug].astro` | Interlude page route |
| `src/content/counting-lives/interludes/` | 6 interlude MDX files (mm1–mm4, mm35, uk-il1) |
| `netlify.toml` | CSP header + redirects + Node version |
| `scripts/gen-csp-hashes.mjs` | Hash regeneration tool — run after any script-bearing layout change |
| `src/lib/zotero.ts` | Zotero fetch + cache logic |
| `src/data/zotero-library.json` | Committed Zotero cache (version 682) |
| `astro.config.mjs` | Build config — no Netlify adapter, Zotero prefetch hook |
| `.apm/Implementation_Plan.md` | Full project implementation plan |
| `.apm/Memory/Memory_Root.md` | Memory root index |

## Recent Session History (2026-04-07 to 2026-04-09)

- **253d3e2** — Fixed chapter prev/next nav (wrong href pattern) + author name Dorling→Dorman
- **61b36b7** — Surfaced MM1–MM4 as hub bridge cards; MM3.5 and uk-il1 as supplementary grid entries
- **2c76c82** — Corrected CSP hash script (excluded JSON-LD); reduced to 10 hashes — **this was wrong**
- **c17362b** — Removed `@astrojs/netlify` adapter (fixed Netlify deploy failures)
- **d64a603** — Fixed `TwoLensesToggle` DOM walk → `querySelector` (Astro island wrapper broke parent chain)
- **48ec585** — (intermediate)
- **531e041** — Restored 12 CSP hashes; fixed gen-csp-hashes.mjs regex bug that dropped scripts containing `<`
</content>
</invoke>