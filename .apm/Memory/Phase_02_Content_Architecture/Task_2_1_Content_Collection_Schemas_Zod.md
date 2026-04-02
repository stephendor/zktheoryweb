---
agent: Agent_Schema_Platform
task_ref: Task 2.1 - Content Collection Schemas (Zod)
status: Completed
ad_hoc_delegation: false
compatibility_issues: true
important_findings: true
---

# Task Log: Task 2.1 – Content Collection Schemas (Zod)

## Summary

Replaced the prior partial `src/content.config.ts` with a complete, spec-compliant version defining all 12 Zod-validated content collections. Build, `astro check` (0 errors), and lint all pass.

## Details

- Read existing `src/content.config.ts` — it had 11 collections with divergent field names and shapes from the Task Assignment Prompt spec (e.g., `key_claims` was an array of objects rather than strings; `threads` used `thread` instead of `thread_id`; `writing` was a single collection instead of two; `tda-data` targeted `./src/content/tda/data` instead of `./src/content/tda/data-sources`).
- Read `astro.config.mjs` — confirmed Astro 6 glob-loader pattern is already in use.
- Read `docs/PRD-Research-Portfolio-Website.md` §4.3 and Appendices A/B for field validation.
- **Note on key_claims:** PRD §4.3 defines `key_claims` as an array of `{claim, detail}` objects; Task Assignment Prompt specifies `z.array(z.string())`. Task Assignment Prompt takes precedence — implemented as `z.array(z.string())`.
- **Note on paper status:** PRD uses `'drafting'` as first status; Task Assignment Prompt uses `'planned'` and adds `'in-progress'`. Implemented per Task Assignment Prompt.
- **Note on `essays`/`notes` dates:** Spec uses `z.date()`. No existing MDX content files exist, so no breakage risk. Astro 6 content layer coerces YAML date values before schema validation.
- Replaced file in full; removed shared enum variables (each schema now inline) to match spec exactly.

## Output

**Primary deliverable:** `src/content.config.ts` — replaced entirely.

**12 collections registered:**

| Collection key | Variable | Base path |
|---|---|---|
| `chapters` | `chapters` | `./src/content/counting-lives/chapters` |
| `transitions` | `transitions` | `./src/content/counting-lives/transitions` |
| `threads` | `threads` | `./src/content/counting-lives/threads` |
| `interludes` | `interludes` | `./src/content/counting-lives/interludes` |
| `figures` | `figures` | `./src/content/counting-lives/figures` |
| `papers` | `papers` | `./src/content/tda/papers` |
| `methods` | `methods` | `./src/content/tda/methods` |
| `data-sources` | `dataSources` | `./src/content/tda/data-sources` |
| `learn-modules` | `learnModules` | `./src/content/learn` |
| `interactives` | `interactives` | `./src/content/interactives` |
| `essays` | `essays` | `./src/content/writing/essays` |
| `notes` | `notes` | `./src/content/writing/notes` |

**Verification results:**
- `npm run build` — PASS (directory-not-found WARNs expected; no errors)
- `npx astro check` — 0 errors, 0 warnings, 1 pre-existing hint (unrelated `Props` in `Sidenote.astro`)
- `npm run lint` — PASS

## Issues

None.

## Compatibility Concerns

**Schema divergence from prior Phase 1 setup:** The existing `src/content.config.ts` from the Setup Phase (Task 1.1 / Agent_Infra) had materially different schemas — different field names (`thread` vs `thread_id`, `slug` vs `interlude_slug`, `appears_in` vs `related_chapters`), different shapes (`key_claims` as objects vs strings), different collection splits (`writing` unified vs `essays`+`notes` split), and different base paths (`tda/data` vs `tda/data-sources`). The Manager Agent should be aware that any down-stream agent or template that references these old field names (e.g., if chapter page templates were already drafted using old field names) will need updating.

**`data-justice-foundations` path renamed:** The prior `modules` collection included `'data-justice-foundations'` as a path enum value; the Task Assignment Prompt uses `'data-justice'`. Implemented per Task Assignment Prompt.

## Important Findings

1. **PRD vs Task Assignment Prompt divergence on `key_claims`:** PRD §4.3 shows `key_claims` as `{claim, detail}` objects; Task Assignment Prompt flattens to `z.array(z.string())`. If chapter MDX content is later authored using the PRD object shape, schema validation will fail. Manager Agent should decide canonical shape and align PRD accordingly.

2. **PRD vs Task Assignment Prompt divergence on `papers` status enum:** PRD uses `drafting` as the initial status (matching `chapterStatus`); Task Assignment Prompt introduces `planned` and `in-progress` as the first two statuses. The prior file also used `drafting` for papers. Manager Agent should confirm which status vocabulary is canonical for `papers` before paper MDX content is authored.

3. **`data-justice` vs `data-justice-foundations` path enum:** See Compatibility Concerns above. If learning-path module MDX content already references `'data-justice-foundations'`, it will fail validation.

## Next Steps

- Content stub MDX files can now be created for all 12 collections against these schemas.
- Manager Agent should decide on the `key_claims` shape and `papers` status vocabulary and update the PRD or the schema accordingly before content authoring begins.
