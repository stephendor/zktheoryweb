/**
 * pipeline.ts: apprenticeship achievement among independent training
 * providers in the South West plus Hampshire, from DfE's provider-level
 * achievement rates joined to Ofsted's FE and skills management information
 * by UKPRN.
 *
 * Provider rates are computed from counts (achievers / leavers), summed over
 * the detail rows of the rates file; subtotal rows ("Total") are dropped so
 * nothing is counted twice. The output holds quartiles and counts only: no
 * provider name, UKPRN or single provider's rate.
 */
import type {
  RateSpread,
  SwApprenticeshipsInsight,
  SwApprenticeshipsYear,
} from '../../../src/data/insights/types';
import {
  num,
  pct,
  quantileSorted,
  readDelimited,
  readHeader,
  requireColumns,
  suppressCount,
  SUPPRESS_BELOW,
} from '../lib';
import {
  COLS,
  LEAVERS_MAX,
  LEAVERS_MIN,
  MIN_LEAVERS_IN_CELL,
  RETENTION_BANDS,
  SCOPE,
  TOTAL_VALUES,
  YEARS,
} from './config';

export interface RateRow {
  year: string;
  ukprn: string;
  ssa: string;
  age: string | null;
  leavers: number;
  completers: number;
  achievers: number;
}

export interface OfstedProvider {
  type: string;
  region: string;
  localAuthority: string;
}

interface Counts {
  leavers: number;
  completers: number;
  achievers: number;
}

const add = (a: Counts | undefined, r: Counts): Counts => ({
  leavers: (a?.leavers ?? 0) + r.leavers,
  completers: (a?.completers ?? 0) + r.completers,
  achievers: (a?.achievers ?? 0) + r.achievers,
});

export async function loadRates(path: string): Promise<{ rows: RateRow[]; hasAge: boolean }> {
  const c = COLS.rates;
  const header = await readHeader(path, ',');
  const { age, ...required } = c;
  requireColumns(path, header, Object.values(required));
  const hasAge = header.includes(age);
  const years = new Set<string>(YEARS.map((y) => y.code));
  const rows: RateRow[] = [];
  for await (const r of readDelimited(path, ',')) {
    if (!years.has(r[c.year])) continue;
    const filters = [r[c.ssa], r[c.level], r[c.standard], ...(hasAge ? [r[age]] : [])];
    if (filters.some((v) => TOTAL_VALUES.test(v))) continue; // subtotal row
    const leavers = num(r[c.leavers]);
    if (leavers === null) continue; // suppressed or not applicable
    rows.push({
      year: r[c.year],
      ukprn: r[c.ukprn],
      ssa: r[c.ssa],
      age: hasAge ? r[age] : null,
      leavers,
      completers: num(r[c.completers]) ?? 0,
      achievers: num(r[c.achievers]) ?? 0,
    });
  }
  return { rows, hasAge };
}

export async function loadOfsted(path: string): Promise<Map<string, OfstedProvider>> {
  const c = COLS.ofsted;
  requireColumns(path, await readHeader(path, ','), Object.values(c));
  const map = new Map<string, OfstedProvider>();
  for await (const r of readDelimited(path, ',')) {
    map.set(r[c.ukprn], {
      type: r[c.type],
      region: r[c.region],
      localAuthority: r[c.localAuthority],
    });
  }
  return map;
}

export const inScope = (p: OfstedProvider | undefined) =>
  !!p &&
  SCOPE.providerType.test(p.type) &&
  (p.region === SCOPE.region || SCOPE.localAuthorities.includes(p.localAuthority));

const rate = (c: Counts) => (100 * c.achievers) / c.leavers;
const round1 = (v: number) => Math.round(v * 10) / 10;

export function spread(rates: number[]): RateSpread {
  if (rates.length < SUPPRESS_BELOW)
    return { providers: suppressCount(rates.length), p25: null, median: null, p75: null };
  const s = [...rates].sort((a, b) => a - b);
  return {
    providers: s.length,
    p25: round1(quantileSorted(s, 0.25)),
    median: round1(quantileSorted(s, 0.5)),
    p75: round1(quantileSorted(s, 0.75)),
  };
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
}

function groupBy<K>(rows: RateRow[], key: (r: RateRow) => K): Map<K, Counts> {
  const m = new Map<K, Counts>();
  for (const r of rows) m.set(key(r), add(m.get(key(r)), r));
  return m;
}

