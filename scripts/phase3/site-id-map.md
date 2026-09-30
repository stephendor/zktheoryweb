# Phase 3 — Vault-note → site.id mapping worksheet

**Purpose.** Single source of truth matching each website route slug (authoritative,
from `src/content/`) to the vault note that should carry the `site:` frontmatter
block. The exporter scans the live Obsidian vaults; the `id` in each `site:` block
**must** equal the slug column below or the link will not resolve.

**Authority.** The `route` / `id` columns are derived from filenames in
`src/content/` and must not be invented. The `vault sourceId` + `vault note path`
columns are where the `site:` block gets added. Keep this file in version control;
update it whenever a `src/content/` slug or a vault note path changes.

**sourceIds** (from `scripts/phase3/source-inventory.ts`): `counting-lives`, `tda-research`.
Vault paths below are relative to each vault root.

**Confidence legend:** ✅ clean 1:1 · ⚠️ needs a decision · ⛔ no vault source note exists.

---

## Pilot (validate the round-trip first)

| # | site.kind | site.id | vault sourceId | vault note path | status | conf | notes |
|---|---|---|---|---|---|---|---|
| P1 | paper | paper-02 | tda-research | 03-Papers/P02-Mapper/ | resolved | ✅ | Titles match ("Mapper…"). Confirm exact note file in folder. |
| P2 | paper | paper-03 | tda-research | 03-Papers/P03-Zigzag/ | resolved | ✅ | Titles match ("Zigzag…business cycle"). |
| P3 | paper | paper-04 | tda-research | 03-Papers/P04-Multipers/ | resolved | ✅ | Titles match ("Multi-Parameter…"). |
| P4 | paper | paper-10 | tda-research | 03-Papers/P10-Topological-Fairness/ | resolved | ✅ | Titles match. Also the math anchor for a Two Lenses pair. |
| P5 | interlude | mm3-logistic-regression | counting-lives | 01 - Manuscript/MM-Interludes/MM3 - Logistic Regression and Classification.md | resolved | ✅ | In-vault Two Lenses math lens. |
| P6 | chapter | ch-10 | counting-lives | 01 - Manuscript/Part III - The Automated Poorhouse/Ch10 - Risk Scores and Redlining/Ch10 - Risk Scores and Redlining.md | resolved | ⚠️ | Folder also has `manuscript.md` + `Index.md` — confirm which note is canonical. Political lens of the pair. |

**Pilot Two Lenses pair (in-vault, no cross-vault sourceId needed):**

- `two-lenses.id`: `logistic-thresholds` (suggested)
- math: `mm3-logistic-regression` (P5) · political: `ch-10` (P6)
- Both endpoint notes must carry their own `site:` block (P5, P6 above) before the pair resolves.
- `website-path`: must be root-relative, e.g. `/learn/...` — confirm the intended learn route.

---

## Papers — paper-01 … paper-10

| site.id | site title | vault sourceId | vault note (folder) | conf | notes |
|---|---|---|---|---|---|
| paper-01 | The Markov Memory Ladder | tda-research | 04-Methods/Markov-Memory-Ladder.md **or** a P-folder | ⚠️ | **Anomaly.** Site treats Markov ladder as paper-01, but in the vault it is a *method* note. Decide: tag it `kind: paper, id: paper-01`, or `kind: method, id: markov-memory-ladder`, or split. A note can hold only one `site:` block; the other linkage becomes a derived connection. |
| paper-02 | Mapper for Interior Trajectory Structure | tda-research | 03-Papers/P02-Mapper/ | ✅ | |
| paper-03 | Zigzag Persistence for Business Cycle Topology | tda-research | 03-Papers/P03-Zigzag/ | ✅ | |
| paper-04 | Multi-Parameter PH for Poverty Trap Detection | tda-research | 03-Papers/P04-Multipers/ | ✅ | |
| paper-05 | Cross-National Welfare State Topology | tda-research | 03-Papers/P05-Cross-National/ | ✅ | |
| paper-06 | Intergenerational Topological Inheritance | tda-research | 03-Papers/P06-Intergenerationa/ | ✅ | |
| paper-07 | Geometric Trajectory Forecasting | tda-research | 03-Papers/P07-Geometric-Forecasting/ | ✅ | |
| paper-08 | Graph Neural Networks on Household Social Graphs | tda-research | 03-Papers/P08-GNN-Households/ | ✅ | |
| paper-09 | Combinatorial Complex Neural Networks | tda-research | 03-Papers/P09-CCNN-Multilevel/ | ✅ | |
| paper-10 | Topological Fairness Analysis of Poverty Measurement | tda-research | 03-Papers/P10-Topological-Fairness/ | ✅ | |

> Vault notes with **no site paper route**: `P01-Core-VR-PH`, `P01-A-JRSSA`, `P01-B-JRSSB`.
> The persistent-homology core surfaces only as the *method* page (below). Decide whether
> these warrant their own `paper-*` routes or stay represented via the method page.

## Methods — site method slugs

| site.id | site title | vault source | conf | notes |
|---|---|---|---|---|
| persistent-homology | Persistent Homology | — | ⛔ | No dedicated vault note. Substance in P01-Core-VR-PH. Either create a method note in the vault or accept it as site-authored only. |
| mapper | Mapper | — | ⛔ | Authored in repo; substance in P02-Mapper. |
| zigzag-persistence | Zigzag Persistence | — | ⛔ | Authored in repo; substance in P03-Zigzag. |
| multi-parameter-ph | Multi-Parameter Persistent Homology | — | ⛔ | Authored in repo; substance in P04-Multipers. |
| graph-neural-networks | Graph Neural Networks | — | ⛔ | Authored in repo; substance in P08/P09. |
| markov-memory-ladder | The Markov Memory Ladder | tda-research: 04-Methods/Markov-Memory-Ladder.md | ⚠️ | Only method with a real vault note — but collides with site paper-01 (see anomaly). |

