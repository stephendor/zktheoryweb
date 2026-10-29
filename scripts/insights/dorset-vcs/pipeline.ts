/**
 * pipeline.ts: Dorset and BCP voluntary sector figures from the Charity
 * Commission register extract.
 *
 * load(): streams the four extract files and the ONS postcode lookup, keeping
 * only main (not linked) registered charities whose contact postcode is in
 * the Dorset Council or BCP Council areas. compute(): turns those rows into
 * the aggregate-only, suppressed JSON in src/data/insights/types.ts.
 * No charity name is ever read into the output.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CountShare, DorsetVcsInsight } from '../../../src/data/insights/types';
import {
  median,
  num,
  pct,
  readDelimited,
  readFieldNames,
  readHeader,
  readRecords,
  requireColumns,
  roundTo,
  suppressCount,
  suppressPartition,
  suppressStat,
  type Row,
} from '../lib';
import { AREAS, CC_FILES, COLS, INCOME_BANDS, REGISTERED, TREND_YEARS } from './config';

export interface Charity {
  org: string;
  lad: string;
  type: string;
  latestIncome: number | null;
}

export interface LoadedData {
  extractDate: string;
  postcodeLookup: string;
  charities: Charity[];
  /** Latest Part A row per charity. */
  partA: Map<
    string,
    { periodEnd: string; income: number | null; volunteers: number | null; gov: number | null }
  >;
  /** Gross income by charity and financial year end (calendar year). */
  history: Map<string, Map<number, number>>;
  classification: { org: string; type: string; description: string }[];
}

export const normalisePostcode = (pc: string) => pc.toUpperCase().replace(/\s+/g, '');
const yearOf = (date: string) => Number(date.slice(0, 4));

async function checked(path: string, needed: string[]): Promise<void> {
  requireColumns(path, await readFieldNames(path), needed);
}

/** The extract file for `name` in `rawDir`: the JSON download if present, else the text one. */
export function extractFile(rawDir: string, name: string): string {
  const json = join(rawDir, `${name}.json`);
  return existsSync(json) ? json : join(rawDir, `${name}.txt`);
}

/** Map postcode -> LAD code, for postcodes in the target areas only. */
export async function loadPostcodes(lookupCsv: string): Promise<Map<string, string>> {
  const header = await readHeader(lookupCsv, ',');
  const pcCol = COLS.onsPostcode.find((c) => header.includes(c));
  const ladCol = header.find((h) => COLS.onsLad.test(h));
  if (!pcCol || !ladCol) requireColumns(lookupCsv, header, ['pcds (or pcd)', 'ladNNcd']);
  const wanted = new Set<string>(AREAS.map((a) => a.code));
  const map = new Map<string, string>();
  for await (const row of readDelimited(lookupCsv, ',')) {
    const lad = row[ladCol!];
    if (wanted.has(lad)) map.set(normalisePostcode(row[pcCol!]), lad);
  }
  return map;
}

