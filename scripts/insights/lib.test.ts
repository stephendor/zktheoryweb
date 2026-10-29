/**
 * Disclosure helpers shared by the insight pipelines.
 */
import { quantileSorted, suppressCount, suppressPartition, suppressStat } from './lib';

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
