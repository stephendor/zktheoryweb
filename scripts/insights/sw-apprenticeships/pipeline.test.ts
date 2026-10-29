/**
 * Fixture test for the South West apprenticeship pipeline, in the layout of
 * DfE's provider-level file: an overall row per provider and year, subject
 * area and age-group subtotal rows, and detail rows that must be ignored.
 * Covers scope (DfE provider type, Ofsted region or local authority, leaver
 * range), published rates, the weighted all-provider rate, quartiles,
 * suppression, and that no UKPRN or name reaches the output.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { compute, inArea, loadOfsted, loadRates, type RateRow } from './pipeline';

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) fs.rmSync(d, { recursive: true, force: true });
});

const ITP = 'Private Sector Public Funded';
const COLLEGE = 'General FE College incl Tertiary';

// ukprn, DfE type, Ofsted region, local authority, leavers, achievement %, retention %
const PROVIDERS: [string, string, string, string, number, number, number][] = [
  ['10000001', ITP, 'South West', 'Devon', 100, 50, 60],
  ['10000002', ITP, 'South West', 'Dorset', 100, 55, 65],
  ['10000003', ITP, 'South West', 'Somerset', 100, 60, 70],
  ['10000004', ITP, 'South West', 'Cornwall', 100, 65, 75],
  ['10000005', ITP, 'South East', 'Southampton', 100, 70, 85],
  ['10000006', ITP, 'South West', 'Wiltshire', 100, 75, 90],
  ['10000007', COLLEGE, 'South West', 'Devon', 100, 10, 20], // not an independent provider
  ['10000008', ITP, 'London', 'Camden', 100, 10, 20], // outside the area
  ['10000009', ITP, 'South West', 'Devon', 10, 100, 100], // too few leavers
  ['10000010', ITP, 'South West', 'Devon', 700, 90, 95], // too many leavers
  ['10000011', ITP, 'South East', 'Kent', 100, 10, 20], // South East, not Hampshire
];

const HEADER =
  'time_period,time_identifier,geographic_level,country_code,country_name,provider_name,provider_ukprn,provider_type,ssa_tier_1,level,std_fwk_name_stcode,age_youth_adult,age_group,leavers,completers,achievers,retention_rate,pass_rate,achievement_rate';

function row(
  year: string,
  ukprn: string,
  type: string,
  f: { ssa?: string; level?: string; std?: string; youth?: string; age?: string },
  leavers: number | string,
  ach: number | string,
  ret: number | string
) {
  const T = 'Total';
  return [
    year,
    'Academic year',
    'Provider',
    'E92000001',
    'England',
    `"Provider ${ukprn}, Ltd (${ukprn})"`,
    ukprn,
    type,
    f.ssa ?? T,
    f.level ?? T,
    f.std ?? T,
    f.youth ?? T,
    f.age ?? T,
    leavers,
    0,
    0,
    ret,
    100,
    ach,
  ].join(',');
}

function writeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-app-'));
  tmpRoots.push(dir);
  const lines = [HEADER];
  for (const [u, type, , , leavers, ach, ret] of PROVIDERS) {
    lines.push(row('202425', u, type, {}, leavers, ach, ret)); // overall
    lines.push(row('202425', u, type, { ssa: 'Construction' }, leavers, ach, ret)); // subject area
    lines.push(row('202425', u, type, { youth: '16-18', age: '16-18' }, 50, ach - 5, ret));
    lines.push(row('202425', u, type, { youth: '19+', age: '19-23' }, 50, ach + 5, ret));
    // Detail rows (two filters set) are already in the subtotals: ignored.
    lines.push(
      row('202425', u, type, { ssa: 'Construction', level: 'Intermediate Level' }, 9990, 1, 1)
    );
    lines.push(
      row('202425', u, type, { level: 'Intermediate Level', youth: '19+', age: '24+' }, 9990, 1, 1)
    );
  }
  // A withheld row and an out-of-range year are ignored.
  lines.push(row('202425', '10000001', ITP, { ssa: 'Health' }, 'c', 'c', 'c'));
  lines.push(row('202122', '10000001', ITP, {}, 999, 1, 1));
  const rates = path.join(dir, 'rates.csv');
  fs.writeFileSync(rates, lines.join('\n') + '\n');

  const ofsted = path.join(dir, 'ofsted.csv');
  fs.writeFileSync(
    ofsted,
    [
      'Provider URN,Provider UKPRN,Provider name,Provider type,Local authority,Region,Ofsted region',
      ...PROVIDERS.map(([u, , r, la]) => `1${u},${u},"Provider ${u}",x,${la},${r},x`),
    ].join('\n') + '\n'
  );
  return { rates, ofsted };
}

describe('sw-apprenticeships pipeline', () => {
  it('reads published subtotal rows and scopes providers', async () => {
    const { rates, ofsted } = writeFixture();
    const { rows, hasAge } = await loadRates(rates);
    expect(hasAge).toBe(true);
    expect(rows.filter((r) => r.kind === 'overall')).toHaveLength(PROVIDERS.length);
    expect(rows.some((r) => r.leavers === 9990)).toBe(false); // detail rows skipped

    const out = compute(rows, hasAge, await loadOfsted(ofsted), { rates: 'r', ofsted: 'o' }, 'T');
    const y = out.years.find((x) => x.year === '2024/25')!;

    // All providers in England: published rates weighted by leavers.
    const weight = PROVIDERS.reduce((a, p) => a + p[4], 0);
    const weighted = PROVIDERS.reduce((a, p) => a + p[4] * p[5], 0);
    expect(y.allProviderRate).toBe(Math.round((10 * weighted) / weight) / 10); // 69.8

    // In scope: providers 1–6 (rates 50, 55, 60, 65, 70, 75).
    expect(y.spread).toEqual({ providers: 6, p25: 56.3, median: 62.5, p75: 68.8 });
    expect(out.join).toEqual({ providersInRates: 11, matchedToOfsted: 11, inScopeAnyYear: 6 });
    expect(y.below).toBeNull(); // 50, 55, 60, 65 are below 69.8: 4, withheld

    expect(y.bySsa).toEqual([
      { label: 'Construction', providers: 6, p25: 56.3, median: 62.5, p75: 68.8 },
    ]);
    expect(y.byAge?.map((a) => [a.label, a.median])).toEqual([
      ['16-18', 57.5],
      ['19-23', 67.5],
    ]);

    // Years with no rows: nothing in scope, everything withheld.
    expect(out.years[0].spread.providers).toBe(0);
    expect(out.years[0].retentionCorrelation).toBeNull();
  });

  it('suppresses the retention table and never outputs a UKPRN or name', async () => {
    const { rates, ofsted } = writeFixture();
    const { rows, hasAge } = await loadRates(rates);
    const out = compute(rows, hasAge, await loadOfsted(ofsted), { rates: 'r', ofsted: 'o' }, 'T');
    const y = out.years[2];
    // Retention 60, 65, 70, 75, 85, 90: two providers per band, so the table is withheld.
    for (const r of y.retention) {
      expect(r.below).toBeNull();
      expect(r.atOrAbove).toBeNull();
    }
    expect(y.retentionCorrelation).toBeGreaterThan(0.9);
    const json = JSON.stringify(out);
    for (const [ukprn] of PROVIDERS) expect(json).not.toContain(ukprn);
    expect(json).not.toContain('Provider 1');
  });

  it('shows the retention table when every cell has 5 or more providers', () => {
    const rows: RateRow[] = [];
    const ofsted = new Map();
    for (let i = 0; i < 30; i++) {
      const ukprn = String(20000000 + i);
      rows.push({
        year: '202425',
        ukprn,
        providerType: ITP,
        kind: 'overall',
        label: '',
        leavers: 100,
        achievementRate: i % 2 === 0 ? 40 : 80,
        retentionRate: [50, 65, 90][i % 3],
      });
      ofsted.set(ukprn, { region: 'South West', localAuthority: 'Devon' });
    }
    const y = compute(rows, false, ofsted, { rates: 'r', ofsted: 'o' }, 'T').years[2];
    expect(y.allProviderRate).toBe(60);
    expect(y.below).toBe(15);
    expect(y.retention).toEqual([
      { band: 'Under 60%', below: 5, atOrAbove: 5 },
      { band: '60% to under 75%', below: 5, atOrAbove: 5 },
      { band: '75% and over', below: 5, atOrAbove: 5 },
    ]);
    expect(y.byAge).toBeNull();
  });

  it('includes Hampshire, Portsmouth and Southampton from the South East, and nowhere else there', () => {
    const se = (localAuthority: string) => ({ region: 'South East', localAuthority });
    expect(['Hampshire', 'Portsmouth', 'Southampton'].map((la) => inArea(se(la)))).toEqual([
      true,
      true,
      true,
    ]);
    expect(inArea(se('Kent'))).toBe(false);
  });

  it('NEGATIVE CONTROL: stops and prints the header when a rates column is missing', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-app-'));
    tmpRoots.push(dir);
    const p = path.join(dir, 'rates.csv');
    fs.writeFileSync(p, 'time_period,provider_ukprn,leavers\n202425,1,10\n');
    await expect(loadRates(p)).rejects.toThrow(
      /missing column\(s\)[\s\S]*achievement_rate[\s\S]*Header found/
    );
  });
});
