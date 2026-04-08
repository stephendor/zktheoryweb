---
agent_type: Manager
agent_id: Manager_3
handover_number: 3
current_phase: "Phase 7: Post-Launch Hardening & Author Content"
active_agents: []
---

# Manager Agent Handover File — zktheory.org Research Portfolio Website

## Active Memory Context

**User Directives (standing — carry forward from all prior sessions):**
- One issue per exchange — do not batch multiple tasks into a single response. User confirms after each step before you proceed.
- Verify against actual code before fixing anything reported as a bug. Many "findings" turn out to be correct behaviour.
- Present options as lettered choices with a clear recommendation when multiple approaches exist. User picks one then says "proceed".
- **Verification steps:** `npm test` for unit test confirmation. `npm run lint` for lint. To verify page output locally use `npx serve dist` — do NOT use `npm run build` as the canonical verification step; the local Netlify adapter always throws `entry.mjs does not exist` and this is pre-existing/harmless. Build correctness is confirmed when tests pass and the Netlify production deploy succeeds.
- Never create markdown documentation files unless explicitly requested by the user.
- Commit and push each unit of work immediately after build/test verification. Do not batch commits.
- Push fixes directly to `main` for small changes. Use a feature branch + PR for larger multi-task phases.
- `status: 'stub'` is invalid in Zod enums — use `'drafting'` for placeholder modules.
- **Scope discipline:** Agents must only stage and commit files directly modified by their task. Any files drifting into `git status` that are outside the task scope must be individually audited before staging. Never commit `astro.config.mjs`, `.gitignore`, or config files unless the task explicitly targets them.

**User Directives (new — this session):**
- Real contact/social data has been applied directly in the session (no formal agent task needed). Items already completed from Task 7.1 list: email (`stephen@zktheory.org`), GitHub (`https://github.com/stephendor`), Google Scholar (`https://scholar.google.co.uk/citations?user=XN2WAFgAAAAJ&hl=en`), ORCID (`https://orcid.org/0009-0005-1387-7279`), institution (`The Open University, UK`). These are now live on `main`.
- Footer now shows: ORCID, GitHub, Google Scholar, Contact (email). All real links.
- About page remaining placeholders (still outstanding for Task 7.1): positionality statement, CV education entries, CV presentations entries, media kit short/long bio, headshot photograph, institutional staff profile URL (currently points to `https://www.open.ac.uk` homepage — needs direct staff page when available), CV PDF download.
- Two Dependabot CVE overrides added to `package.json`: `yaml >=2.8.3` and `vite >=8.0.5`. Both confirmed `0 vulnerabilities` locally. Dependabot scan on GitHub may show alerts until next scan cycle.
- The `@astrojs/netlify` adapter throws an error during local builds (`entry.mjs does not exist`) — confirmed pre-existing, unrelated to any recent change. Production Netlify builds succeed normally.
- Node version set to `22` in `netlify.toml` (was `20` — caused first Netlify deploy failure).
- Site is live on Netlify at `zktheory.org`. Production deploys are triggered automatically on push to `main`.

**Decisions (Phase 6 / post-launch):**
1. **Pyodide INFEASIBLE** — Final. No WASM wheels for TDA libs. TDA Results Explorer uses pre-computed JSON. Do not revisit.
2. **Google Scholar link** — Now present once `user=XN2WAFgAAAAJ` profile is findable. Profile URL: `https://scholar.google.co.uk/citations?user=XN2WAFgAAAAJ&hl=en`.
3. **Branch strategy for Phase 7** — Small fixes (contact links, CVE overrides) go directly to `main`. Multi-task work (Task 7.3 rAF pause controls, Task 7.4 CSP hardening) should use a feature branch + PR.
4. **`ch-00-sample.mdx`** — Has `chapter_number: 1` (same as real Ch01). All chapter collection filters MUST use `id !== 'ch-00-sample'`, NOT `chapter_number > 0`. This is a standing constraint.
5. **TDA paper detail route** — `/tda/papers/[slug].astro` was created in Phase 6 (Task 6.5pre). Paper cards on TDA hub now link correctly.

**Known intentional warnings / non-issues — do not fix:**
- `react-hooks/exhaustive-deps` warning at `PovertySimulator.tsx:340` — intentional, permitted.
- WebKit E2E test skip for PDB 3D animation — intentional.
- Local Netlify adapter `entry.mjs` error — **RESOLVED (c17362b)**. The `@astrojs/netlify` adapter was removed from `astro.config.mjs` as it is incompatible with `output: 'static'` in current versions. Headers/redirects are served from `netlify.toml` only. `npm run build` now completes cleanly both locally and on Netlify.
- CSP `style-src 'unsafe-inline'` is intentional — required by KaTeX inline `style=` attributes on span elements; no alternative for static rehype-katex output.
- `<script type="application/ld+json">` JSON-LD blocks are NOT executable JS and are exempt from `script-src` in CSP Level 2+. The initial Task 7.4 audit erroneously counted them (76 apparent → 10 actual executable hashes). `scripts/gen-csp-hashes.mjs` now excludes JSON-LD correctly.
- CSP hashes: 10 unique executable inline scripts. Run `node scripts/gen-csp-hashes.mjs` after any change to BaseLayout.astro, SiteNav.astro, StickyToC.astro, glossary/index.astro, reading-lists/index.astro, or learn level-filter pages.

