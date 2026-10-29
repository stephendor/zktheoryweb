/**
 * run.ts: build src/data/insights/dorset-vcs-2026.json.
 *
 *   npx tsx scripts/insights/dorset-vcs/run.ts --download [--lookup <ons.csv>]
 *   npx tsx scripts/insights/dorset-vcs/run.ts --raw <dir> --lookup <ons.csv> [--out <file>]
 *     [--lookup-name "<product, edition>"] [--grants <GrantNav.csv> ...]
 *
 * --download fetches the four register extract zips into
 * scripts/insights/dorset-vcs/raw/ (gitignored) and unzips them. The ONS
 * lookup is a large CSV: download it from the ArcGIS item in config.ts and
 * pass its path with --lookup. See scripts/insights/README.md.
 *
 * Refuses to overwrite an existing output file unless --force is given.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertExists, download, unzip } from '../lib';
import { CC_BASE, CC_FILES, ONS_LOOKUP_URL } from './config';
import { compute, extractFile, load, loadGrants } from './pipeline';

const HERE = resolve('scripts/insights/dorset-vcs');
const DEFAULT_OUT = resolve('src/data/insights/dorset-vcs-2026.json');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const rawDir = resolve(arg('raw') ?? join(HERE, 'raw'));
const lookup = arg('lookup');
const out = resolve(arg('out') ?? DEFAULT_OUT);

if (process.argv.includes('--download')) {
  for (const name of Object.values(CC_FILES)) {
    const zip = join(rawDir, `${name}.zip`);
    console.log(`Downloading ${name}.zip`);
    await download(`${CC_BASE}/${name}.zip`, zip);
    unzip(zip, rawDir);
  }
}

if (!lookup) {
  console.error(
    `Pass --lookup <path to the ONS postcode lookup CSV>. Download it from ${ONS_LOOKUP_URL}`
  );
  process.exit(1);
}
for (const name of Object.values(CC_FILES)) {
  assertExists(
    extractFile(rawDir, name),
    'Run with --download, or put the unzipped extract files (.json or .txt) in --raw.'
  );
}
if (existsSync(out) && !process.argv.includes('--force')) {
  console.error(
    `${out} already exists. Results files are not overwritten; pass --force only to replace a draft.`
  );
  process.exit(1);
}

// Optional, repeatable: --grants <GrantNav CSV> for the funder-concentration measure.
const grantFiles = process.argv.flatMap((a, i) =>
  a === '--grants' && process.argv[i + 1] ? [resolve(process.argv[i + 1])] : []
);
const data = await load(rawDir, resolve(lookup));
// --lookup-name names the postcode product on the page, e.g. "ONS Postcode Directory (ONSPD), November 2025".
const lookupName = arg('lookup-name');
if (lookupName) data.postcodeLookup = lookupName;
const grants = grantFiles.length
  ? await loadGrants(grantFiles, new Set(data.charities.map((c) => c.regNo)))
  : null;
const result = compute(data, undefined, grants);
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  `Wrote ${out}: ${result.totals.charities} charities, extract ${result.extractDate}. ` +
    'Review the figures, then set draft: false for the page in src/data/insights.ts.'
);
