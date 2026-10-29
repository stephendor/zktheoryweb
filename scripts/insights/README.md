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

1. From Explore Education Statistics (Apprenticeships 2025/26 release), download the CSV for "Achievement Rates
   Providers - Volumes and Rates by Provider, SSA T1, Level, Standard-framework name". The data set link is in
   `sw-apprenticeships/config.ts`.
2. From gov.uk, download Ofsted's "Further education and skills inspections and outcomes: management information"
   CSV of providers as at 31 August 2025. It gives the provider type, region and local authority, which are joined
   by UKPRN.
3. Run:

   ```bash
   npx tsx scripts/insights/sw-apprenticeships/run.ts --rates <rates.csv> --ofsted <ofsted.csv>
   ```

4. If a column is missing, the run prints the real header. Fix `sw-apprenticeships/config.ts`, for example the
   Ofsted region column or the provider type wording that `SCOPE.providerType` matches. If the rates file has no age
   column, the age breakdown is left out. The run says so, and the page skips that table.
5. Check the figures, then set `draft: false` for the page in `src/data/insights.ts`.
