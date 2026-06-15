# Phase 3 Pipeline — Vault → Website Runbook

This is the operator guide for the Phase 3 source-to-site pipeline: how the
content in the Obsidian vaults (TDA Research and Counting Lives) becomes the
cross-page connection data the website renders.

If you only want the website to keep building, you don't need to run anything —
the committed file `src/data/generated/phase3/site-connections.json` is the
source of truth the site reads at build time. You run this pipeline when vault
content changes and you want those changes reflected on the site.

For the _design_ behind these tools, see the plans and specs under
[`docs/superpowers/`](./superpowers/). This document is purely operational.

---

## Prerequisites

The pipeline reads two local Obsidian vaults. Point the tools at them with
either environment variables or CLI flags (flags win over env vars):

| Vault          | Env var                       | CLI flag                        |
| -------------- | ----------------------------- | ------------------------------- |
| TDA Research   | `PHASE3_TDA_VAULT`            | `--tda-vault <path>`            |
| Counting Lives | `PHASE3_COUNTING_LIVES_VAULT` | `--counting-lives-vault <path>` |

```bash
# Example (bash / Git Bash): set once per shell
export PHASE3_TDA_VAULT="/c/Users/steph/Documents/TDA-Research"
export PHASE3_COUNTING_LIVES_VAULT="/c/Users/steph/Documents/Counting Lives/Counting Lives"
```

```powershell
# Example (PowerShell)
$env:PHASE3_TDA_VAULT = "C:/Users/steph/Documents/TDA-Research"
$env:PHASE3_COUNTING_LIVES_VAULT = "C:/Users/steph/Documents/Counting Lives/Counting Lives"
```

**Passing flags through npm:** use `--` to forward arguments to the script, e.g.
`npm run phase3:export:candidate -- --tda-vault "C:/path" --out custom.json`.
Flag values accept `--key value` or `--key=value`. There are no short flags.

### What drives output: the `site:` / `two-lenses:` frontmatter

The pipeline only produces connections for notes that carry the metadata
contract in their frontmatter:

- **`site:`** — maps a note to a website route (`kind` + `id`, e.g. a `method`
  or `chapter`). The cross-vault linker only proposes links between notes that
  both have a `site:` reference, and the exporter only emits derived connections
  for such notes.
- **`two-lenses:`** — the explicit mathematical/political pairing the export uses
  for the "Two Lenses" feature; only `status: confirmed` entries are exported.

A vault full of notes with citations, tags, and concepts but **no `site:`
references will produce an empty (but valid) export** — the tools run cleanly
and report `0 two-lenses, 0 derived connections` / `0 proposals`. Instrumenting
notes with `site:` frontmatter is the prerequisite for any output. See the
contract in `src/lib/phase3/contracts.ts` and the vault scanner in
`src/lib/phase3/exporter/vaultScanner.ts`.

---

## The two loops

The pipeline is two independent loops that meet in the vault frontmatter:

```
 ┌─ Authoring loop (optional, suggests links) ─────────────────────┐
 │  phase3:link:propose  →  review metadata-candidates.md          │
 │                          →  add/confirm metadata in vault notes │
 └─────────────────────────────────────────────────────────────────┘
                                   │  (vault frontmatter is the input)
                                   ▼
 ┌─ Export loop (publishes data the site renders) ─────────────────┐
 │  phase3:inventory       (optional sanity check)                 │
 │  phase3:export:candidate →  review feedback report              │
 │                          →  phase3:promote                      │
 │                          →  validate:phase3                     │
 └─────────────────────────────────────────────────────────────────┘
```

The **authoring loop** is an aid: the linker _suggests_ cross-vault links; a
human decides which to encode as `two-lenses`/`site` metadata in the vault
notes. The **export loop** turns whatever metadata exists in the vaults into the
validated `site-connections.json` the website consumes. You can run the export
loop without ever touching the linker.

---

## Commands

All commands are npm scripts (see `package.json`). Each prints a one-line
summary ending in `-> <output path>`.

### `npm run phase3:inventory`

Sanity-checks that both vaults are reachable and counts markdown files.
Vault inputs are **optional** here — a missing vault is reported as unavailable
rather than failing.

- `--report <path>` — output JSON (default `reports/phase3/source-inventory.json`)

Run this first when a vault path or mount looks wrong.

### `npm run phase3:link:propose` — authoring aid

Scans both vaults and proposes cross-vault links scored by shared citations,
concepts, and title tokens. Produces a machine-readable report **and** a
human-readable markdown list of metadata candidates to add to notes.
**Vault inputs are required.**

- `--report <path>` — proposals JSON (default `reports/phase3/cross-vault-linker.report.json`)
- `--metadata-candidates <path>` — markdown for review (default `reports/phase3/cross-vault-linker.metadata-candidates.md`)
- `--min-score <0..1>` — minimum score to include (default `0.5`)
- `--max-proposals <int ≥ 0>` — cap on proposals (default `50`)
- `--candidate-status <draft|confirmed>` — status stamped on candidates (default `draft`)

Review `cross-vault-linker.metadata-candidates.md`, then hand-edit the relevant
vault notes to add the connections you accept. This does **not** write any site
data — its output feeds your editing, not `phase3:promote`.

### `npm run phase3:export:candidate` — build the candidate

