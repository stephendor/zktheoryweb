/**
 * Disclosure helpers shared by the insight pipelines.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  quantileSorted,
  readJsonArray,
  suppressCount,
  suppressPartition,
  suppressStat,
} from './lib';

describe('insight suppression', () => {
  it('withholds counts below 5 but shows zero', () => {
    expect([0, 1, 4, 5, 12].map(suppressCount)).toEqual([0, null, null, 5, 12]);
    expect(suppressStat(4, 99)).toBeNull();
    expect(suppressStat(5, 99)).toBe(99);
  });

  it('NEGATIVE CONTROL: one withheld cell in a partition would be recoverable from the total, so a second is withheld', () => {
    // 3 is withheld; 3 = total - (40 + 12 + 9), so 9 (the next smallest) goes too.
    expect(suppressPartition([40, 3, 12, 9])).toEqual([40, null, 12, null]);
  });

  it('leaves a partition alone when two or more cells are already withheld, or none', () => {
    expect(suppressPartition([40, 3, 2, 9])).toEqual([40, null, null, 9]);
    expect(suppressPartition([40, 0, 12, 9])).toEqual([40, 0, 12, 9]);
  });

  it('interpolates quantiles (type 7)', () => {
    expect(quantileSorted([10, 20, 30, 40, 50], 0.25)).toBe(20);
    expect(quantileSorted([10, 20, 30, 40], 0.5)).toBe(25);
  });
});

describe('readJsonArray', () => {
  it('streams flat objects across chunk boundaries, with strings containing braces and quotes', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-'));
    const file = path.join(dir, 'x.json');
    const objects = [
      { a: 1, b: 'plain', c: null },
      { a: 2, b: 'has } and { and "quotes" and \\ backslash', c: '2024-03-31T00:00:00' },
      { a: 3, b: '', c: true },
    ];
    fs.writeFileSync(file, '\uFEFF' + JSON.stringify(objects, null, 2));
    for (const chunk of [7, 64, 1 << 20]) {
      const rows = [];
      for await (const r of readJsonArray(file, chunk)) rows.push(r);
      expect(rows).toEqual([
        { a: '1', b: 'plain', c: '' },
        { a: '2', b: 'has } and { and "quotes" and \\ backslash', c: '2024-03-31T00:00:00' },
        { a: '3', b: '', c: 'true' },
      ]);
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
