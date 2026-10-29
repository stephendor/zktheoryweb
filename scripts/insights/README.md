# Public-data insight pipelines

Each folder builds the frozen JSON behind one page under `/services/insights/`. The JSON is written to
`src/data/insights/` and committed; the page reads only that file. Raw downloads go in the folder's `raw/`
subfolder, which is gitignored.

Rules for every insight (enforced in `lib.ts` and each pipeline's tests):

- aggregates only, and no organisation is named;
- any count below 5, and any figure based on fewer than 5 organisations, is withheld;
- the data date and the limits are stated on the page.

A page stays out of the build while its entry in `src/data/insights.ts` has `draft: true`. To preview drafts
locally:

```bash
INSIGHTS_PREVIEW=1 npm run build
```

On Windows PowerShell, set it first with `$env:INSIGHTS_PREVIEW = "1"`. Never set it on Netlify.

## Dorset voluntary sector (`dorset-vcs/`)

1. Download the ONS postcode to local authority lookup (November 2025, ArcGIS item
   `c4f84c38814d4b82aa4760ade686c3cc`) from the ONS Open Geography Portal and unzip the CSV. The full ONS postcode
   directory (ONSPD) or the National Statistics Postcode Lookup (NSPL) also work: the pipeline accepts a `pcds`
   postcode column and a `ladNNcd`, `laua` or `oslaua` local authority column.
2. Download and unzip the four register extract files, as JSON or text (either works; JSON is used if both are
   present), then build the JSON:

   ```bash
   npx tsx scripts/insights/dorset-vcs/run.ts --download --lookup <path-to-ons-lookup.csv>
   ```

   If the register files are already unzipped, use `--raw <dir>` instead of `--download`.

3. If the run stops with "missing column(s)", it prints the real header. Correct the name in
   `dorset-vcs/config.ts`, then run `npx vitest run scripts/insights` and the build again.
4. Check the figures, then set `draft: false` for the page in `src/data/insights.ts`. Preview with
   `INSIGHTS_PREVIEW=1`, or just build.

An existing output file is never overwritten unless you pass `--force`.

## South West apprenticeship achievement (`sw-apprenticeships/`)

1. From Explore Education Statistics (Apprenticeships 2025/26 release), download the provider-level achievement
   rates CSV, `na05_app_narts_provider_level_fwk_std_ptype_202526_14.csv` ("Achievement Rates Providers - Volumes and
   Rates by Provider, SSA T1, Level, Standard-framework name"). The data set link is in `sw-apprenticeships/config.ts`.
2. From gov.uk's "Further education and skills inspections and outcomes as at 31 August 2025" statistics page,
   download `Further_education_and_skills_-_inspection_data_as_at_31_August_2025.csv`. It gives each provider's
   region and local authority, joined by UKPRN. If only the "data, charts and tables" workbook is offered, save its
   sheet `D3_Most_recent_inspection_data` as a CSV (columns `Provider UKPRN`, `Local authority`, `Region`).
3. Run:

   ```bash
   npx tsx scripts/insights/sw-apprenticeships/run.ts --rates <rates.csv> --ofsted <ofsted.csv>
   ```

4. DfE rounds volumes to the nearest 10, so rates are taken as published from each provider's subtotal rows.
   Independent training providers are DfE's "Private Sector Public Funded" type. If the Ofsted columns are named
   differently, the run prints the real header; fix `COLS.ofsted` in `sw-apprenticeships/config.ts`.
5. Check the figures, then set `draft: false` for the page in `src/data/insights.ts`.