Scans both vaults and builds a **candidate** connection export plus a route
feedback report (which references resolve against the current site routes).
**Vault inputs are required.**

- `--out <path>` — candidate JSON (default `src/data/generated/phase3/candidates/site-connections.candidate.json`)
- `--report <path>` — route feedback JSON (default `reports/phase3/site-connections.feedback.json`)

The candidate is **not** what the site reads — it is a staging file for review.
Check the feedback report's `ok`, `errors`, and `warnings` before promoting.

### `npm run phase3:promote` — publish the candidate

Validates the candidate against the site route registry and, only if there are
no errors, writes the promoted file the website actually reads.

- `--candidate <path>` — candidate to promote (default matches `export:candidate --out`)
- `--out <path>` — promoted file (default `src/data/generated/phase3/site-connections.json`)

Promotion is atomic (temp file + rename) and refuses to run if validation finds
errors.

### `npm run validate:phase3` — gate before commit

Validates every JSON file under `src/data/generated/phase3/` (and the `valid`
fixtures) against the schema and route registry. Run after promoting and before
committing the updated `site-connections.json`.

### `npm run verify:phase3` — full check

Convenience wrapper: `validate:phase3` + the `src/lib/phase3` test suite +
`astro check`. Use this as the pre-commit gate for any change to the pipeline
code or generated data.

---

## End-to-end example

```bash
export PHASE3_TDA_VAULT="/c/Users/steph/Documents/TDA-Research"
export PHASE3_COUNTING_LIVES_VAULT="/c/Users/steph/Documents/Counting Lives/Counting Lives"

npm run phase3:inventory          # 1. confirm both vaults are reachable
npm run phase3:export:candidate   # 2. build candidate + feedback report
#    → open reports/phase3/site-connections.feedback.json; confirm ok=true
npm run phase3:promote            # 3. publish to site-connections.json
npm run validate:phase3           # 4. validate the promoted data
git add src/data/generated/phase3/site-connections.json
git commit -m "chore: refresh phase 3 site connections"
```

To also refresh suggested cross-vault links first:

```bash
npm run phase3:link:propose       # 0. suggestions → review the markdown,
#    edit vault notes to add accepted links, then run the export loop above
```

---

## Outputs at a glance

| Path                                                       | Committed? | Role                                        |
| ---------------------------------------------------------- | ---------- | ------------------------------------------- |
| `src/data/generated/phase3/site-connections.json`          | **Yes**    | Source of truth the site renders            |
| `src/data/generated/phase3/candidates/*.candidate.json`    | No         | Staging output of `export:candidate`        |
| `reports/phase3/source-inventory.json`                     | No         | Vault availability report                   |
| `reports/phase3/site-connections.feedback.json`            | No         | Route-resolution feedback for the candidate |
| `reports/phase3/cross-vault-linker.report.json`            | No         | Linker proposals (machine-readable)         |
| `reports/phase3/cross-vault-linker.metadata-candidates.md` | No         | Linker proposals for human review           |

Only the promoted `site-connections.json` is committed; everything under
`candidates/` and `reports/` is a transient working artifact.

---

## Guardrails

The tools refuse a few dangerous writes:

- **No writing into a source vault.** `link:propose` rejects any `--report` or
  `--metadata-candidates` path that resolves inside either vault root (so a
  generated report can never clobber source notes). Path comparison is
  case-insensitive on Windows/macOS and case-sensitive on Linux, matching the
  host filesystem.
- **No clobbering the promoted file.** `export:candidate` and `link:propose`
  refuse to write to `src/data/generated/phase3/site-connections.json`; that
  file is only ever updated through `phase3:promote`.
- **No promotion of invalid data.** `phase3:promote` validates against the route
  registry and throws (writing nothing) if any error-level issue is found.

---

## Troubleshooting

- **`Missing required option --tda-vault or environment variable PHASE3_TDA_VAULT`**
  — set the env var or pass the flag. `phase3:inventory` is the exception (it
  tolerates missing vaults and reports them as unavailable).
- **`Option --… requires a value`** — you passed a flag with no value (or a flag
  immediately followed by another `--flag`).
- **`Refusing to write Phase 3 linker output inside a source root`** — your
  `--report`/`--metadata-candidates` path points inside a vault; choose a path
  under `reports/`.
- **Promotion throws with validation errors** — open the feedback report from
  `export:candidate`; the same route-resolution errors block promotion. Fix the
  vault metadata or the target route, re-export, and promote again.
- **A vault note can't be read mid-scan** — the scanner now records a
  `markdown-file-unreadable` / `markdown-directory-unreadable` warning and keeps
  going; check the warnings array in the inventory/feedback output.
- **`frontmatter-parse-error` warnings** — a note has invalid YAML frontmatter
  (e.g. an unquoted value containing a `:` like `topic: Ch05 – …: draft`, or
  mismatched quotes). The scanner skips that note's frontmatter and continues;
  the note simply contributes no metadata until the YAML is fixed.
- **`Keys with collection values will be stringified …` (stderr)** — a noisy but
  non-fatal warning from the YAML library for unusual frontmatter key shapes.
  Parsing still succeeds; safe to ignore.
- **Everything runs but output is `0 two-lenses / 0 proposals`** — expected when
  no vault note carries a `site:` reference yet. This is the most common
  "nothing happened" case; see [What drives output](#what-drives-output-the-site--two-lenses-frontmatter).
