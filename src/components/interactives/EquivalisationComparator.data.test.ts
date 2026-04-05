/**
 * EquivalisationComparator.data.test.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Unit tests for the Equivalisation Comparator data module.
 * Pure calculation tests — no React rendering.
 *
 * All three scales are tested against hand-computed values from the
 * formulas in path2-module-4.mdx.
 */

import { describe, it, expect } from 'vitest';
import {
  oecdOriginalFactor,
  oecdModifiedFactor,
  mcclementsFactorSimplified,
  equivalisationFactor,
  median,
  applyScale,
  compareScales,
  householdTypeLabel,
  UK_HOUSEHOLDS,
  TOTAL_HOUSEHOLDS,
  THRESHOLD_DEFAULT,
  THRESHOLD_MIN,
  THRESHOLD_MAX,
} from './EquivalisationComparator.data';

// ─── oecdOriginalFactor ───────────────────────────────────────────────────────

describe('oecdOriginalFactor', () => {
  it('lone adult: S = 1.0', () => {
    expect(oecdOriginalFactor(1, 0)).toBeCloseTo(1.0, 5);
  });

  it('couple, no children: S = 1.7', () => {
    // 1.0 + 0.7×1 + 0.5×0 = 1.7
    expect(oecdOriginalFactor(2, 0)).toBeCloseTo(1.7, 5);
  });

  it('couple, 2 children: S = 2.7', () => {
    // 1.0 + 0.7×1 + 0.5×2 = 2.7
    expect(oecdOriginalFactor(2, 2)).toBeCloseTo(2.7, 5);
  });

  it('lone parent, 1 child: S = 1.5', () => {
    // 1.0 + 0 + 0.5×1 = 1.5
    expect(oecdOriginalFactor(1, 1)).toBeCloseTo(1.5, 5);
  });

  it('returns at least 1.0 for any valid input', () => {
    expect(oecdOriginalFactor(1, 0)).toBeGreaterThanOrEqual(1.0);
    expect(oecdOriginalFactor(3, 3)).toBeGreaterThanOrEqual(1.0);
  });
});

// ─── oecdModifiedFactor ───────────────────────────────────────────────────────

describe('oecdModifiedFactor', () => {
  it('lone adult: S = 1.0', () => {
    expect(oecdModifiedFactor(1, 0)).toBeCloseTo(1.0, 5);
  });

  it('couple, no children: S = 1.5', () => {
    // 1.0 + 0.5×1 + 0.3×0 = 1.5
    expect(oecdModifiedFactor(2, 0)).toBeCloseTo(1.5, 5);
  });

  it('couple, 2 children: S = 2.1', () => {
    // 1.0 + 0.5×1 + 0.3×2 = 2.1 (quote from module text)
    expect(oecdModifiedFactor(2, 2)).toBeCloseTo(2.1, 5);
  });

  it('lone parent, 1 child: S = 1.3', () => {
    // 1.0 + 0 + 0.3×1 = 1.3
    expect(oecdModifiedFactor(1, 1)).toBeCloseTo(1.3, 5);
  });

  it('Modified OECD factor is always ≤ Original OECD factor for same composition', () => {
    const compositions = [
      [1, 0], [2, 0], [2, 2], [1, 2], [3, 3],
    ] as const;
    for (const [a, c] of compositions) {
      expect(oecdModifiedFactor(a, c)).toBeLessThanOrEqual(oecdOriginalFactor(a, c));
    }
  });
});

// ─── mcclementsFactorSimplified ───────────────────────────────────────────────

describe('mcclementsFactorSimplified', () => {
  it('lone adult: S = 1.0', () => {
    expect(mcclementsFactorSimplified(1, 0)).toBeCloseTo(1.0, 5);
  });

  it('couple, no children: S = 1.0 + 0.57 = 1.57', () => {
    expect(mcclementsFactorSimplified(2, 0)).toBeCloseTo(1.57, 5);
  });

  it('couple, 2 children: S = 1.57 + 0.29×2 = 2.15', () => {
    expect(mcclementsFactorSimplified(2, 2)).toBeCloseTo(2.15, 5);
  });

  it('lone parent, 1 child: S = 1.0 + 0.29 = 1.29', () => {
    expect(mcclementsFactorSimplified(1, 1)).toBeCloseTo(1.29, 5);
  });

  it('three-adult household: includes additional adult weight (0.42)', () => {
    // 1.0 + 0.57 + 0.42 = 1.99
    expect(mcclementsFactorSimplified(3, 0)).toBeCloseTo(1.99, 5);
  });
});

// ─── equivalisationFactor dispatch ───────────────────────────────────────────

describe('equivalisationFactor', () => {
  it('dispatches correctly to Original OECD', () => {
    expect(equivalisationFactor('oecd-original', 2, 2)).toBeCloseTo(oecdOriginalFactor(2, 2), 10);
  });

  it('dispatches correctly to Modified OECD', () => {
    expect(equivalisationFactor('oecd-modified', 2, 2)).toBeCloseTo(oecdModifiedFactor(2, 2), 10);
  });

  it('dispatches correctly to McClements', () => {
    expect(equivalisationFactor('mcclements', 2, 2)).toBeCloseTo(mcclementsFactorSimplified(2, 2), 10);
  });
});

// ─── median ──────────────────────────────────────────────────────────────────

describe('median', () => {
  it('returns 0 for empty array', () => {
    expect(median([])).toBe(0);
  });

  it('returns the single value for length-1 array', () => {
    expect(median([5])).toBe(5);
  });

  it('returns middle value for odd-length array', () => {
    expect(median([3, 1, 4, 1, 5])).toBe(3);
  });

  it('returns average of two middles for even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('does not mutate the input array', () => {
    const arr = [3, 1, 4, 1, 5];
    median(arr);
    expect(arr).toEqual([3, 1, 4, 1, 5]);
  });
});

