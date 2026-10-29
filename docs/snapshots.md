# Unlisted snapshot links (`/s/`)

One-page public-data snapshots are sent to individual organisations by email. Each PDF is served from
`https://zktheory.org/s/<token>/<file>.pdf`, where `<token>` is 10 random lower-case letters and digits.

How these links stay unlisted:

- nothing on the site links to `/s/`;
- `netlify.toml` sends `X-Robots-Tag: noindex, nofollow, noarchive` for `/s/*`;
- the sitemap filter in `astro.config.mjs` leaves out `/s/`;
- only PDFs live under `public/s/`. Pagefind indexes built HTML only, so it never sees them.

`scripts/snapshots/snapshots.test.ts` (part of `npm run test`) checks all four. Don't put a README or any other
file inside `public/s/`: everything there is served.

## Adding snapshots

1. Put the PDFs in a folder **outside the repo**. Name each file in lower case, for example
   `snapshot-example-trust.pdf`.
2. Optional: preview the run with `node scripts/snapshots/add.mjs <folder> --dry-run`.
3. Run:

   ```bash
   node scripts/snapshots/add.mjs <folder> > ~/snapshot-links-YYYY-MM-DD.csv
   ```

   Every PDF is checked first: the name must be safe and the file must start with `%PDF-`. If any file
   fails, nothing is copied. Each file is then copied to its own new token folder. The CSV has the columns
   `file,token,url`.

4. Keep the CSV, and any note of which organisation got which link, **outside the repo** (for example in the
   CRM). The repo must never hold the organisation-to-link map.
5. Commit the new `public/s/<token>/` folders and deploy.

## Retiring snapshots

When outreach ends, or an organisation asks, remove the folders:

```bash
node scripts/snapshots/retire.mjs <token> [<token> ...]
```

```bash
node scripts/snapshots/retire.mjs ~/snapshot-links-YYYY-MM-DD.csv
```

`--dry-run` lists what would go. Every token is checked first; if any is malformed or missing, nothing is
removed. Commit the deletions and deploy. The link stops working at the next deploy, and the CDN cache
(`max-age=3600`) clears within the hour.
