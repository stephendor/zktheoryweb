/**
 * run.ts: build src/data/insights/sw-apprenticeship-achievement-2025.json.
 *
 *   npx tsx scripts/insights/sw-apprenticeships/run.ts --rates <rates.csv> --ofsted <ofsted-mi.csv>
 *
 * Both inputs are downloaded by hand (see scripts/insights/README.md).
 * Refuses to overwrite an existing output file unless --force is given.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { assertExists } from '../lib';
import { RATES_DATASET_URL } from './config';
import { compute, loadOfsted, loadRates } from './pipeline';

const DEFAULT_OUT = resolve('src/data/insights/sw-apprenticeship-achievement-2025.json');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const ratesPath = arg('rates');
const ofstedPath = arg('ofsted');
const out = resolve(arg('out') ?? DEFAULT_OUT);

if (!ratesPath || !ofstedPath) {
  console.error(
    'Usage: run.ts --rates <achievement rates CSV> --ofsted <Ofsted FE and skills MI CSV> [--out <file>] [--force]\n' +
      `Rates data set: ${RATES_DATASET_URL}`
  );
  process.exit(1);
}
assertExists(resolve(ratesPath), 'Download the provider-level achievement rates CSV.');
assertExists(resolve(ofstedPath), 'Download the Ofsted FE and skills management information CSV.');
if (existsSync(out) && !process.argv.includes('--force')) {
  console.error(
    `${out} already exists. Results files are not overwritten; pass --force only to replace a draft.`
  );
  process.exit(1);
}

const { rows, hasAge } = await loadRates(resolve(ratesPath));
const ofsted = await loadOfsted(resolve(ofstedPath));
const result = compute(rows, hasAge, ofsted, {
  rates: basename(ratesPath),
  ofsted: basename(ofstedPath),
});
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  `Wrote ${out}. ${result.join.matchedToOfsted} of ${result.join.providersInRates} providers matched Ofsted; ` +
    `${result.join.inScopeAnyYear} in scope in at least one year.` +
    (hasAge ? '' : ' No age column in the rates file, so the age-band measure is empty.') +
    ' Review the figures, then set draft: false for the page in src/data/insights.ts.'
);
