# Phase 3 Source-To-Site Export Design

## Goal

Create website-owned Phase 3 export tooling that reads the TDA Research and
Counting Lives vaults as read-only inputs, produces validated candidate
Phase 3 JSON, reports site route resolution, and promotes reviewed output into
`src/data/generated/phase3/` without making Astro build depend on either vault
or the TDL repository.

## Context

The website now has a Phase 3 contract layer and rendering layer. Public pages
consume checked-in JSON from `src/data/generated/phase3/`; they do not read the
TDL repo, the TDA Research Obsidian vault, or local junction targets.

The next section is Phase 3 generated-data production, covering the practical
parts of the original 3.2 and 3.3 specification:

- 3.2 Cross-Vault Linker: identify candidate bridges between mathematical TDA
  notes and political Counting Lives notes.
- 3.3 Website Content Pipeline: export reviewed vault-derived structure into
  website data.

The exporter belongs in the website repository because the website owns the
contract, route registry, rendering gate, and promotion rules. The TDL repo
stays focused on research computation and vault practice.

## Current Source Facts

Observed local paths on 2026-06-14:

- TDL repo: `C:\Users\steph\TDL`
- TDA Research vault via junction: `C:\Users\steph\TDL\vault`
- TDA Research vault target: `C:\Users\steph\Documents\TDA-Research`
- Counting Lives vault: `C:\Users\steph\Documents\Counting Lives\Counting Lives`
- TDA vault map: `C:\Users\steph\Documents\TDA-Research\VAULT-MAP.md`
- Counting Lives vault map:
  `C:\Users\steph\Documents\Counting Lives\Counting Lives\VAULT-MAP.md`

The TDA vault path under `C:\Users\steph\TDL\vault` is a Windows junction, not
a symlink. The exporter must record this as source metadata and as an audit
finding, but no site build code may require that junction to exist.

A quick scan found no existing `two-lenses:` or `website-path:` frontmatter in
either vault. The exporter must therefore handle an empty confirmed-tag state
cleanly and still produce useful inventory and route-resolution reports.

## Scope

This feature has six separated slices:

1. Source inventory and junction audit.
2. Markdown vault scanning with frontmatter and citekey extraction.
3. Candidate export building in the existing `Phase3Export` shape.
4. Route-resolution feedback for candidate data.
5. Explicit promotion from candidate JSON to public generated JSON.
6. Verification commands and focused tests.

Each slice must be testable without requiring the live vaults. Unit tests should
use temporary fixture directories. Live vault paths are optional runtime inputs
for local reporting commands.

## Non-Goals

- Do not edit the TDL repository.
- Do not write back into either Obsidian vault.
- Do not make `astro build`, `npm run build`, or `npm run verify:phase3` read
  live vault paths.
- Do not add an automatic `prebuild` export step.
- Do not replace the existing rendering data reader.
- Do not require confirmed Two Lenses tags before the tooling is useful.
- Do not generate new public Astro routes from vault content in this phase.

## Architecture

Exporter logic lives in the website repo under `src/lib/phase3/exporter/`.
Thin CLI entry points live under `scripts/phase3/`.

The library is split into pure units:

- `sourceInventory` inspects configured vault roots and records availability,
  `VAULT-MAP.md` presence, markdown counts, and reparse point details.
- `vaultScanner` reads markdown files from a supplied root and extracts titles,
  frontmatter, `two-lenses` metadata, `website-path`, citekeys, and stable
  vault-relative paths.
- `candidateBuilder` maps scanned metadata into the existing `Phase3Export`
  contract. It may produce an empty valid export when no confirmed links exist.
- `routeFeedback` validates candidate data against the website route registry
  and summarizes resolved, pending, external, and broken references.
- `promotion` copies a validated candidate to the public generated-data file
  only when validation has no errors.

The CLI layer coordinates these units:

- `npm run phase3:inventory` prints and writes a source inventory report.
- `npm run phase3:export:candidate` writes a candidate export and feedback
  report.
- `npm run phase3:promote` promotes a validated candidate to
  `src/data/generated/phase3/site-connections.json`.

## Data Flow

```text
Live vault paths supplied by CLI/env
        |
        v
sourceInventory report
        |
        v
vaultScanner scanned note records
        |
        v
candidateBuilder Phase3Export candidate
        |
        v
routeFeedback validation report
        |
        v
explicit promotion command
        |
        v
src/data/generated/phase3/site-connections.json
        |
        v
Astro rendering reads checked-in JSON only
```

Candidate output should be staged outside the renderer's default direct JSON
scan path, for example:

