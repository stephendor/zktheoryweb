---
agent: Agent_Infra
task_ref: Task_7_4_CSP_Hardening
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 7.4 – Content Security Policy (CSP) Hardening

## Summary

Added a Content-Security-Policy header to `netlify.toml` covering all 12 unique inline scripts
(SHA-256 hashes, openssl-verified), KaTeX inline styles (`unsafe-inline`), KaTeX `data:` fonts,
and same-origin Pagefind fetch calls. All 429 tests pass, 0 lint errors. Committed and pushed to main.

## Details

### Step 1 — Audit

Scanned all 127 built HTML files in `dist/`. Key findings:

1. **Astro v5 static output does not reference `/_astro/*.js` from HTML.** All component scripts
   are inlined directly into each page's HTML. The `/_astro/` directory contains only CSS bundles.
   This is contrary to the task background which assumed `script-src 'self'` alone would cover
   bundled JS. In reality, every unique inline script body requires its own SHA-256 hash.

2. **12 unique inline scripts found** across 127 pages (not 1 as originally anticipated):
   - 4 appear on every page (no-FOCT theme resolver, Pagefind trigger, dark-mode toggle, nav hamburger)
   - 3 Astro island runtime scripts (React client hydration)  
   - 3 module scripts (ToC tracking, glossary filter, level filter)
   - 2 page-specific module scripts (glossary search, reading list filter)
   All are build-time deterministic (same hash every time they appear).

3. **KaTeX emits inline `style=""` attributes** on span elements (e.g. `style="height:0.8444em;
   vertical-align:-0.15em"`). These require `'unsafe-inline'` in `style-src` — no alternative
   for static rehype-katex output.

4. **KaTeX embeds woff2 fonts as `data:` URIs** in `/_astro/BaseLayout-*.css`. `font-src data:`
   is required.

5. **Pagefind dynamically inserts** `/pagefind/pagefind-ui.js` and `/pagefind/pagefind-ui.css`
   via `document.createElement()`. Both are same-origin, covered by `'self'` in script-src and
   style-src respectively.

6. **No external images** found in any of the 127 built pages (`<img src="https://...">` = 0).
   External anchor `href` links (arxiv, legislation.gov.uk, etc.) are navigational only and not
   in CSP scope.

7. **Zotero API fetch (`https://api.zotero.org`)** occurs only in Node.js at build time — not
   browser-side, not in CSP scope.

### Step 2 — Hash Verification

All 12 scripts extracted to binary files. Hashes computed by both Node.js `crypto.createHash('sha256')`  
and `openssl dgst -sha256 -binary | base64`. All 12 hashes matched exactly across both methods.

### Step 3 — Implementation

Edited `netlify.toml`:
- Removed the old "CSP intentionally omitted" comment block
- Added implementation notes as comments
- Added `Content-Security-Policy` to the `for = "/*"` `[headers.values]` block with:
  - `default-src 'self'`
  - `script-src 'self'` + 12 × `'sha256-...'`
  - `style-src 'self' 'unsafe-inline'`
  - `font-src 'self' data:`
  - `img-src 'self' data:`
  - `connect-src 'self'`
  - `frame-src 'none'`
  - `object-src 'none'`
  - `base-uri 'self'`
  - `form-action 'self'`

Ran `npm test` → 429/429 passed.
Ran `npm run lint` → 0 errors (2 pre-existing warnings in PovertySimulator.tsx, unrelated).
Committed `ae32ec3` and pushed to `main`.

## Output

- **Modified:** `netlify.toml` — CSP header added to `[[headers]]` for `"/*"` block
- **Commit:** `ae32ec3` — `feat: add Content-Security-Policy header to netlify.toml`
- **Tests:** 429 passed (21 files)
- **Lint:** 0 errors

The 12 SHA-256 hashes in `script-src`:
```
'sha256-/+xyHT/66E1d619A8TBWsW0/AEwypiwXAuGSgxct44Q='   # no-FOCT theme resolver (all pages)
'sha256-gMV9/GpJKxhhQJsn4vHeqkPBp3zDyd8BO4L0kAXSXqk='   # Pagefind search trigger (all pages)
'sha256-CS50p46054pMoqXOJNMPkA0WJUae20t93peHPkHlGCM='    # dark-mode toggle module (all pages)
'sha256-FertX8sa3cGIPdhD52i77sOpSIgXww7HfEDqoNm6Dxw='    # nav hamburger module (all pages)
'sha256-QzWFZi+FLIx23tnm9SBU4aEgx4x8DsuASP07mfqol/c='    # Astro .load island
'sha256-QJZDUlo/qa5AJCrG6vHyWcatjwCeWidEHQfJc601lzw='    # Astro island runtime (large)
'sha256-Q2BPg90ZMplYY+FSdApNErhpWafg2hcRRbndmvxuL/Q='    # Astro island runtime (small)
'sha256-z7g91k+vPzsIkT/fRVSF8+Cxnw3hkBG1vHRg75iIxoQ='   # ToC scroll tracking (module)
'sha256-eIXWvAmxkr251LJZkjniEK5LcPF3NkapbJepohwYRIc='    # Astro only island
'sha256-mizJIyesxNGRWHF5viQegEyx2wPyG3aw2dKXcpobNpI='    # Glossary search/filter (module)
'sha256-5x7NL7q7lI4TZIeYF0DHZvHvt7qAm6yIc12QFwC/NOs='   # Level filter buttons (module)
'sha256-0NrmGlZhke9RMjaR1K2jeUrbVRvuMPo5b8HNF0IkhAo='    # Reading list filter (module)
```

## Issues

None. The only complexity was discovering the Astro v5 static output architecture (all scripts
inlined, not referenced from `/_astro/`) which required 12 hashes rather than 1. All accounted for.

## Important Findings

**Future maintenance critical:** The 12 inline script hashes are build-time deterministic based on
source code content. They will change if any of the following Astro components are modified:

- `src/layouts/BaseLayout.astro` (no-FOCT script, Pagefind trigger)
- `src/components/shared/SiteNav.astro` (hamburger, dark-mode toggle)
- `src/components/shared/StickyToC.astro` (ToC tracking)
- `src/pages/learn/glossary/index.astro` (glossary filter)
- `src/pages/learn/reading-lists/index.astro` (reading list filter)
- `src/pages/learn/` pages using level filter
- Any Astro version upgrade (island runtime hashes 5, 6, 7, 9 may change)

**When any of these files change,** the corresponding hash in `netlify.toml` must be updated.
A CI step or build hook to re-validate CSP hashes post-build is recommended for the future.

The existing `dist/` directory was used for the hash computation. If `dist/` is regenerated
(e.g., after an Astro upgrade), re-run the hash audit script against the new build before deploying.

## Next Steps

- **Manual smoke test required (user action):** The Netlify deploy triggered by the push to
  `main` should be checked in a browser. Navigate to: home page, one chapter page (math content),
  one TDA paper page, the learn hub, and the search page. Open browser DevTools → Console and
  confirm zero CSP violation errors. Verify: math renders, search works, dark/light mode toggles.
- **Future:** Consider adding a build-time script that re-computes and validates inline script
  hashes against the CSP in `netlify.toml` to prevent drift after Astro upgrades.