/** Quartiles of provider rates within each category, for providers with enough leavers in it. */
function byCategory(rows: RateRow[], providers: Set<string>, cat: (r: RateRow) => string) {
  const cells = groupBy(
    rows.filter((r) => providers.has(r.ukprn)),
    (r) => `${cat(r)}\u0000${r.ukprn}`
  );
  const rates = new Map<string, number[]>();
  for (const [key, c] of cells) {
    if (c.leavers < MIN_LEAVERS_IN_CELL) continue;
    const label = key.split('\u0000')[0];
    rates.set(label, [...(rates.get(label) ?? []), rate(c)]);
  }
  return [...rates.entries()]
    .map(([label, rs]) => ({ label, ...spread(rs) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function compute(
  rows: RateRow[],
  hasAge: boolean,
  ofsted: Map<string, OfstedProvider>,
  sources: { rates: string; ofsted: string },
  generatedAt = new Date().toISOString()
): SwApprenticeshipsInsight {
  const allUkprns = new Set(rows.map((r) => r.ukprn));
  const inScopeAnyYear = new Set<string>();

  const years: SwApprenticeshipsYear[] = YEARS.map(({ code, label }) => {
    const yearRows = rows.filter((r) => r.year === code);
    const national = yearRows.reduce<Counts>((a, r) => add(a, r), {
      leavers: 0,
      completers: 0,
      achievers: 0,
    });
    const allProviderRate = round1(rate(national));

    const byProvider = groupBy(yearRows, (r) => r.ukprn);
    const scoped = [...byProvider.entries()].filter(
      ([ukprn, c]) =>
        inScope(ofsted.get(ukprn)) && c.leavers >= LEAVERS_MIN && c.leavers <= LEAVERS_MAX
    );
    scoped.forEach(([u]) => inScopeAnyYear.add(u));
    const ids = new Set(scoped.map(([u]) => u));
    const achievement = scoped.map(([, c]) => rate(c));
    const retention = scoped.map(([, c]) => (100 * c.completers) / c.leavers);
    const belowN = achievement.filter((r) => r < allProviderRate).length;
    const enough = scoped.length >= SUPPRESS_BELOW;

    // The columns add up to published figures (below, and providers - below),
    // and other cells can be zero, so one small cell could be recovered by
    // subtraction. The table is shown whole or not at all.
    const cells = RETENTION_BANDS.map((b, i) => {
      const lo = i === 0 ? -Infinity : RETENTION_BANDS[i - 1].max;
      const idx = scoped.map((_, j) => j).filter((j) => retention[j] >= lo && retention[j] < b.max);
      const below = idx.filter((j) => achievement[j] < allProviderRate).length;
      return { below, atOrAbove: idx.length - below };
    });
    const showTable =
      enough &&
      cells.every((c) => suppressCount(c.below) !== null && suppressCount(c.atOrAbove) !== null);
    const retentionTable = RETENTION_BANDS.map((b, i) => ({
      band: b.label,
      below: showTable ? cells[i].below : null,
      atOrAbove: showTable ? cells[i].atOrAbove : null,
    }));

    return {
      year: label,
      allProviderRate,
      spread: spread(achievement),
      below: enough ? suppressCount(belowN) : null,
      belowShare: enough && suppressCount(belowN) !== null ? pct(belowN, scoped.length) : null,
      byAge: hasAge ? byCategory(yearRows, ids, (r) => r.age ?? '') : null,
      bySsa: byCategory(yearRows, ids, (r) => r.ssa),
      retention: retentionTable,
      retentionCorrelation: enough ? Math.round(pearson(retention, achievement) * 100) / 100 : null,
    };
  });

  const matched = [...allUkprns].filter((u) => ofsted.has(u)).length;
  return {
    schema: 'sw-apprenticeships/1',
    generatedAt,
    sources,
    join: {
      providersInRates: allUkprns.size,
      matchedToOfsted: matched,
      inScopeAnyYear: inScopeAnyYear.size,
    },
    years,
    methods: [
      "Achievement rates are DfE's published provider-level apprenticeship achievement rates (Explore Education Statistics, Apprenticeships 2025/26 release).",
      `Provider type, region and local authority come from Ofsted's further education and skills management information (providers as at 31 August 2025), joined by UKPRN. ${matched} of ${allUkprns.size} providers in the rates data matched.`,
      `In scope: independent training providers in the South West region or Hampshire with ${LEAVERS_MIN} to ${LEAVERS_MAX} leavers in the year. The group can differ from year to year.`,
      "Each provider's achievement rate is its achievers divided by its leavers, summed over the published detail rows. Retention here is completers divided by leavers. The all-provider rate is the same calculation over every provider in the data, in England.",
      `Spreads show the quartiles (the middle half of providers lies between the 25th and 75th percentiles). Breakdowns by age or sector subject area include a provider only where it had at least ${MIN_LEAVERS_IN_CELL} leavers in that group.`,
      'Any count below 5, and any spread or share based on fewer than 5 providers, is withheld. No provider is named.',
    ],
    limits: [
      'Rows withheld in the published data (small numbers) are missing from the sums, so some provider rates rest on slightly fewer leavers.',
      "Ofsted's provider list is a snapshot at 31 August 2025; providers that changed type, closed or did not match are left out.",
      'These figures describe a group of providers. They are not a judgement on any provider.',
    ],
  };
}
