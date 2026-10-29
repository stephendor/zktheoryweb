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
use an installed Chromium instead of Playwright's own. Run from the repo root.

1. **Rebuild the inputs.** Download the latest register extract file
   `publicextract.charity_annual_return_parta.zip` from the Charity Commission's full register download and unzip it.
   Then, on a machine that can reach `opencharities.uk` and `api.threesixtygiving.org`:

   ```bash
   python tools/snapshots/build_charity_json.py --parta <path to publicextract.charity_annual_return_parta.txt> --list tools/snapshots/charities_wave1.tsv --out tools/snapshots/charities
   ```

   Repeat with `charities_batch3.tsv`. A charity whose sources can't be read in full (a failed 360Giving page, no
   latest Part A, or a Part A for a different year from the financial history) is reported and not written, and the
   run exits with an error. Fix the source and rerun it; don't regenerate its PDF from the old input.

2. **Regenerate each PDF.** For each row of `charity_snapshot_links.csv`:

   ```bash
   python tools/snapshots/snapshot.py charity --input tools/snapshots/charities/<number>.json --price <price_on_page> --out <scratch folder>
   ```

   ```bash
   python tools/snapshots/snapshot.py check <scratch folder>/snapshot-<name>.pdf
   ```

3. **Publish in place.** Copy each PDF over its `public_path`. Keep the token folder and file name, because sent
   emails link to them.

To change only the wording (with no new figures), skip step 1 and say so in the PR: the page's source line still
shows the date the inputs were checked.
