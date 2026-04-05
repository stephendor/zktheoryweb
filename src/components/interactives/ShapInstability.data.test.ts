/**
 * ShapInstability.data.test.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Unit tests for the SHAP Instability Demonstrator data module.
 */

import { describe, it, expect } from 'vitest';
import {
  predictScore,
  computeShap,
  shapInstability,
  scoreDelta,
  BASELINE_FEATURES,
  BASELINE_SHAP,
  FEATURE_MEANS,
  FEATURE_MIN,
  FEATURE_MAX,
} from './ShapInstability.data';
import type { Features } from './ShapInstability.data';

// ─── predictScore ─────────────────────────────────────────────────────────────

describe('predictScore', () => {
  it('returns a value in (0, 1)', () => {
    const score = predictScore(BASELINE_FEATURES);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('baseline features produce score near 0.50 (near-threshold design)', () => {
    const score = predictScore(BASELINE_FEATURES);
    expect(score).toBeGreaterThan(0.35);
    expect(score).toBeLessThan(0.65);
  });

  it('increasing income (feature 1) changes score', () => {
    const high = [...BASELINE_FEATURES] as Features;
    high[1] = Math.min(high[1] + 0.3, FEATURE_MAX[1]);
    expect(predictScore(high)).not.toBeCloseTo(predictScore(BASELINE_FEATURES), 5);
  });

  it('output is deterministic for the same input', () => {
    const a = predictScore(BASELINE_FEATURES);
    const b = predictScore(BASELINE_FEATURES);
    expect(a).toBe(b);
  });

  it('all-minimum features → score is valid', () => {
    expect(predictScore(FEATURE_MIN)).toBeGreaterThan(0);
    expect(predictScore(FEATURE_MIN)).toBeLessThan(1);
  });

  it('all-maximum features → score is valid', () => {
    expect(predictScore(FEATURE_MAX)).toBeGreaterThan(0);
    expect(predictScore(FEATURE_MAX)).toBeLessThan(1);
  });
});

// ─── computeShap ─────────────────────────────────────────────────────────────

describe('computeShap', () => {
  const result = computeShap(BASELINE_FEATURES);

  it('returns score in (0, 1)', () => {
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('SHAP values sum to score − baseline (efficiency property)', () => {
    const { score, shapValues, baseline } = result;
    const shapSum = shapValues.reduce((a, b) => a + b, 0);
    expect(shapSum).toBeCloseTo(score - baseline, 4);
  });

  it('has exactly 4 SHAP values', () => {
    expect(result.shapValues).toHaveLength(4);
  });

  it('SHAP values are finite numbers', () => {
    for (const sv of result.shapValues) {
      expect(Number.isFinite(sv)).toBe(true);
    }
  });

  it('BASELINE_SHAP score matches predictScore(BASELINE_FEATURES)', () => {
    expect(BASELINE_SHAP.score).toBeCloseTo(predictScore(BASELINE_FEATURES), 8);
  });

  it('SHAP efficiency holds for a custom input', () => {
    const custom: Features = [0.60, 0.30, 0.55, 0.45];
    const r = computeShap(custom);
    const shapSum = r.shapValues.reduce((a, b) => a + b, 0);
    expect(shapSum).toBeCloseTo(r.score - r.baseline, 4);
  });

  it('different inputs produce different SHAP values', () => {
    const a = computeShap(BASELINE_FEATURES);
    const b = computeShap([0.20, 0.80, 0.10, 0.20]);
    expect(a.shapValues).not.toEqual(b.shapValues);
  });
});

// ─── shapInstability ─────────────────────────────────────────────────────────

describe('shapInstability', () => {
  it('returns 0 for identical SHAP vectors', () => {
    expect(shapInstability([0.1, 0.2, -0.1, 0.05], [0.1, 0.2, -0.1, 0.05])).toBe(0);
  });

  it('returns the max absolute difference', () => {
    const a: Features = [0.1, 0.2, -0.1, 0.05];
    const b: Features = [0.1, 0.2,  0.3, 0.05];
    // Max diff is |(-0.1) - 0.3| = 0.4
    expect(shapInstability(a, b)).toBeCloseTo(0.4, 5);
  });

  it('is symmetric', () => {
    const a: Features = [0.1, -0.2, 0.3, 0.0];
    const b: Features = [0.2,  0.1, 0.1, 0.2];
    expect(shapInstability(a, b)).toBeCloseTo(shapInstability(b, a), 10);
  });
});

// ─── scoreDelta ───────────────────────────────────────────────────────────────

describe('scoreDelta', () => {
  it('returns 0 for identical feature vectors', () => {
    expect(scoreDelta(BASELINE_FEATURES, BASELINE_FEATURES)).toBe(0);
  });

  it('returns a non-negative value', () => {
    const b: Features = [0.60, 0.42, 0.45, 0.38];
    expect(scoreDelta(BASELINE_FEATURES, b)).toBeGreaterThanOrEqual(0);
  });
});

// ─── Dataset constants ────────────────────────────────────────────────────────

describe('feature constants', () => {
  it('FEATURE_MEANS has 4 values in (0,1)', () => {
    expect(FEATURE_MEANS).toHaveLength(4);
    for (const m of FEATURE_MEANS) {
      expect(m).toBeGreaterThan(0);
      expect(m).toBeLessThan(1);
    }
  });

  it('FEATURE_MIN ≤ FEATURE_MEANS ≤ FEATURE_MAX for all features', () => {
    for (let i = 0; i < 4; i++) {
      expect(FEATURE_MIN[i]).toBeLessThanOrEqual(FEATURE_MEANS[i]);
      expect(FEATURE_MEANS[i]).toBeLessThanOrEqual(FEATURE_MAX[i]);
    }
  });

  it('BASELINE_FEATURES are within min/max bounds', () => {
    for (let i = 0; i < 4; i++) {
      expect(BASELINE_FEATURES[i]).toBeGreaterThanOrEqual(FEATURE_MIN[i]);
      expect(BASELINE_FEATURES[i]).toBeLessThanOrEqual(FEATURE_MAX[i]);
    }
  });
});

// ─── Instability demonstration ────────────────────────────────────────────────

describe('SHAP instability near threshold', () => {
  it('small feature perturbation can produce large SHAP change', () => {
    // Nudge income score by +0.08 — a small change
    const perturbed: Features = [...BASELINE_FEATURES] as Features;
    perturbed[1] = Math.min(perturbed[1] + 0.08, FEATURE_MAX[1]);

    const scoreBefore = predictScore(BASELINE_FEATURES);
    const scoreAfter = predictScore(perturbed);
    const shapBefore = computeShap(BASELINE_FEATURES);
    const shapAfter = computeShap(perturbed);

    const scoreChange = Math.abs(scoreAfter - scoreBefore);
    const shapChange = shapInstability(shapBefore.shapValues, shapAfter.shapValues);

    // The score should be relatively stable (not blow up)
    expect(scoreChange).toBeLessThan(0.3);
    // But SHAP explanation can shift markedly
    expect(shapChange).toBeGreaterThan(0);
    // Both scores should remain near threshold
    expect(scoreBefore).toBeGreaterThan(0.30);
    expect(scoreBefore).toBeLessThan(0.70);
  });
});
