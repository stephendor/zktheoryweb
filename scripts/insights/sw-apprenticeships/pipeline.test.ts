/**
 * Fixture test for the South West apprenticeship pipeline: a small rates CSV
 * (with subtotal rows to skip) and an Ofsted provider list, run end to end.
 * Covers the scope rules, rates from counts, the all-provider rate,
 * quartiles, suppression, and that no UKPRN or name reaches the output.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { compute, inScope, loadOfsted, loadRates } from './pipeline';

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) fs.rmSync(d, { recursive: true, force: true });
});

// ukprn, type, region, local authority, leavers, achievers, retention rate % (2024/25, one SSA each unless noted)
const PROVIDERS: [string, string, string, string, number, number, number][] = [
  ['10000001', 'Independent learning provider', 'South West', 'Devon', 100, 50, 60],
  ['10000002', 'Independent learning provider', 'South West', 'Dorset', 100, 55, 65],
  ['10000003', 'Independent learning provider', 'South West', 'Somerset', 100, 60, 70],
  ['10000004', 'Independent learning provider', 'South West', 'Cornwall', 100, 65, 75],
  ['10000005', 'Independent learning provider', 'South East', 'Hampshire', 100, 70, 85],
  ['10000006', 'Independent learning provider', 'South West', 'Wiltshire', 100, 75, 90],
  ['10000007', 'General further education college', 'South West', 'Devon', 100, 10, 20], // wrong type
  ['10000008', 'Independent learning provider', 'London', 'Camden', 100, 10, 20], // wrong region
  ['10000009', 'Independent learning provider', 'South West', 'Devon', 15, 15, 100], // too few leavers
  ['10000010', 'Independent learning provider', 'South West', 'Devon', 700, 700, 100], // too many
  ['10000011', 'Independent learning provider', 'South East', 'Kent', 100, 10, 20], // SE, not Hampshire
];

function writeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-app-'));
  tmpRoots.push(dir);
  const header =
    'time_period,provider_ukprn,provider_name,ssa_tier_1,level,std_fwk_name,age_summary,leavers,retention_rate,achievers';
  const lines = [header];
  for (const [ukprn, , , , leavers, achievers, retention] of PROVIDERS) {
    const name = `Provider ${ukprn}`;
    // Split each provider over two age bands in one SSA, plus a subtotal row that must be skipped.
    const half = (n: number) => [Math.floor(n / 2), n - Math.floor(n / 2)];
    const [l1, l2] = half(leavers);
    const [a1, a2] = half(achievers);
    // Published retention differs by row; with equal halves the leaver-weighted mean is `retention`.
    const [c1, c2] = l1 === l2 ? [retention - 10, retention + 10] : [retention, retention];
    lines.push(`202425,${ukprn},"${name}",Construction,Level 2,Bricklayer,16-18,${l1},${c1},${a1}`);
    lines.push(`202425,${ukprn},"${name}",Construction,Level 2,Bricklayer,19+,${l2},${c2},${a2}`);
    lines.push(
      `202425,${ukprn},"${name}",Total,Total,Total,Total,${leavers},${retention},${achievers}`
    );
  }
  // A suppressed row ("c") is skipped, and an out-of-range year is ignored.
  lines.push('202425,10000001,"Provider 10000001",Construction,Level 3,Plasterer,16-18,c,c,c');
  lines.push('202122,10000001,"Provider 10000001",Construction,Level 2,Bricklayer,16-18,999,0,0');
  const rates = path.join(dir, 'rates.csv');
  fs.writeFileSync(rates, lines.join('\n') + '\n');

  const ofsted = path.join(dir, 'ofsted.csv');
  fs.writeFileSync(
    ofsted,
    [
      'Provider UKPRN,Provider name,Provider type,Provider region,Local authority',
      ...PROVIDERS.map(([u, t, r, la]) => `${u},"Provider ${u}",${t},${r},${la}`),
    ].join('\n') + '\n'
  );
  return { rates, ofsted };
}

describe('sw-apprenticeships pipeline', () => {
  it('scopes providers and computes quartiles from counts', async () => {
    const { rates, ofsted } = writeFixture();
    const { rows, hasAge } = await loadRates(rates);
    expect(hasAge).toBe(true);
    const out = compute(rows, hasAge, await loadOfsted(ofsted), { rates: 'r', ofsted: 'o' }, 'T');
    const y = out.years.find((x) => x.year === '2024/25')!;

    // All providers in the data, from detail rows only (subtotals skipped): 1,120 / 1,615.
    const leavers = PROVIDERS.reduce((a, p) => a + p[4], 0);
    const achievers = PROVIDERS.reduce((a, p) => a + p[5], 0);
    expect(y.allProviderRate).toBe(Math.round((1000 * achievers) / leavers) / 10);

    // In scope: providers 1–6 (rates 50, 55, 60, 65, 70, 75).
    expect(y.spread).toEqual({ providers: 6, p25: 56.3, median: 62.5, p75: 68.8 });
    expect(out.join).toEqual({ providersInRates: 11, matchedToOfsted: 11, inScopeAnyYear: 6 });

    // All-provider rate here is 69.3%, so 50, 55, 60, 65 are below: 4 (withheld).
    expect(y.allProviderRate).toBe(69.3);
    expect(y.below).toBeNull();

    expect(y.bySsa).toEqual([
      { label: 'Construction', providers: 6, p25: 56.3, median: 62.5, p75: 68.8 },
    ]);
    expect(y.byAge?.map((a) => a.label)).toEqual(['16-18', '19+']);

    // Other years have no rows: nothing in scope, everything withheld.
    expect(out.years[0].spread.providers).toBe(0);
    expect(out.years[0].retentionCorrelation).toBeNull();
  });

  it('suppresses the retention table and never outputs a UKPRN or name', async () => {
    const { rates, ofsted } = writeFixture();
    const { rows, hasAge } = await loadRates(rates);
    const out = compute(rows, hasAge, await loadOfsted(ofsted), { rates: 'r', ofsted: 'o' }, 'T');
    const y = out.years[2];
    // Retention: 60, 65, 70, 75, 85, 90 -> two providers per band; small cells withhold the whole table.
    for (const r of y.retention) {
      expect(r.below).toBeNull();
      expect(r.atOrAbove).toBeNull();
    }
    expect(y.retentionCorrelation).toBeGreaterThan(0.9);
    const json = JSON.stringify(out);
    for (const [ukprn] of PROVIDERS) {
      expect(json).not.toContain(ukprn);
      expect(json).not.toContain(`Provider ${ukprn}`);
    }
  });

  it('shows the retention table when every cell has 5 or more providers', () => {
    // 30 in-scope providers: retention 60/75/90 by thirds, achievement split around the all-provider rate.
    const rows = [];
    const ofsted = new Map();
    for (let i = 0; i < 30; i++) {
      const ukprn = String(20000000 + i);
      const retentionRate = [60, 75, 90][i % 3];
      const achievers = i % 2 === 0 ? 40 : 80;
      rows.push({
        year: '202425',
        ukprn,
        ssa: 'Health',
        age: null,
        leavers: 100,
        achievers,
        retentionRate,
      });
      ofsted.set(ukprn, {
        type: 'Independent learning provider',
        region: 'South West',
        localAuthority: 'Devon',
      });
    }
    const y = compute(rows, false, ofsted, { rates: 'r', ofsted: 'o' }, 'T').years[2];
    expect(y.allProviderRate).toBe(60);
    expect(y.below).toBe(15);
    expect(y.retention).toEqual([
      { band: 'Under 70%', below: 5, atOrAbove: 5 },
      { band: '70% to under 80%', below: 5, atOrAbove: 5 },
      { band: '80% and over', below: 5, atOrAbove: 5 },
    ]);
    expect(y.byAge).toBeNull();
  });

  it('includes Hampshire, Portsmouth and Southampton from the South East, and nowhere else there', () => {
    const ilp = (localAuthority: string) => ({
      type: 'Independent learning provider',
      region: 'South East',
      localAuthority,
    });
    expect(['Hampshire', 'Portsmouth', 'Southampton'].map((la) => inScope(ilp(la)))).toEqual([
      true,
      true,
      true,
    ]);
    expect(inScope(ilp('Kent'))).toBe(false);
  });

  it('NEGATIVE CONTROL: stops and prints the header when a rates column is missing', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-app-'));
    tmpRoots.push(dir);
    const p = path.join(dir, 'rates.csv');
    fs.writeFileSync(p, 'time_period,provider_ukprn,leavers\n202425,1,10\n');
    await expect(loadRates(p)).rejects.toThrow(
      /missing column\(s\)[\s\S]*achievers[\s\S]*Header found/
    );
  });
});