## Chapters — ch-01 … ch-17 (clean by number)

Vault folders `Ch01`…`Ch17` map to site `ch-01`…`ch-17` by number (titles confirmed match).
Each folder's canonical note (named `ChNN - Title.md`) carries the `site:` block — confirm
vs `manuscript.md` per folder. Draft state (for the editorial "should this be visible?" gate):
ch-01–11 and ch-14 are drafted; ch-12/13 have gaps; ch-15/16/17 are stubs.

| site.id | site title | vault sourceId | vault folder |
|---|---|---|---|
| ch-01 | The Statistician's Stomach | counting-lives | Part I…/Ch01-Statistician's Stomach |
| ch-02 | The Eugenic Ledger | counting-lives | Part I…/Ch02-The Eugenic Ledger |
| ch-03 | From Poor Law to Social Insurance | counting-lives | Part I…/Ch03-From Poor Law to Social Insurance |
| ch-04 | The Grocery List as Resistance | counting-lives | Part I…/Ch04-The Grocery List as Resistance |
| ch-05 | Cybernetics and Control | counting-lives | Part II…/Ch05-Cybernetics and Control |
| ch-06 | The RAND Corporation's Poor | counting-lives | Part II…/Ch06-The RAND Corporation's Poor |
| ch-07 | PayPal's Philosophers | counting-lives | Part II…/Ch07-Paypal's Philosophers |
| ch-08 | Effective Altruism's Cold Equations | counting-lives | Part II…/Ch08 - Effective Altruism's Cold Equations |
| ch-09 | Venture Capital's Ledger | counting-lives | Part II…/Ch09 - Venture Capital's Ledger |
| ch-10 | Risk Scores and Redlining | counting-lives | Part III…/Ch10 - Risk Scores and Redlining |
| ch-11 | Palantir's Panopticon | counting-lives | Part III…/Ch11 - Palantir's Panopticon |
| ch-12 | The Credit Score Society | counting-lives | Part III…/Ch12 - The Credit Score Society |
| ch-13 | The Respectable Calculus | counting-lives | Part III…/Ch13 - The Respectable Calculus |
| ch-14 | The Mathematics of Solidarity | counting-lives | Part IV…/Ch14 - The Mathematics of Solidarity |
| ch-15 | Participatory Statistics and Data Justice | counting-lives | Part IV…/Ch15 - Participatory Statistics and Data Justice |
| ch-16 | Orshansky's Children | counting-lives | Part IV…/Ch16 - Orshansky's Children |
| ch-17 | Toward an Ethics of Measurement | counting-lives | Part IV…/Ch17 - Towards and Ethics of Measurement |

> Site routes with **no vault folder found**: `ch-00` (Introduction), `ch-18` (Conclusion),
> `ch-00-sample`. Verify where their source lives (likely site-authored).

## Interludes — site slugs

| site.id | site title | vault sourceId | vault note (candidate) | conf | notes |
|---|---|---|---|---|---|
| mm1-normal-distribution | The Normal Distribution | counting-lives | 01 - Manuscript/MM-Interludes/MM1 - The Normal Distribution.md | ✅ | |
| mm2-correlation-regression | Correlation and Regression | counting-lives | …/MM2 - Correlation and Regression.md | ⚠️ | Duplicate-looking note exists: `MM-Interlude-B - Correlation, Regression, and the Threshold.md`. Pick canonical. |
| mm3-logistic-regression | Logistic Regression and Classification | counting-lives | …/MM3 - Logistic Regression and Classification.md | ⚠️ | Also `MM-Interlude-C - From Scales to Scores.md`. Pick canonical. |
| mm35-the-cost-function | The Cost Function | counting-lives | …/MM3.5 - The Cost Function.md | ✅ | |
| mm4-neural-networks | Neural Networks and the Black Box | counting-lives | …/MM4 - Neural Networks and the Black Box.md | ⚠️ | Also `MM-Interlude-D - The Black Box.md`. Pick canonical. |
| uk-il1-respectable-calculus | The Respectable Calculus (UK Interlude) | counting-lives | …/UK Interlude The Respectable Calculus.md | ✅ | |

## Interactives & learn modules

| site.kind | range | vault source | notes |
|---|---|---|---|
| interactive | filtration-playground, persistence-diagram-builder, point-cloud-explorer, homology-editor, mapper-parameter-lab, normal-distribution-explorer, poverty-threshold-simulator, benefit-taper-calculator, decision-threshold-explorer, equivalisation-comparator, shap-instability, tda-results-explorer, barcode-comparator | — | Site-authored (`src/content/interactives/` + React data files). No vault source expected; likely excluded from vault tagging. |
| learn-module | path1-module-1 … path4-module-14 | — | Site-authored. `kind: learn-module` needs an explicit `href`. Confirm whether any derive from vault notes. |

---

## Open decisions (block full rollout)

1. **Markov ladder identity** — method `markov-memory-ladder` vs paper `paper-01` (or both, via a derived connection)?
2. **Persistent-homology source** — give P01-Core-VR-PH its own `paper-*` route, or leave PH as a site-authored method page only?
3. **Canonical chapter note** — `ChNN - Title.md` vs `manuscript.md` as the `site:`-bearing file.
4. **Interlude duplicates** — `MMn` notes vs the `MM-Interlude-B/C/D` notes: which is canonical per id.
5. **Two Lenses `website-path`** — the intended `/learn/...` route for the pilot pair.
