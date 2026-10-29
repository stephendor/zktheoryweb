/**
 * pipeline.ts: apprenticeship achievement among independent training
 * providers in the South West plus Hampshire, from DfE's provider-level
 * achievement rates joined to Ofsted's FE and skills management information
 * by UKPRN (for region and local authority).
 *
 * DfE rounds the published volumes to the nearest 10 but calculates the rates
 * on unrounded figures, so rates are taken as published from the subtotal
 * rows ("Total" in the other filters): each provider's overall row, its
 * sector-subject-area rows and its age-group rows. Rounded leavers are used
 * only for the size range and as weights. The output holds quartiles and
 * counts only: no provider name, UKPRN or single provider's rate.
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

/** One published subtotal row: a provider's overall figures, or one subject area or age group. */
export interface RateRow {
  year: string;
  ukprn: string;
  /** DfE provider type, e.g. "Private Sector Public Funded". */
  providerType: string;
  kind: 'overall' | 'ssa' | 'age';
  /** The subject area or age group; '' for the overall row. */
  label: string;
  /** Rounded to the nearest 10 by DfE. */
  leavers: number;
  achievementRate: number | null;
  retentionRate: number | null;
}

export interface OfstedProvider {
  region: string;
  localAuthority: string;
}

const isTotal = (v: string | undefined) => v === undefined || TOTAL_VALUES.test(v);

export async function loadRates(path: string): Promise<{ rows: RateRow[]; hasAge: boolean }> {
  const c = COLS.rates;
  const header = await readHeader(path, ',');
  const { ageGroup, ageYouthAdult, ...required } = c;
  requireColumns(path, header, Object.values(required));
  const hasAge = header.includes(ageGroup);
  const years = new Set<string>(YEARS.map((y) => y.code));
  const rows: RateRow[] = [];
  for await (const r of readDelimited(path, ',')) {
    if (!years.has(r[c.year])) continue;
    const ssaTotal = isTotal(r[c.ssa]);
    const restTotal = isTotal(r[c.level]) && isTotal(r[c.standard]);
    const ageTotal = !hasAge || (isTotal(r[ageGroup]) && isTotal(r[ageYouthAdult]));
    let kind: RateRow['kind'] | null = null;
    let label = '';
    if (ssaTotal && restTotal && ageTotal) kind = 'overall';
    else if (!ssaTotal && restTotal && ageTotal) [kind, label] = ['ssa', r[c.ssa]];
    else if (hasAge && ssaTotal && restTotal && !isTotal(r[ageGroup]))
      [kind, label] = ['age', r[ageGroup]];
    if (!kind) continue; // a detail row: the subtotals already include it
    const leavers = num(r[c.leavers]);
    if (leavers === null) continue; // withheld
    rows.push({
      year: r[c.year],
      ukprn: r[c.ukprn],
      providerType: r[c.providerType],
      kind,
      label,
      leavers,
      achievementRate: num(r[c.achievementRate]),
      retentionRate: num(r[c.retentionRate]),
    });
  }
  return { rows, hasAge };
}

export async function loadOfsted(path: string): Promise<Map<string, OfstedProvider>> {
  const header = await readHeader(path, ',');
  const pick = (names: readonly string[]) => names.find((n) => header.includes(n));
  const ukprn = pick(COLS.ofsted.ukprn);
  const region = pick(COLS.ofsted.region);
  const localAuthority = pick(COLS.ofsted.localAuthority);
  if (!ukprn || !region || !localAuthority) {
    requireColumns(path, header, [
      ukprn ?? COLS.ofsted.ukprn.join(' or '),
      region ?? COLS.ofsted.region.join(' or '),
      localAuthority ?? COLS.ofsted.localAuthority.join(' or '),
    ]);
  }
  const map = new Map<string, OfstedProvider>();
  for await (const r of readDelimited(path, ',')) {
    map.set(r[ukprn!], { region: r[region!], localAuthority: r[localAuthority!] });
  }
  return map;
}

/** In the area: the South West region, or one of the named local authorities. */
export const inArea = (p: OfstedProvider | undefined) =>
  !!p && (p.region === SCOPE.region || SCOPE.localAuthorities.includes(p.localAuthority));

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