export async function load(rawDir: string, lookupCsv: string): Promise<LoadedData> {
  const file = (name: string) => extractFile(rawDir, name);
  const c = COLS.charity;
  await checked(file(CC_FILES.charity), Object.values(c));
  await checked(file(CC_FILES.partA), Object.values(COLS.partA));
  await checked(file(CC_FILES.history), Object.values(COLS.history));
  await checked(file(CC_FILES.classification), Object.values(COLS.classification));

  const postcodes = await loadPostcodes(lookupCsv);

  let extractDate = '';
  const charities: Charity[] = [];
  for await (const r of readRecords(file(CC_FILES.charity))) {
    extractDate ||= r[c.extractDate].slice(0, 10);
    if (r[c.status] !== REGISTERED) continue;
    if ((num(r[c.linked]) ?? 0) !== 0) continue; // linked (subsidiary) charities are counted with their main charity
    const lad = postcodes.get(normalisePostcode(r[c.postcode]));
    if (!lad) continue;
    charities.push({
      org: r[c.org],
      lad,
      type: r[c.type] || 'Not stated',
      latestIncome: num(r[c.latestIncome]),
    });
  }
  const inArea = new Set(charities.map((ch) => ch.org));

  const partA: LoadedData['partA'] = new Map();
  const p = COLS.partA;
  for await (const r of readRecords(file(CC_FILES.partA))) {
    if (!inArea.has(r[p.org])) continue;
    const prev = partA.get(r[p.org]);
    if (prev && prev.periodEnd >= r[p.periodEnd]) continue;
    const contracts = num(r[p.govContracts]);
    const grants = num(r[p.govGrants]);
    partA.set(r[p.org], {
      periodEnd: r[p.periodEnd],
      income: num(r[p.income]),
      volunteers: num(r[p.volunteers]),
      gov: contracts === null && grants === null ? null : (contracts ?? 0) + (grants ?? 0),
    });
  }

  const history: LoadedData['history'] = new Map();
  const h = COLS.history;
  for await (const r of readRecords(file(CC_FILES.history))) {
    if (!inArea.has(r[h.org])) continue;
    const income = num(r[h.income]);
    if (income === null) continue;
    const byYear = history.get(r[h.org]) ?? new Map<number, number>();
    byYear.set(yearOf(r[h.periodEnd]), income); // one return per charity per year
    history.set(r[h.org], byYear);
  }

  const classification: LoadedData['classification'] = [];
  const k = COLS.classification;
  for await (const r of readRecords(file(CC_FILES.classification))) {
    if (inArea.has(r[k.org]))
      classification.push({ org: r[k.org], type: r[k.type], description: r[k.description] });
  }

  return { extractDate, postcodeLookup: lookupCsv, charities, partA, history, classification };
}

function bands(incomes: number[]): CountShare[] {
  const raw = INCOME_BANDS.map((b, i) => {
    const lo = i === 0 ? -Infinity : INCOME_BANDS[i - 1].max;
    return incomes.filter((v) => v >= lo && v < b.max).length;
  });
  const counts = suppressPartition(raw);
  return INCOME_BANDS.map((b, i) => ({
    label: b.label,
    count: counts[i],
    share: counts[i] === null ? null : pct(raw[i], incomes.length),
  }));
}

/**
 * Counts and shares per label. `partition` is true when every organisation
 * has exactly one label (so the counts add up to a published total) and
 * secondary suppression is needed.
 */
