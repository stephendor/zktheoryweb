# Public-data snapshot generator

Builds the one-page PDF snapshots sent to individual organisations and published at unlisted links under
`public/s/` (see `docs/snapshots.md` for adding and retiring those links).

## What's here

- `snapshot.py`: the generator. Modes: `charity`, `apprenticeship`, `area`, plus `pdf` (print an HTML snapshot)
  and `check` (tagged, document language, alt text on figures, exactly one page).
- `build_charity_json.py`: builds the charity inputs in `charities/` from public sources.
- `charities/*.json`: inputs for the charity snapshots, one per charity (registered charity number).
- `charities_wave1.tsv`, `charities_batch3.tsv`: the charity lists those inputs were built from.
- `charity_snapshot_links.csv`: for each charity snapshot, its wave, the Review price shown on its page and the
  PDF's path under `public/s/`.

## Rules

- **Public data only.** Every figure comes from published, organisation-level sources: the Charity Commission
  register, 360Giving, and DfE or local authority statistics. No internal data is used.
- **Regenerate before reusing.** Inputs are dated (the date is in each page's source line). Rebuild the inputs and the
  PDF before sending a snapshot again; don't resend an old file.
- **The organisation-to-link map stays out of git.** The one exception is `charity_snapshot_links.csv`, which holds
  names, prices and paths only, so the charity snapshots can be regenerated in place without changing their links.
- **SORP wording** must stay in step with the guide at `/services/guides/trustees-report-impact-data/`.

## Regenerating the charity snapshots in place

Needs Python with `pandas`, `matplotlib`, `numpy`, `pypdf` and `playwright` (with Chromium). Set `CHROMIUM_PATH` to
use an installed Chromium instead of Playwright's own. From the repo root, for each row of
`charity_snapshot_links.csv`:

```bash
python tools/snapshots/snapshot.py charity --input tools/snapshots/charities/<number>.json --price <price_on_page> --out <scratch folder>
```

```bash
python tools/snapshots/snapshot.py check <scratch folder>/snapshot-<name>.pdf
```

Then copy the PDF over its `public_path`. Keep the token folder and file name, because sent emails link to them.
