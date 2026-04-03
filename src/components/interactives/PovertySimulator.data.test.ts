/**
 * PovertySimulator.data.test.ts — Task 3.3 — Agent_Interactive_Core
 *
 * Unit tests for all three poverty threshold calculation methods and the
 * population distribution model.
 *
 * Framework: Vitest (globals: true) with happy-dom environment.
 * No DOM access required — all functions are pure computations.
 *
 * Test structure:
 *   1. oecdEqualisationFactor — weight computation
 *   2. calculateThreshold (absolute) — MIS basket costs
 *   3. calculateThreshold (relative) — 60 % of ONS median
 *   4. calculateThreshold (dwp) — 60 % of DWP HBAI BHC median
 *   5. populationBelowThreshold — log-normal CDF behaviour
 *   6. populationDensity — PDF sanity checks
 *   7. generateDensityCurve — output shape
 */

import {
  oecdEqualisationFactor,
  calculateThreshold,
  populationBelowThreshold,
  populationDensity,
  generateDensityCurve,
  MIS_BASE_SINGLE_ADULT,
  MIS_PER_ADDITIONAL_ADULT,
  MIS_PER_CHILD,
  RELATIVE_MEDIAN,
  DWP_BHC_MEDIAN,
  REGION_COST_MULTIPLIER,
  POPULATION_MEAN,
} from './PovertySimulator.data';

// ─── 1. OECD Equivalisation Factor ────────────────────────────────────────────

describe('oecdEqualisationFactor', () => {
  it('single adult returns 1.0', () => {
    expect(oecdEqualisationFactor(1, 0)).toBe(1.0);
  });

  it('couple (2 adults, 0 children) returns 1.5', () => {
    expect(oecdEqualisationFactor(2, 0)).toBe(1.5);
  });

  it('couple + 2 children returns 2.1', () => {
    expect(oecdEqualisationFactor(2, 2)).toBeCloseTo(2.1, 10);
  });

  it('single adult + 1 child returns 1.3', () => {
    expect(oecdEqualisationFactor(1, 1)).toBeCloseTo(1.3, 10);
  });

  it('single adult + 3 children returns 1.9', () => {
    expect(oecdEqualisationFactor(1, 3)).toBeCloseTo(1.9, 10);
  });

  it('3 adults + 0 children returns 2.0', () => {
    expect(oecdEqualisationFactor(3, 0)).toBe(2.0);
  });

  it('5 adults + 0 children returns 3.0', () => {
    expect(oecdEqualisationFactor(5, 0)).toBe(3.0);
  });
});

// ─── 2. Absolute Threshold (MIS 2024) ─────────────────────────────────────────