function countShares(labels: string[], whole: number, partition: boolean): CountShare[] {
  const tally = new Map<string, number>();
  for (const l of labels) tally.set(l, (tally.get(l) ?? 0) + 1);
  const entries = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const raw = entries.map(([, n]) => n);
  const counts = partition ? suppressPartition(raw) : raw.map(suppressCount);
  return entries.map(([label, n], i) => ({
    label,
    count: counts[i],
    share: counts[i] === null ? null : pct(n, whole),
  }));
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function compute(
  data: LoadedData,
  generatedAt = new Date().toISOString()
): DorsetVcsInsight {
  const { charities } = data;
  const incomes = charities.map((c) => c.latestIncome).filter((v): v is number => v !== null);

  // Five complete financial years: those ending before the extract year,
  // since returns for years ending in the extract year are mostly not yet due.
  const lastYear = Number(data.extractDate.slice(0, 4)) - 1;
  const trend = Array.from({ length: TREND_YEARS }, (_, i) => lastYear - TREND_YEARS + 1 + i).map(
    (year) => {
      const values = [...data.history.values()]
        .map((m) => m.get(year))
        .filter((v): v is number => v !== undefined);
      return {
        yearEnding: year,
        filers: suppressCount(values.length),
        medianIncome: roundTo(suppressStat(values.length, median(values)), 1000),
        totalIncome: roundTo(suppressStat(values.length, sum(values)), 100_000),
      };
    }
  );

  const partA = [...data.partA.values()];
  const withGov = partA.filter((r) => r.gov !== null);
  const govIncome = sum(withGov.map((r) => r.gov ?? 0));
  const partAIncome = sum(withGov.map((r) => r.income ?? 0));
  const volunteers = partA.map((r) => r.volunteers).filter((v): v is number => v !== null);

  const byType = (t: string) =>
    countShares(
      [
        ...new Set(
          data.classification
            .filter((c) => c.type.toLowerCase() === t)
            .map((c) => `${c.org}\u0000${c.description}`)
        ),
      ].map((key) => key.split('\u0000')[1]),
      charities.length,
      false
    );

  const areaCounts = suppressPartition(
    AREAS.map((a) => charities.filter((c) => c.lad === a.code).length)
  );
  const areas = AREAS.map((a, i) => {
    const inLad = charities.filter((c) => c.lad === a.code);
    const ladIncomes = inLad.map((c) => c.latestIncome).filter((v): v is number => v !== null);
    return {
      code: a.code,
      name: a.name,
      charities: areaCounts[i],
      totalIncome: roundTo(suppressStat(ladIncomes.length, sum(ladIncomes)), 100_000),
      medianIncome: roundTo(suppressStat(ladIncomes.length, median(ladIncomes)), 1000),
      incomeBands: bands(ladIncomes),
    };
  });

  return {
    schema: 'dorset-vcs/1',
    extractDate: data.extractDate,
    generatedAt,
    postcodeLookup: `ONS postcode to local authority lookup, November 2025 (ArcGIS item ${'c4f84c38814d4b82aa4760ade686c3cc'})`,
    totals: {
      charities: charities.length,
      // Withheld together: either one gives the other by subtraction from the total.
      withIncome: suppressCount(charities.length - incomes.length) === null ? null : incomes.length,
      noIncomeReported: suppressCount(charities.length - incomes.length),
      totalIncome: roundTo(suppressStat(incomes.length, sum(incomes)), 100_000),
      medianIncome: roundTo(suppressStat(incomes.length, median(incomes)), 1000),
    },
    incomeBands: bands(incomes),
    trend,
    government: {
      charitiesWithPartA: withGov.length,
      shareReceiving: suppressStat(
        withGov.length,
        pct(withGov.filter((r) => (r.gov ?? 0) > 0).length, withGov.length) ?? 0
      ),
      shareOfIncome: suppressStat(withGov.length, pct(govIncome, partAIncome) ?? 0),
    },
    volunteers: {
      charitiesReporting: volunteers.length,
      total: suppressStat(volunteers.length, sum(volunteers)),
      median: suppressStat(volunteers.length, median(volunteers)),
    },
    legalForm: countShares(
      charities.map((c) => c.type),
      charities.length,
      true
    ),
    classification: { what: byType('what'), who: byType('who'), how: byType('how') },
    areas,
    methods: [
      'Registered charities on the Charity Commission register for England and Wales whose contact postcode is in the Dorset Council (E06000059) or Bournemouth, Christchurch and Poole Council (E06000058) area, matched with the ONS postcode to local authority lookup (November 2025). Linked charities are counted with their main charity.',
      "Income bands and totals use each charity's latest reported income on the register.",
      `The five-year trend covers financial years ending ${lastYear - TREND_YEARS + 1} to ${lastYear}, using each charity's annual return history, and counts the charities that filed for each year.`,
      'Government income is income from government contracts plus government grants, from the latest Part A of the annual return. Part A is filed only by charities above the annual return income threshold.',
      'Classifications are those charities choose on the register: what they do, who they help and how. A charity can choose several, so shares add up to more than 100%.',
      'Any count below 5, and any figure based on fewer than 5 charities, is withheld. Totals are rounded to the nearest £100,000 and medians to the nearest £1,000.',
    ],
    limits: [
      'Registered charities only: unregistered groups, community interest companies and exempt or excepted charities are not included.',
      'A charity is placed by its contact postcode, which may not be where it works.',
      'Figures use the latest year each charity has filed, and some returns are late, so recent years are incomplete.',
    ],
  };
}

export type { Row };