## Coordination Status

**Current build state (main branch, as of 2026-04-07 session end):**
- Pages: 127 | Tests: 429 (21 files) | Lint: 0 errors
- `npm run build` now completes cleanly locally (Netlify adapter removed). Use `npm test` for unit tests; `npx serve dist` for local preview.
- CSP: active in production (netlify.toml). 10 executable inline script hashes (JSON-LD correctly excluded). KaTeX requires `unsafe-inline` in style-src.
- Deployed: Netlify production live at zktheory.org. Last successful deploy: c17362b.
- Node: 22 (netlify.toml), 22.12.0
- Vulnerabilities: 0

**Phase 7 Task Status:**

| Task | Title | Status | Notes |
|------|-------|--------|-------|
| 7.1 | About Page Content Pass | Partially complete | Email, GitHub, ORCID, Scholar, institution done. CV, bio, headshot, positionality still outstanding — need author-supplied content. Resuming next session. |
| 7.2 | Paper 1 arXiv Update | Blocked | Waiting on arXiv submission. |
| 7.3 | rAF Animation Pause Controls | Complete | Commit f3bc7a3. |
| 7.4 | CSP Hardening | Complete | 10 hashes (corrected from 12). JSON-LD excluded. Netlify adapter removed (c17362b). Author name Dorling→Dorman fixed (253d3e2). Chapter nav hrefs fixed (253d3e2). Interludes surfaced on hub (61b36b7). |
| 7.5 | Zotero Build Hook | Complete | zotero-library.json committed with real data (version 682). Build hook wired. Env vars set in Netlify UI. |

**Producer-Consumer Dependencies (Phase 7):**
- Tasks 7.1 and 7.3 are fully independent — can proceed in parallel if user wants.
- Task 7.2 is externally blocked (arXiv).
- Task 7.4 can proceed independently but needs care around the Astro no-FOCT inline script in BaseLayout.
- Task 7.5 is a manual user action — just needs a reminder prompt.

**Recommended next priority:** Task 7.3 (rAF pause controls) — it's the only WCAG Level A gap remaining, is self-contained, and unblocked. Then Task 7.4 (CSP). Task 7.1 remainder is user-paced (depends on author providing content). Task 7.5 is a 5-minute Netlify UI action.

## Next Actions

**Next session:** Task 7.1 — About page remaining content (positionality statement, CV education/presentations, media kit bio, headshot). Waiting on author to supply text/image.
- **Task 7.5 → User**: Prompt user to create a Netlify build hook in Netlify UI → Site Settings → Build Hooks → "Zotero bibliography update", then record the POST URL in `.env.example` as `NETLIFY_ZOTERO_BUILD_HOOK`.

**Blocked Items:**
- Task 7.2 — externally blocked on arXiv submission. No action needed; mark complete when author notifies.
- Task 7.1 remainder — user-paced. Author must supply: positionality statement, educational CV entries (institutions, years, discipline, thesis title), presentations list (conferences, years, titles), short bio (~150 words), long bio (~500 words), headshot photo, institutional staff profile URL. File: `src/pages/about/index.astro`.

## Working Notes

**Key file locations:**
- Implementation Plan: `.apm/Implementation_Plan.md`
- Memory Root: `.apm/Memory/Memory_Root.md`
- Phase 6 logs: `.apm/Memory/Phase_06_Polish_Launch/`
- About page: `src/pages/about/index.astro`
- Footer: `src/components/shared/SiteFooter.astro`
- netlify.toml: project root
- Interactives: `src/components/interactives/` (FiltrationPlayground, PersistenceDiagramBuilder) + `src/components/tda/` (PersistenceDiagramBuilder3D — confirm path)
- Zotero fetch script: `src/lib/zotero.ts` | Cache: `src/data/zotero-library.json`

**Coordination Strategies:**
- Phase 7 tasks are small and independent. Assign one at a time. Do not batch.
- User has been responsive and engaged. Confirm after each push before moving to the next task.
- Manager can apply trivial one-file fixes (contact links, CVE overrides) directly in the management session without delegating — saves round-trips for minor authoring tasks.

**User Preferences:**
- Terse, factual communication. No preamble.
- Prefers to see test/build results inline (e.g. "127 pages, 420 tests, 0 lint errors").
- Direct pushes to `main` for small changes are fine and expected.
- User is the website author — never fabricate biographical, academic, or institutional content. Always wait for author-supplied text.
