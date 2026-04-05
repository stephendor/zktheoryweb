---
agent: Agent_Infra
task_ref: Task 6.8
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: false
---

# Task Log: Task 6.8 – Netlify Deployment Configuration

## Summary

Created `netlify.toml` from scratch with full build, dev, security header, asset caching, and redirect configuration. Added env var documentation comment to `src/lib/zotero.ts`. Build, tests (420), and lint (0 errors) all pass.

## Details

**Pre-existing state discovered:**
- `netlify.toml` did not exist — created from scratch
- `public/_redirects` did not exist — no conflict risk
- `output: 'static'` in `astro.config.mjs` (task notes expected `'server'`/`'hybrid'`; static output with `@astrojs/netlify` is valid and produces a bundled SSR function alongside static assets)
- `src/lib/zotero.ts` had no env var documentation comment
- `.env.example` already documents `ZOTERO_USER_ID` and `ZOTERO_API_KEY`

**`netlify.toml` sections created:**
1. `[build]` — `command = "npm run build"`, `publish = "dist"`, `NODE_VERSION = "20"`
2. `[dev]` — `command = "npm run dev"`, `port = 4321`, `targetPort = 4321`
3. `[[headers]] for = "/*"` — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security (HSTS 1yr incl. subdomains + preload)
4. `[[headers]] for = "/_astro/*"` — `Cache-Control: public, max-age=31536000, immutable`
5. `[[headers]] for = "/fonts/*"` — `Cache-Control: public, max-age=31536000, immutable`
6. `[[headers]] for = "/pagefind/*"` — `Cache-Control: public, max-age=3600`
7. `[[redirects]]` — www→apex (301, force), with explanatory comment that HTTP→HTTPS is omitted to avoid Netlify redirect loops
8. Comment block explaining how to create a Zotero build hook in Netlify UI

**CSP omitted** — confirmed absent. Comment in file explains rationale (Astro inline scripts; future nonce-based hardening pass).

**`src/lib/zotero.ts`** — added 7-line JSDoc comment block before first import documenting `ZOTERO_USER_ID`, `ZOTERO_API_KEY`, and where to set them (Netlify UI and local `.env`).

**`dist/_redirects` conflict check** — build emits "Emitted _redirects" in adapter logs but no `_redirects` file appears in `dist/` at the public root. No conflict with `netlify.toml` redirects.

**Lint note** — 2 pre-existing warnings in `PovertySimulator.tsx` (react-hooks/exhaustive-deps). These were present before Task 6.8 and are unrelated; confirmed 0 errors.

## Output

- `netlify.toml` — **created** (project root)
- `src/lib/zotero.ts` — **modified** (env var documentation comment added at top)

## Issues

None

## Manual Steps Checklist (for Manager to relay at 6.10 review checkpoint)

The following actions must be performed by the user in the Netlify UI — they cannot be automated:

1. **Connect repository** — In Netlify UI, create a new site from Git, select `stephendor/zktheoryweb`, and set the production branch to `main`
2. **Set environment variables** — Netlify UI → Site Settings → Environment Variables:
   - `ZOTERO_USER_ID` = [your Zotero user/group numeric ID]
   - `ZOTERO_API_KEY` = [your Zotero API key with read access]
3. **Set custom domain** — Add `zktheory.org` in Netlify UI → Domain Management. Update DNS: add a CNAME record pointing `www.zktheory.org` → Netlify subdomain, and an A-record (or ALIAS) for the apex `zktheory.org` → Netlify's load balancer IP (provided in the UI)
4. **Enable branch deploys** — Netlify UI → Site Settings → Build & Deploy → Branch deploys → enable for `phase-6/polish-launch` to get a deploy preview URL before merging to `main`
5. **Optionally create a build hook** — Netlify UI → Site Settings → Build Hooks → create a hook named "Zotero bibliography update". Call the generated POST URL from any server-side process whenever the Zotero library needs to trigger a rebuild

## Next Steps

None — task complete. Manager Agent should relay the Manual Steps Checklist at the 6.10 review checkpoint.