describe('calculateThreshold — absolute method', () => {
  it('single adult, rest-of-england: base MIS figure', () => {
    const result = calculateThreshold('absolute', {
      adults: 1,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(MIS_BASE_SINGLE_ADULT); // £15,400
  });

  it('couple (2 adults, 0 children), rest-of-england', () => {
    const expected = MIS_BASE_SINGLE_ADULT + MIS_PER_ADDITIONAL_ADULT; // £24,600
    const result = calculateThreshold('absolute', {
      adults: 2,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('single parent + 2 children, london: applies 1.2 multiplier', () => {
    const base = MIS_BASE_SINGLE_ADULT + 2 * MIS_PER_CHILD; // 15400 + 11600 = 27000
    const expected = Math.round(base * REGION_COST_MULTIPLIER['london']); // 32400
    const result = calculateThreshold('absolute', {
      adults: 1,
      children: 2,
      region: 'london',
    });
    expect(result.threshold).toBe(expected);
  });

  it('couple + 2 children, rest-of-england', () => {
    const expected =
      MIS_BASE_SINGLE_ADULT + MIS_PER_ADDITIONAL_ADULT + 2 * MIS_PER_CHILD; // £36,200
    const result = calculateThreshold('absolute', {
      adults: 2,
      children: 2,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('single adult, wales: applies 0.95 multiplier', () => {
    const expected = Math.round(
      MIS_BASE_SINGLE_ADULT * REGION_COST_MULTIPLIER['wales'],
    ); // 14630
    const result = calculateThreshold('absolute', {
      adults: 1,
      children: 0,
      region: 'wales',
    });
    expect(result.threshold).toBe(expected);
  });

  it('3 adults + 1 child, scotland: applies 0.97 multiplier', () => {
    const base =
      MIS_BASE_SINGLE_ADULT +
      2 * MIS_PER_ADDITIONAL_ADULT +
      1 * MIS_PER_CHILD; // 15400 + 18400 + 5800 = 39600
    const expected = Math.round(base * REGION_COST_MULTIPLIER['scotland']); // 38412
    const result = calculateThreshold('absolute', {
      adults: 3,
      children: 1,
      region: 'scotland',
    });
    expect(result.threshold).toBe(expected);
  });

  it('rate is in [0, 1]', () => {
    const result = calculateThreshold('absolute', {
      adults: 2,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.rate).toBeGreaterThan(0);
    expect(result.rate).toBeLessThan(1);
  });

  it('description contains method label and threshold value', () => {
    const result = calculateThreshold('absolute', {
      adults: 1,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.description).toContain('Absolute');
    expect(result.description).toContain('15,400');
  });
});

// ─── 3. Relative Threshold (60 % of ONS Median) ───────────────────────────────

describe('calculateThreshold — relative method', () => {
  it('single adult: 60 % × £35,000 × 1.0 = £21,000', () => {
    const expected = Math.round(0.6 * RELATIVE_MEDIAN * 1.0); // 21000
    const result = calculateThreshold('relative', {
      adults: 1,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('couple (2 adults): 60 % × £35,000 × 1.5 = £31,500', () => {
    const expected = Math.round(0.6 * RELATIVE_MEDIAN * 1.5); // 31500
    const result = calculateThreshold('relative', {
      adults: 2,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('couple + 2 children: 60 % × £35,000 × 2.1 = £44,100', () => {
    const expected = Math.round(0.6 * RELATIVE_MEDIAN * 2.1); // 44100
    const result = calculateThreshold('relative', {
      adults: 2,
      children: 2,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('single adult + 1 child: 60 % × £35,000 × 1.3 = £27,300', () => {
    const expected = Math.round(0.6 * RELATIVE_MEDIAN * 1.3); // 27300
    const result = calculateThreshold('relative', {
      adults: 1,
      children: 1,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('region is ignored — same threshold for london and wales', () => {
    const london = calculateThreshold('relative', {
      adults: 2,
      children: 1,
      region: 'london',
    });
    const wales = calculateThreshold('relative', {
      adults: 2,
      children: 1,
      region: 'wales',
    });
    expect(london.threshold).toBe(wales.threshold);
  });

  it('description contains method label', () => {
    const result = calculateThreshold('relative', {
      adults: 1,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.description).toContain('Relative');
    expect(result.description).toContain('21,000');
  });
});

// ─── 4. DWP HBAI BHC Threshold ────────────────────────────────────────────────

describe('calculateThreshold — dwp method', () => {
  it('single adult: 60 % × £34,500 × 1.0 = £20,700', () => {
    const expected = Math.round(0.6 * DWP_BHC_MEDIAN * 1.0); // 20700
    const result = calculateThreshold('dwp', {
      adults: 1,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('couple (2 adults): 60 % × £34,500 × 1.5 = £31,050', () => {
    const expected = Math.round(0.6 * DWP_BHC_MEDIAN * 1.5); // 31050
    const result = calculateThreshold('dwp', {
      adults: 2,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('couple + 2 children: 60 % × £34,500 × 2.1 = £43,470', () => {
    const expected = Math.round(0.6 * DWP_BHC_MEDIAN * 2.1); // 43470
    const result = calculateThreshold('dwp', {
      adults: 2,
      children: 2,
      region: 'rest-of-england',
    });
    expect(result.threshold).toBe(expected);
  });

  it('DWP threshold is lower than relative threshold for all compositions', () => {
    const compositions = [
      { adults: 1, children: 0 },
      { adults: 2, children: 0 },
      { adults: 2, children: 2 },
      { adults: 1, children: 3 },
    ] as const;

    for (const comp of compositions) {
      const dwp = calculateThreshold('dwp', {
        ...comp,
        region: 'rest-of-england',
      });
      const rel = calculateThreshold('relative', {
        ...comp,
        region: 'rest-of-england',
      });
      expect(dwp.threshold).toBeLessThan(rel.threshold);
    }
  });

  it('description contains DWP label', () => {
    const result = calculateThreshold('dwp', {
      adults: 1,
      children: 0,
      region: 'rest-of-england',
    });
    expect(result.description).toContain('DWP');
    expect(result.description).toContain('20,700');
  });
});

// ─── 5. populationBelowThreshold ─────────────────────────────────────────────

describe('populationBelowThreshold', () => {
  it('returns 0 for income = 0', () => {
    expect(populationBelowThreshold(0)).toBe(0);
  });

  it('returns 0 for negative income', () => {
    expect(populationBelowThreshold(-1000)).toBe(0);
  });

  it('returns a value between 0 and 1 for typical incomes', () => {
    const rate = populationBelowThreshold(21_000);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(1);
  });

  it('returns approximately 0.5 near the population distribution median', () => {
    // Median of log-normal = exp(μ) = POPULATION_MEAN × exp(−σ²/2) ≈ £23,388
    const median = POPULATION_MEAN * Math.exp(-(0.6 * 0.6) / 2);
    const rate = populationBelowThreshold(median);
    expect(rate).toBeGreaterThan(0.48);
    expect(rate).toBeLessThan(0.52);
  });

  it('is monotonically increasing', () => {
    const incomes = [5_000, 10_000, 15_000, 20_000, 30_000, 50_000, 80_000];
    for (let i = 1; i < incomes.length; i++) {
      expect(populationBelowThreshold(incomes[i]!)).toBeGreaterThan(
        populationBelowThreshold(incomes[i - 1]!),
      );
    }
  });

  it('approaches 1 at very high incomes', () => {
    expect(populationBelowThreshold(1_000_000)).toBeGreaterThan(0.999);
  });
});

// ─── 6. populationDensity ────────────────────────────────────────────────────

describe('populationDensity', () => {
  it('returns 0 for income ≤ 0', () => {
    expect(populationDensity(0)).toBe(0);
    expect(populationDensity(-500)).toBe(0);
  });

  it('returns a positive value for typical incomes', () => {
    expect(populationDensity(20_000)).toBeGreaterThan(0);
    expect(populationDensity(28_000)).toBeGreaterThan(0);
  });

  it('density is higher near the mode than at extremes', () => {
    // Log-normal mode = exp(μ − σ²) = POPULATION_MEAN × exp(−3σ²/2)
    const mode =
      POPULATION_MEAN * Math.exp(-(3 * 0.6 * 0.6) / 2);
    const densityAtMode = populationDensity(mode);
    const densityAtExtreme = populationDensity(80_000);
    expect(densityAtMode).toBeGreaterThan(densityAtExtreme);
  });
});

// ─── 7. generateDensityCurve ─────────────────────────────────────────────────

describe('generateDensityCurve', () => {
  it('returns default 400 points', () => {
    const curve = generateDensityCurve();
    expect(curve).toHaveLength(400);
  });

  it('returns requested number of points', () => {
    const curve = generateDensityCurve(100);
    expect(curve).toHaveLength(100);
  });

  it('first point starts above 0', () => {
    const curve = generateDensityCurve();
    expect(curve[0]!.income).toBeGreaterThan(0);
  });

  it('last point is at £80,000', () => {
    const curve = generateDensityCurve();
    expect(curve[curve.length - 1]!.income).toBeCloseTo(80_000, 0);
  });

  it('all density values are non-negative', () => {
    const curve = generateDensityCurve(50);
    for (const point of curve) {
      expect(point.density).toBeGreaterThanOrEqual(0);
    }
  });

  it('incomes are strictly increasing', () => {
    const curve = generateDensityCurve(50);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]!.income).toBeGreaterThan(curve[i - 1]!.income);
    }
  });
});
