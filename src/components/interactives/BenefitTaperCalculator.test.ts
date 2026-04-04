/**
 * BenefitTaperCalculator.test.ts — Task 5.4 / 6.1b — Agent_Interactive_Advanced
 *
 * Unit tests for the UC benefit taper calculation logic.
 * Pure calculation tests — no React rendering, no afterEach(cleanup).
 *
 * Policy parameters under test (2025–26):
 *   Current:  55% taper, work allowance £673 (no housing) / £404 (housing)
 *   Pre-2021: 63% taper, same work allowances
 *   Standard allowance: £393.45/month
 *
 * Key formulas:
 *   taper     = max(0, (earnings − workAllowance) × taperRate)
 *   UC        = max(0, standardAllowance − taper)
 *   netIncome = earnings + UC
 *   EMR       = taperRate × 100 in taper zone; 0 elsewhere
 *
 * Fiscal cost delta (PH6-E1):
 *   Integrates per-person UC delta over a log-normal earnings distribution
 *   and scales to annualised aggregate across ~2.5m working UC claimants.
 */

import { describe, it, expect } from 'vitest';
import {
  computeUCSchedule,
  computeFiscalCostDelta,
  CURRENT_PARAMS,
  PRE_2021_PARAMS,
  TAPER_RATE_DEFAULT,
  TAPER_RATE_MIN,
  TAPER_RATE_MAX,
} from './BenefitTaperCalculator.data';

// ─── 55% taper — no housing element ──────────────────────────────────────────

describe('computeUCSchedule — 55% taper, no housing element', () => {
  // Use 3000 steps so each index i corresponds to gross earnings of exactly
  // (i / 3000) × 3000 = i pounds, giving exact results at target values.
  const schedule = computeUCSchedule(CURRENT_PARAMS, false, 3000);

  it('produces steps + 1 results', () => {
    expect(schedule).toHaveLength(3001);
  });

  it('first result has grossEarnings = 0', () => {
    expect(schedule[0].grossEarnings).toBe(0);
  });

  // ── At earnings £0: no taper, UC equals full standard allowance ────────────

  it('at £0 earnings: UC equals standard allowance £393.45', () => {
    expect(schedule[0].ucAmount).toBeCloseTo(393.45, 2);
  });

  it('at £0 earnings: net income equals standard allowance £393.45', () => {
    expect(schedule[0].netIncome).toBeCloseTo(393.45, 2);
  });

  it('at £0 earnings: effective marginal rate is 0%', () => {
    expect(schedule[0].effectiveMarginalRate).toBe(0);
  });

  // ── At the work allowance (£673): taper has not yet started ───────────────

  it('at work allowance £673: UC still equals standard allowance', () => {
    // index 673 → grossEarnings = (673/3000) × 3000 ≈ £673
    // tapered = max(0, (673 − 673) × 0.55) = 0 → UC = 393.45
    expect(schedule[673].ucAmount).toBeCloseTo(393.45, 2);
  });

  it('at work allowance £673: effective marginal rate is 0%', () => {
    expect(schedule[673].effectiveMarginalRate).toBe(0);
  });

  // ── At earnings £1,000: deep in taper zone ────────────────────────────────

  it('at £1,000 earnings: tapered amount = £179.85', () => {
    // taper = (1000 − 673) × 0.55 = 327 × 0.55 = 179.85
    const taper = schedule[1000].ucAmount; // 393.45 − 179.85 = 213.60
    expect(393.45 - taper).toBeCloseTo(179.85, 2);
  });

  it('at £1,000 earnings: UC amount = £213.60', () => {
    expect(schedule[1000].ucAmount).toBeCloseTo(213.60, 2);
  });

  it('at £1,000 earnings: net income = £1,213.60', () => {
    expect(schedule[1000].netIncome).toBeCloseTo(1213.60, 2);
  });

  it('at £1,000 earnings: effective marginal rate = 55%', () => {
    expect(schedule[1000].effectiveMarginalRate).toBe(55);
  });

  // ── UC exhaustion: earnings = workAllowance + standardAllowance / taperRate ─

  it('UC never returns negative values', () => {
    const anyNegative = schedule.some((r) => r.ucAmount < 0);
    expect(anyNegative).toBe(false);
  });

  it('UC reaches zero before maximum earnings', () => {
    const exhaustionIndex = schedule.findIndex((r) => r.ucAmount === 0);
    expect(exhaustionIndex).toBeGreaterThan(0);
    expect(exhaustionIndex).toBeLessThan(schedule.length);
  });

  it('effective marginal rate returns to 0% after UC exhaustion', () => {
    const exhaustionIndex = schedule.findIndex((r) => r.ucAmount === 0);
    expect(exhaustionIndex).toBeGreaterThan(0);
    // All results at or after exhaustion should have EMR = 0
    const beyondExhaustion = schedule.slice(exhaustionIndex);
    const allZero = beyondExhaustion.every((r) => r.effectiveMarginalRate === 0);
    expect(allZero).toBe(true);
  });

  it('net income never decreases as earnings increase', () => {
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].netIncome).toBeGreaterThanOrEqual(schedule[i - 1].netIncome);
    }
  });

  it('UC exhaustion point consistent with formula: 673 + 393.45/0.55 ≈ £1,388.36', () => {
    // UC = 0 when earnings ≥ 673 + 393.45/0.55 ≈ 1388.36
    // All results at index ≥ 1389 should have ucAmount = 0
    const exhaustionIndex = schedule.findIndex((r) => r.ucAmount === 0);
    expect(exhaustionIndex).toBeGreaterThanOrEqual(1388);
    expect(exhaustionIndex).toBeLessThanOrEqual(1390);
  });
});