/** Quartiles of provider rates within each subject area or age group. */
function byCategory(rows: RateRow[], kind: 'ssa' | 'age', providers: Set<string>) {
  const rates = new Map<string, number[]>();
  for (const r of rows) {
    if (r.kind !== kind || !providers.has(r.ukprn) || r.achievementRate === null) continue;
    if (r.leavers < MIN_LEAVERS_IN_CELL) continue;
    rates.set(r.label, [...(rates.get(r.label) ?? []), r.achievementRate]);
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
    const overall = yearRows.filter((r) => r.kind === 'overall' && r.achievementRate !== null);

    // All providers in England: published rates weighted by (rounded) leavers.
    const weight = overall.reduce((a, r) => a + r.leavers, 0);
    const allProviderRate = round1(
      overall.reduce((a, r) => a + r.achievementRate! * r.leavers, 0) / (weight || 1)
    );

    const scoped = overall.filter(
      (r) =>
        SCOPE.providerType.test(r.providerType) &&
        inArea(ofsted.get(r.ukprn)) &&
        r.leavers >= LEAVERS_MIN &&
        r.leavers <= LEAVERS_MAX
    );
    scoped.forEach((r) => inScopeAnyYear.add(r.ukprn));
    const ids = new Set(scoped.map((r) => r.ukprn));
    const achievement = scoped.map((r) => r.achievementRate!);
    const pairs = scoped
      .filter((r) => r.retentionRate !== null)
      .map((r) => ({ retention: r.retentionRate!, achievement: r.achievementRate! }));
    const enoughPairs = pairs.length >= SUPPRESS_BELOW;
    const belowN = achievement.filter((r) => r < allProviderRate).length;
    const enough = scoped.length >= SUPPRESS_BELOW;

    // The columns add up to published figures (below, and providers - below),
    // and other cells can be zero, so one small cell could be recovered by
    // subtraction. The table is shown whole or not at all.
    const cells = RETENTION_BANDS.map((b, i) => {
      const lo = i === 0 ? -Infinity : RETENTION_BANDS[i - 1].max;
      const inBand = pairs.filter((x) => x.retention >= lo && x.retention < b.max);
      const below = inBand.filter((x) => x.achievement < allProviderRate).length;
      return { below, atOrAbove: inBand.length - below };
    });
    const showTable =
      enoughPairs &&
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
      byAge: hasAge ? byCategory(yearRows, 'age', ids) : null,
      bySsa: byCategory(yearRows, 'ssa', ids),
      retention: retentionTable,
      retentionCorrelation: enoughPairs
        ? Math.round(
            pearson(
              pairs.map((x) => x.retention),
              pairs.map((x) => x.achievement)
            ) * 100
          ) / 100
        : null,
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
      "Achievement and retention rates are DfE's published provider-level apprenticeship rates (Explore Education Statistics, Apprenticeships 2025/26 release), taken as published from each provider's overall, subject-area and age-group rows.",
      'Independent training providers are those DfE classes as "Private Sector Public Funded".',
      `Region and local authority come from Ofsted's further education and skills management information (providers as at 31 August 2025), joined by UKPRN. ${matched.toLocaleString('en-GB')} of ${allUkprns.size.toLocaleString('en-GB')} providers in the rates data matched.`,
      `In scope: independent training providers in the South West region, or in Hampshire, Portsmouth or Southampton, with ${LEAVERS_MIN} to ${LEAVERS_MAX} leavers in the year (DfE rounds leaver numbers to the nearest 10). The group can differ from year to year.`,
      "The all-provider rate is the average of every provider's published rate in England, weighted by its leavers, so it can differ slightly from DfE's national headline figure.",
      `Spreads show the quartiles: the middle half of providers lies between the 25th and 75th percentiles. Breakdowns by age or subject area include a provider only where it had at least ${MIN_LEAVERS_IN_CELL} leavers in that group.`,
      'Any count below 5, and any spread or share based on fewer than 5 providers, is withheld. No provider is named.',
    ],
    limits: [
      'Where DfE withholds a figure for small numbers, that provider or group is left out of the spread.',
      "Ofsted's provider list is a snapshot at 31 August 2025; providers that closed or did not match are left out.",
      'These figures describe a group of providers. They are not a judgement on any provider.',
    ],
  };
}