// ─── applyScale ───────────────────────────────────────────────────────────────

describe('applyScale', () => {
  // Minimal 2-household dataset: one lean, one rich
  const households = [
    { income: 1000, adults: 1, children: 0 }, // equiv income = 1000
    { income: 3000, adults: 1, children: 0 }, // equiv income = 3000
  ];
  // Median equiv income = 2000; threshold at 60% = 1200
  // Only the £1000 household is below 1200 → poverty rate = 50%

  it('poverty rate is 50% for 1-below, 1-above household pair', () => {
    const result = applyScale(households, 'oecd-original', 0.6);
    expect(result.povertyRate).toBeCloseTo(50, 1);
  });

  it('medianEquivIncome is 2000', () => {
    const result = applyScale(households, 'oecd-original', 0.6);
    expect(result.medianEquivIncome).toBeCloseTo(2000, 1);
  });

  it('povertyThreshold is 1200', () => {
    const result = applyScale(households, 'oecd-original', 0.6);
    expect(result.povertyThreshold).toBeCloseTo(1200, 1);
  });

  it('rowResults length matches input households length', () => {
    const result = applyScale(households, 'oecd-modified', 0.6);
    expect(result.rowResults).toHaveLength(households.length);
  });

  it('rowResults.equivalisedIncome equals income / S for lone adult', () => {
    const result = applyScale(households, 'oecd-modified', 0.6);
    // For 1 adult, 0 children: S = 1.0 → equiv = gross
    expect(result.rowResults[0].equivalisedIncome).toBeCloseTo(households[0].income, 2);
  });
});

// ─── Scale comparison: higher factor = lower equiv income = more poverty ──────

describe('applyScale — scale sensitivity', () => {
  // A couple with 2 children earning £2000/month.
  // Original OECD: S=2.7 → equiv=£741 → likely poor at ~60% median
  // Modified OECD: S=2.1 → equiv=£952 → less poor
  // Higher S → lower equiv income → more likely to be classified poor
  const household = [{ income: 2000, adults: 2, children: 2 }];

  it('Original OECD factor (S=2.7) gives lower equiv income than Modified (S=2.1)', () => {
    const orig = applyScale(household, 'oecd-original', 0.6);
    const mod = applyScale(household, 'oecd-modified', 0.6);
    expect(orig.rowResults[0].equivalisedIncome).toBeLessThan(mod.rowResults[0].equivalisedIncome);
  });
});

// ─── compareScales ────────────────────────────────────────────────────────────

describe('compareScales', () => {
  it('returns exactly 3 results', () => {
    const [a, b, c] = compareScales(UK_HOUSEHOLDS, THRESHOLD_DEFAULT);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(c).toBeDefined();
  });

  it('results are in order: Original, Modified, McClements', () => {
    const [a, b, c] = compareScales(UK_HOUSEHOLDS, THRESHOLD_DEFAULT);
    expect(a.scale).toBe('oecd-original');
    expect(b.scale).toBe('oecd-modified');
    expect(c.scale).toBe('mcclements');
  });

  it('all three poverty rates are in a realistic range (5%–50%)', () => {
    const [orig, mod, mcC] = compareScales(UK_HOUSEHOLDS, THRESHOLD_DEFAULT);
    for (const r of [orig, mod, mcC]) {
      expect(r.povertyRate).toBeGreaterThan(5);
      expect(r.povertyRate).toBeLessThan(50);
    }
  });

  it('poverty rates diverge across scales (not all identical)', () => {
    const [orig, mod, mcC] = compareScales(UK_HOUSEHOLDS, THRESHOLD_DEFAULT);
    // At least two of the three rates must differ — the point of the comparator
    const allSame =
      Math.abs(orig.povertyRate - mod.povertyRate) < 0.5 &&
      Math.abs(orig.povertyRate - mcC.povertyRate) < 0.5;
    expect(allSame).toBe(false);
  });
});

// ─── UK_HOUSEHOLDS integrity ──────────────────────────────────────────────────

describe('UK_HOUSEHOLDS', () => {
  it('has exactly 200 households', () => {
    expect(UK_HOUSEHOLDS).toHaveLength(200);
    expect(TOTAL_HOUSEHOLDS).toBe(200);
  });

  it('all households have income > 0', () => {
    expect(UK_HOUSEHOLDS.every((h) => h.income > 0)).toBe(true);
  });

  it('all households have adults ≥ 1', () => {
    expect(UK_HOUSEHOLDS.every((h) => h.adults >= 1)).toBe(true);
  });

  it('all households have children ≥ 0', () => {
    expect(UK_HOUSEHOLDS.every((h) => h.children >= 0)).toBe(true);
  });

  it('THRESHOLD_DEFAULT is within [THRESHOLD_MIN, THRESHOLD_MAX]', () => {
    expect(THRESHOLD_DEFAULT).toBeGreaterThanOrEqual(THRESHOLD_MIN);
    expect(THRESHOLD_DEFAULT).toBeLessThanOrEqual(THRESHOLD_MAX);
  });
});

// ─── householdTypeLabel ───────────────────────────────────────────────────────

describe('householdTypeLabel', () => {
  it('lone adult', () => {
    expect(householdTypeLabel(1, 0)).toBe('Single adult');
  });

  it('couple', () => {
    expect(householdTypeLabel(2, 0)).toBe('2 adults');
  });

  it('lone parent, 1 child', () => {
    expect(householdTypeLabel(1, 1)).toBe('Single adult, 1 child');
  });

  it('couple, 2 children', () => {
    expect(householdTypeLabel(2, 2)).toBe('2 adults, 2 children');
  });
});