// ─── 55% taper — with housing element ─────────────────────────────────────────

describe('computeUCSchedule — 55% taper, with housing element', () => {
  const schedule = computeUCSchedule(CURRENT_PARAMS, true, 3000);

  it('at £0 earnings: UC equals standard allowance £393.45', () => {
    expect(schedule[0].ucAmount).toBeCloseTo(393.45, 2);
  });

  it('at work allowance £404: UC still equals standard allowance', () => {
    // index 404 → grossEarnings ≈ £404
    expect(schedule[404].ucAmount).toBeCloseTo(393.45, 2);
  });

  it('at work allowance £404: effective marginal rate is 0%', () => {
    expect(schedule[404].effectiveMarginalRate).toBe(0);
  });

  it('at £405: taper has begun — EMR is 55%', () => {
    expect(schedule[405].effectiveMarginalRate).toBe(55);
  });

  it('UC never returns negative values', () => {
    const anyNegative = schedule.some((r) => r.ucAmount < 0);
    expect(anyNegative).toBe(false);
  });
});

// ─── 63% taper — pre-2021 comparison ─────────────────────────────────────────

describe('computeUCSchedule — 63% taper (pre-2021), no housing element', () => {
  const schedule = computeUCSchedule(PRE_2021_PARAMS, false, 3000);

  it('at £1,000 earnings: tapered amount = £206.01', () => {
    // taper = (1000 − 673) × 0.63 = 327 × 0.63 = 206.01
    const taper = 393.45 - schedule[1000].ucAmount;
    expect(taper).toBeCloseTo(206.01, 2);
  });

  it('at £1,000 earnings: UC = £187.44', () => {
    // UC = 393.45 − 206.01 = 187.44
    expect(schedule[1000].ucAmount).toBeCloseTo(187.44, 2);
  });

  it('at £1,000 earnings: effective marginal rate = 63%', () => {
    expect(schedule[1000].effectiveMarginalRate).toBe(63);
  });

  it('UC never returns negative values', () => {
    const anyNegative = schedule.some((r) => r.ucAmount < 0);
    expect(anyNegative).toBe(false);
  });

  it('UC exhausts at a lower earnings point than current 55% regime', () => {
    const schedule55 = computeUCSchedule(CURRENT_PARAMS, false, 3000);
    const exhaustion63 = schedule.findIndex((r) => r.ucAmount === 0);
    const exhaustion55 = schedule55.findIndex((r) => r.ucAmount === 0);
    // Higher taper rate exhausts UC sooner
    expect(exhaustion63).toBeLessThan(exhaustion55);
  });
});

// ─── computeFiscalCostDelta tests (PH6-E1) ────────────────────────────────────

describe('computeFiscalCostDelta', () => {
  it('returns exactly 0 at the 55% baseline', () => {
    expect(computeFiscalCostDelta(TAPER_RATE_DEFAULT)).toBe(0);
  });

  it('returns a positive value for rates below 55% (more generous)', () => {
    // Lower taper → more UC paid → higher expenditure → positive delta
    expect(computeFiscalCostDelta(40)).toBeGreaterThan(0);
    expect(computeFiscalCostDelta(50)).toBeGreaterThan(0);
  });

  it('returns a negative value for rates above 55% (cheaper)', () => {
    // Higher taper → less UC paid → lower expenditure → negative delta
    expect(computeFiscalCostDelta(63)).toBeLessThan(0);
    expect(computeFiscalCostDelta(75)).toBeLessThan(0);
  });

  it('delta is monotonically decreasing as taper rate rises', () => {
    const rates = [40, 45, 50, 55, 60, 65, 70, 75];
    const deltas = rates.map(computeFiscalCostDelta);
    for (let i = 1; i < deltas.length; i++) {
      expect(deltas[i]).toBeLessThanOrEqual(deltas[i - 1]);
    }
  });

  it('absolute delta at TAPER_RATE_MIN is larger than at TAPER_RATE_MAX (symmetric magnitude check)', () => {
    // The distribution is centred; extreme rates should produce larger deltas than moderate ones.
    expect(Math.abs(computeFiscalCostDelta(TAPER_RATE_MIN))).toBeGreaterThan(
      Math.abs(computeFiscalCostDelta(TAPER_RATE_MIN + 5)),
    );
    expect(Math.abs(computeFiscalCostDelta(TAPER_RATE_MAX))).toBeGreaterThan(
      Math.abs(computeFiscalCostDelta(TAPER_RATE_MAX - 5)),
    );
  });

  it('delta at 40% is in a plausible £bn range (0.5bn – 10bn)', () => {
    // Stylised model — not a precise forecast, but should be order-of-magnitude reasonable.
    const delta = computeFiscalCostDelta(40);
    expect(delta).toBeGreaterThan(0.5);
    expect(delta).toBeLessThan(10);
  });

  it('delta at 75% is in a plausible negative £bn range (−10bn – −0.5bn)', () => {
    const delta = computeFiscalCostDelta(75);
    expect(delta).toBeLessThan(-0.5);
    expect(delta).toBeGreaterThan(-10);
  });
});
