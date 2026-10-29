/**
 * Fixture test for the Dorset voluntary sector pipeline: a tiny register
 * extract and postcode lookup, written to a temp folder, run end to end.
 * Covers area matching by LAD (not postcode prefix), exclusions, suppression,
 * the trend window, and that no charity name reaches the output.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { CC_FILES } from './config';
import { compute, load, loadGrants, type LoadedData } from './pipeline';

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) fs.rmSync(d, { recursive: true, force: true });
});

const CHARITY_HEADER = [
  'date_of_extract',
  'organisation_number',
  'registered_charity_number',
  'linked_charity_number',
  'charity_name',
  'charity_type',
  'charity_registration_status',
  'latest_income',
  'charity_contact_postcode',
  'charity_activities',
];

// org, linked, name, type, status, income, postcode
const CHARITIES: [string, string, string, string, string, string, string][] = [
  ['1', '0', 'Secret Name Trust', 'Trust', 'Registered', '5000', 'DT1 1AA'],
  ['2', '0', 'Dorset Two', 'CIO', 'Registered', '50000', 'DT1 1AB'],
  ['3', '0', 'Dorset Three', 'CIO', 'Registered', '60000', 'DT2 2AA'],
  ['4', '0', 'Dorset Four', 'Charitable company', 'Registered', '250000', 'DT2 2AB'],
  ['5', '0', 'Dorset Five', 'CIO', 'Registered', '90000', 'SP7 8AA'],
  ['6', '0', 'Dorset Six', 'Trust', 'Registered', '', 'DT3 3AA'],
  ['7', '0', 'BCP Seven', 'CIO', 'Registered', '20000', 'BH1 1AA'],
  ['8', '0', 'BCP Eight', 'CIO', 'Registered', '30000', 'BH1 1AB'],
  ['9', '0', 'BCP Nine', 'Trust', 'Registered', '40000', 'BH2 2AA'],
  ['10', '0', 'BCP Ten', 'Charitable company', 'Registered', '700000', 'BH2 2AB'],
  ['11', '0', 'BCP Eleven', 'CIO', 'Registered', '2000000', 'BH3 3AA'],
  ['12', '0', 'Hampshire Ringwood', 'CIO', 'Registered', '80000', 'BH24 1AA'], // BH but not Dorset/BCP
  ['13', '5', 'Linked Subsidiary', 'Trust', 'Registered', '10000', 'DT1 1AA'], // linked: excluded
  ['14', '0', 'Removed Charity', 'Trust', 'Removed', '10000', 'DT1 1AA'], // removed: excluded
];

const LOOKUP = [
  ['pcds', 'oa21cd', 'lsoa21cd', 'lad25cd'],
  ['DT1 1AA', 'x', 'x', 'E06000059'],
  ['DT1 1AB', 'x', 'x', 'E06000059'],
  ['DT2 2AA', 'x', 'x', 'E06000059'],
  ['DT2 2AB', 'x', 'x', 'E06000059'],
  ['SP7 8AA', 'x', 'x', 'E06000059'],
  ['DT3 3AA', 'x', 'x', 'E06000059'],
  ['BH1 1AA', 'x', 'x', 'E06000058'],
  ['BH1 1AB', 'x', 'x', 'E06000058'],
  ['BH2 2AA', 'x', 'x', 'E06000058'],
  ['BH2 2AB', 'x', 'x', 'E06000058'],
  ['BH3 3AA', 'x', 'x', 'E06000058'],
  ['BH24 1AA', 'x', 'x', 'E07000091'],
];

function writeFixture(opts: { dropColumn?: string } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dorset-vcs-'));
  tmpRoots.push(dir);
  const header = CHARITY_HEADER.filter((h) => h !== opts.dropColumn);
  const charityRows = CHARITIES.map(([org, linked, name, type, status, income, pc]) => {
    const row: Record<string, string> = {
      date_of_extract: '2026-10-28 00:00:00',
      organisation_number: org,
      registered_charity_number: `10${org}`,
      linked_charity_number: linked,
      charity_name: name,
      charity_type: type,
      charity_registration_status: status,
      latest_income: income,
      charity_contact_postcode: pc,
      // A line break inside a free-text field must not split the record.
      charity_activities: org === '2' ? 'Lunch club\nand advice' : 'Activities',
    };
    return header.map((h) => row[h]).join('\t');
  });
  const tsv = (rows: string[][]) => rows.map((r) => r.join('\t')).join('\n') + '\n';
  fs.writeFileSync(
    path.join(dir, `${CC_FILES.charity}.txt`),
    '﻿' + [header.join('\t'), ...charityRows].join('\n') + '\n'
  );

  const partA = [
    [
      'organisation_number',
      'fin_period_end_date',
      'total_gross_income',
      'count_volunteers',
      'income_from_government_contracts',
      'income_from_government_grants',
      'charity_receives_govt_funding_contracts',
      'charity_receives_govt_funding_grants',
      'latest_fin_period_submitted_ind',
    ],
  ];
  for (const org of ['2', '3', '4', '5', '7', '8', '9', '10', '11', '12']) {
    const gov = ['4', '10', '11'].includes(org) ? '50000' : '0';
    // Income fields are blank for charities without government funding, as in the register.
    const receives = gov === '0' ? 'false' : 'true';
    partA.push([
      org,
      '2025-03-31',
      '100000',
      '10',
      gov === '0' ? '' : gov,
      '',
      receives,
      'false',
      'true',
    ]);
    partA.push([org, '2024-03-31', '1', '999', '', '', 'false', 'false', 'false']); // not latest: ignored
  }
  fs.writeFileSync(path.join(dir, `${CC_FILES.partA}.txt`), tsv(partA));

  const history = [['organisation_number', 'fin_period_end_date', 'total_gross_income']];
  for (const [org, , , , , income] of CHARITIES) {
    if (!income) continue;
    // Org 11 has already filed for 2026, so (five returns kept) has lost 2021.
    for (let y = org === '11' ? 2022 : 2021; y <= 2026; y++)
      history.push([org, `${y}-03-31`, String(Number(income) + (y - 2021) * 1000)]);
  }
  fs.writeFileSync(path.join(dir, `${CC_FILES.history}.txt`), tsv(history));

  const classification = [
    ['organisation_number', 'classification_type', 'classification_description'],
  ];
  for (const org of ['1', '2', '3', '4', '5', '6', '7'])
    classification.push([org, 'What', 'Education/training']);
  classification.push(['8', 'What', 'Arts/culture']);
  for (const org of ['1', '2', '3', '4', '5', '6'])
    classification.push([org, 'Who', 'Children/young people']);
  fs.writeFileSync(path.join(dir, `${CC_FILES.classification}.txt`), tsv(classification));

  const lookup = path.join(dir, 'ons.csv');
  fs.writeFileSync(lookup, LOOKUP.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n') + '\n');
  return { dir, lookup };
}

describe('dorset-vcs pipeline', () => {
  it('selects main registered charities by LAD, not by BH/DT prefix', async () => {
    const { dir, lookup } = writeFixture();
    const data = await load(dir, lookup);
    expect(data.extractDate).toBe('2026-10-28');
    expect(data.charities.map((c) => c.org).sort((a, b) => Number(a) - Number(b))).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
    ]);
  });

  it('computes suppressed aggregates and never outputs a name', async () => {
    const { dir, lookup } = writeFixture();
    const out = compute(await load(dir, lookup), '2026-10-29T00:00:00Z');

    expect(out.totals.charities).toBe(11);
    expect(out.totals.withIncome).toBeNull(); // withheld with noIncomeReported (1)
    expect(out.totals.noIncomeReported).toBeNull(); // 1 charity: withheld
    expect(out.totals.totalIncome).toBe(3_200_000); // 3,245,000 rounded to £100k
    expect(out.totals.medianIncome).toBe(55_000);

    // Bands: under £10k 1, £10k–£100k 6, £100k–£500k 1, £500k–£1.5m 1, over £1.5m 1.
    expect(out.incomeBands.map((b) => b.count)).toEqual([null, 6, null, null, null]);
    expect(out.incomeBands[1].share).toBe(60);

    // Trend: five complete years ending before the extract year.
    expect(out.trend.map((t) => t.yearEnding)).toEqual([2021, 2022, 2023, 2024, 2025]);
    // Same charities every year: org 11 (no 2021 return) is left out of all five.
    expect(out.trend.map((t) => t.filers)).toEqual([9, 9, 9, 9, 9]);

    // Government: 3 of 9 in-area Part A filers (org 12 is out of area).
    expect(out.government.charitiesWithPartA).toBe(9);
    expect(out.government.shareReceiving).toBe(33.3);
    expect(out.government.shareOfIncome).toBe(16.7);
    expect(out.volunteers).toEqual({ charitiesReporting: 9, total: 90, median: 10 });

    expect(out.legalForm.find((f) => f.label === 'CIO')).toEqual({
      label: 'CIO',
      count: 6,
      share: 54.5,
    });
    expect(out.legalForm.find((f) => f.label === 'Trust')?.count).toBeNull(); // 3: withheld
    expect(out.classification.what.find((c) => c.label === 'Education/training')?.count).toBe(7);
    expect(out.classification.what.find((c) => c.label === 'Arts/culture')?.count).toBeNull();

    const [dorset, bcp] = out.areas;
    expect([dorset.charities, bcp.charities]).toEqual([6, 5]);
    expect(bcp.medianIncome).toBe(40_000);

    const json = JSON.stringify(out);
    for (const [, , name] of CHARITIES) expect(json).not.toContain(name);
    expect(json).not.toMatch(/"(DT|BH|SP)\d/); // no postcodes either
  });

  it('gives the same result from the JSON extract as from the text extract', async () => {
    const { dir, lookup } = writeFixture();
    const fromText = compute(await load(dir, lookup), 'T');
    // Rewrite each .txt as the JSON download would have it, then remove the .txt.
    for (const name of Object.values(CC_FILES)) {
      const txt = path.join(dir, `${name}.txt`);
      const [header, ...lines] = fs
        .readFileSync(txt, 'utf8')
        .replace(/^\uFEFF/, '')
        .trimEnd()
        .split('\n');
      const keys = header.split('\t');
      const records: Record<string, unknown>[] = [];
      let pending = '';
      for (const line of lines) {
        pending = pending ? `${pending}\n${line}` : line;
        const f = pending.split('\t');
        if (f.length < keys.length) continue;
        pending = '';
        records.push(
          Object.fromEntries(
            keys.map((k, i) => [
              k,
              f[i] === '' ? null : /^-?\d+(\.\d+)?$/.test(f[i]) ? Number(f[i]) : f[i],
            ])
          )
        );
      }
      fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(records));
      fs.rmSync(txt);
    }
    expect(compute(await load(dir, lookup), 'T')).toEqual(fromText);
  });

  it('NEGATIVE CONTROL: stops and prints the header when a column is missing', async () => {
    const { dir, lookup } = writeFixture({ dropColumn: 'latest_income' });
    await expect(load(dir, lookup)).rejects.toThrow(
      /missing column\(s\) latest_income[\s\S]*Header found/
    );
  });
});

describe('dorset-vcs funder concentration', () => {
  const GRANT_HEADER =
    'Identifier,Title,Currency,Amount Awarded,Award Date,Recipient Org:Charity Number,Funding Org:Identifier,Funding Org:Name';

  it('loads GBP grants in the window for known charities, once per Identifier', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grants-'));
    tmpRoots.push(dir);
    const a = path.join(dir, 'a.csv');
    const b = path.join(dir, 'b.csv');
    fs.writeFileSync(
      a,
      [
        GRANT_HEADER,
        'g1,"A grant, with a comma",GBP,1000,2022-05-01,1000001,F1,Funder one',
        'g2,x,GBP,3000,2023-05-01,1000001,F2,Funder two',
        'g3,x,EUR,9999,2023-05-01,1000001,F3,Euro funder', // not GBP
        'g4,x,GBP,9999,2019-05-01,1000001,F3,Too early',
        'g5,x,GBP,9999,2025-05-01,1000001,F3,Too late',
        'g6,x,GBP,9999,2022-05-01,9999999,F3,Not in area',
      ].join('\n') + '\n'
    );
    fs.writeFileSync(
      b,
      [GRANT_HEADER, 'g2,x,GBP,3000,2023-05-01,1000001,F2,Funder two'].join('\n') + '\n'
    );
    const grants = await loadGrants([a, b], new Set(['1000001']));
    expect(Object.fromEntries(grants.get('1000001')!)).toEqual({ F1: 1000, F2: 3000 });
    expect(grants.size).toBe(1);
  });

  it('reports quartiles of the top funder share, withheld below 5 charities', () => {
    const charities = Array.from({ length: 7 }, (_, i) => ({
      org: String(i),
      regNo: String(2000000 + i),
      lad: 'E06000059',
      type: 'CIO',
      // Six in the £100k–£1.5m band, one above it.
      latestIncome: i === 6 ? 2_000_000 : 200_000,
    }));
    const data: LoadedData = {
      extractDate: '2026-10-29',
      postcodeLookup: 'x',
      charities,
      partA: new Map(),
      history: new Map(),
      classification: [],
    };
    // Top funder shares: 100, 90, 75, 60, 50, 40 (%); the out-of-band charity is ignored.
    const splits = [[100], [90, 10], [75, 25], [60, 40], [50, 50], [40, 30, 30], [100]];
    const grants = new Map(
      splits.map((amounts, i) => [
        String(2000000 + i),
        new Map(amounts.map((v, j) => [`F${j}`, v * 1000])),
      ])
    );
    const f = compute(data, 'T', grants).funders!;
    expect(f.charitiesInBand).toBe(6);
    expect(f.withGrants).toBe(6);
    expect(f.topFunderShare).toEqual({ p25: 53, median: 68, p75: 86 }); // whole percentages
    expect(f.mostlyOneFunder).toBe(null); // 4 charities over 50%: withheld
    expect(f.medianFunders).toBe(2);

    const few = compute(data, 'T', new Map([...grants].slice(0, 4))).funders!;
    expect(few.withGrants).toBeNull();
    expect(few.topFunderShare).toEqual({ p25: null, median: null, p75: null });
    expect(compute(data, 'T').funders).toBeNull();
  });
});
