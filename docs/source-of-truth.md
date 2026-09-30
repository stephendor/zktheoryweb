# Source of truth & content flow

This note records the canonical content architecture for zktheory.org, adopted June
2026. It exists so the boundaries between repositories stay clear and the published
site does not drift from current research.

## The one-directional flow

```
┌────────────────┐     ┌──────────────────────────┐     ┌────────────────┐
│   TDL repo     │     │      Obsidian vaults      │     │    website     │
│  (C:\Projects\ │ ──▶ │  Counting Lives          │ ──▶ │  zktheoryweb   │
│   TDL)         │     │  TDA-Research            │     │  (this repo)   │
│  code · maths  │     │  prose · notes · results │     │  src/content/  │
└────────────────┘     └──────────────────────────┘     └────────────────┘
        │                          ▲                              ▲
        └── tda-repo-bridge ───────┘                              │
            (commits, benchmarks,                  Phase 3 exporter scans the
             parameter decisions →                 vault roots → connections;
             vault notes)                          pages authored in src/content/
```

**The website never reaches into the TDL code repo.** Computational results reach the
site only after they have been written into the TDA-Research vault (via the
`tda-repo-bridge` workflow). This keeps the mathematical/code work (TDL) cleanly
separated from the writing-and-publication surface, while the vaults act as the bridge.

## The two source-of-truth vaults

| Vault | Exporter sourceId | Feeds |
|---|---|---|
| Counting Lives | `counting-lives` | chapters, interludes, writing notes/essays |
| TDA-Research | `tda-research` | papers, methods, computational results |

The Phase 3 exporter is configured to scan the live vault roots via
`--counting-lives-vault` / `PHASE3_COUNTING_LIVES_VAULT` and `--tda-vault` /
`PHASE3_TDA_VAULT` (see `scripts/phase3/source-inventory.ts`).

## Two layers the site needs (keep them distinct)

1. **Page content** — the `.mdx` files in `src/content/` (chapters, papers, methods,
   interludes, essays, notes, interactives, learn modules). These are authored/curated
   forward from the vaults. Currency is a page-content problem and comes first.
2. **Connections** — `src/data/generated/phase3/site-connections.json`, produced by the
   exporter from `site:` / `two-lenses:` frontmatter in **vault** notes. The id in each
   `site:` block must match the route slug in `src/content/` (see
   `scripts/phase3/site-id-map.md`).

## Deprecated

- **`content-source/`** — a stale manual snapshot of vault material. See
  [`../content-source/DEPRECATED.md`](../content-source/DEPRECATED.md). Do not edit or
  rely on it.

## Operating rules

- Edit **page content** in `src/content/`; edit **connection metadata** in the vault.
- Never author site content from the TDL repo; route code/results through the
  TDA-Research vault first.
- When a `src/content/` slug changes, update `scripts/phase3/site-id-map.md` so vault
  `site.id`s stay aligned.
- Mark superseded research as `status: superseded` with `superseded_by: [...]` rather
  than deleting it, so provenance survives (e.g. TDA papers 1–3 → papers 11–12).