- `src/data/generated/phase3/candidates/site-connections.candidate.json`
- `reports/phase3/site-connections.feedback.json`
- `reports/phase3/source-inventory.json`

The current rendering reader ignores subdirectories, so candidate files do not
change public pages until promoted.

## Source Configuration

Commands should accept explicit flags first and environment variables second:

- `--tda-vault <path>` or `PHASE3_TDA_VAULT`
- `--counting-lives-vault <path>` or `PHASE3_COUNTING_LIVES_VAULT`
- `--out <path>` for candidate JSON
- `--report <path>` for report JSON

If no vault paths are supplied, commands should fail with an actionable message
for live export commands. Unit tests should pass roots directly and should not
read user-specific paths.

## Scanner Rules

The scanner reads markdown files with `.md` and `.mdx` extensions. It skips
common non-content directories:

- `.obsidian`
- `.git`
- `.trash`
- `node_modules`

For each note it should extract:

- source id (`tda-research` or `counting-lives`)
- vault-relative path using forward slashes
- title from frontmatter `title`, first Markdown heading, or filename stem
- parsed frontmatter object when present
- citekeys from frontmatter fields and prose references matching `@citekey`
- optional Two Lenses metadata from frontmatter

The scanner must tolerate malformed or absent frontmatter by recording a
warning and continuing. Warnings belong in reports and export manifests; they
must not silently disappear.

## Candidate Export Rules

The first production exporter is conservative. It should emit confirmed
`twoLenses` records only from explicit Two Lenses metadata. If no confirmed
metadata exists, it emits a valid empty export with source metadata and
warnings.

Cross-vault candidates discovered by term or citekey overlap should be reported
as proposed derived connections, not rendered as public confirmed links. Public
rendering already filters `proposed` links; the export report should make them
visible for review.

All website references must use the existing contract:

- resolved references point at known site ids;
- pending references are allowed for plausible future content;
- external references require HTTP(S) hrefs;
- local filesystem paths are allowed only in source metadata and
  `sourceNoteRefs`, never as public `href` values.

## Route Feedback

Route feedback reuses the existing site route registry and
`validatePhase3Export`. It should produce both machine-readable and
human-readable summaries:

- total `twoLenses`, `derivedConnections`, and `learningPaths`
- resolved reference count
- pending reference count
- external reference count
- broken/unresolved reference count
- issues grouped by source record id and path

Candidate export may succeed with warnings. Promotion must fail when validation
reports errors.

## Promotion Policy

Promotion is a deliberate command. It validates the candidate against the site
route registry, writes formatted JSON to
`src/data/generated/phase3/site-connections.json`, and leaves normal project
verification to `npm run verify:phase3`.

Promotion should not delete candidate or report files. Candidate artifacts can
remain as review evidence or be ignored later by normal cleanup.

## Error Handling

Inventory commands should degrade gracefully:

- missing optional vault root: report unavailable source
- missing `VAULT-MAP.md`: warning
- unreadable markdown file: warning
- malformed frontmatter: warning

Export and promotion commands are stricter:

- missing required vault roots: command error
- candidate schema failure: command error
- broken resolved site reference during promotion: command error
- attempted public href using local filesystem path: command error through
  existing contract validation

## Test Strategy

Unit tests should cover:

- inventory detects available roots, missing roots, `VAULT-MAP.md`, and
  junction/reparse metadata when supplied by a mocked stat provider;
- scanner extracts frontmatter, headings, citekeys, Two Lenses metadata, and
  warnings for malformed frontmatter;
- candidate builder emits a valid empty export when no confirmed tags exist;
- candidate builder emits confirmed Two Lenses records from explicit metadata;
- route feedback separates resolved, pending, external, and broken references;
- promotion refuses invalid candidates and writes valid promoted JSON.

Command tests should use temporary directories and fixture markdown. They should
not read `C:\Users\steph\TDL`, `C:\Users\steph\Documents\TDA-Research`, or
`C:\Users\steph\Documents\Counting Lives`.

## Acceptance Criteria

- Website-owned commands can inventory supplied vault roots and record junction
  assumptions.
- Candidate export can run against fixture vaults with and without Two Lenses
  metadata.
- Empty confirmed-tag state produces a valid empty Phase 3 export plus a useful
  warning/report.
- Candidate files live in a staging path ignored by the renderer.
- Route feedback identifies resolved, pending, external, and broken references.
- Promotion writes only validated JSON to
  `src/data/generated/phase3/site-connections.json`.
- `npm run build` remains independent of live vault paths.
- `npm run verify:phase3` remains the final validation gate after promotion.
