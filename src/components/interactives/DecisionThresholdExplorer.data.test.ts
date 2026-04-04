/**
 * DecisionThresholdExplorer.data.test.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Unit tests for the Decision Threshold Explorer data module.
 */

import { describe, it, expect } from 'vitest';
import {
  confusionMatrix,
  computeThresholdMetrics,
  computeRocCurve,
  computeAuc,
  SYNTHETIC_CLAIMANTS,
  TOTAL_CLAIMANTS,
  GROUP_A_COUNT,
  GROUP_B_COUNT,
  ROC_CURVE,
  AUC,
  THRESHOLD_DEFAULT,
  THRESHOLD_MIN,
  THRESHOLD_MAX,
} from './DecisionThresholdExplorer.data';
import type { Claimant } from './DecisionThresholdExplorer.data';

// ─── confusionMatrix ─────────────────────────────────────────────────────────

describe('confusionMatrix', () => {
  const dataset: Claimant[] = [
    { score: 0.8, trueLabel: 1, group: 'A' }, // TP at τ=0.5
    { score: 0.6, trueLabel: 0, group: 'A' }, // FP at τ=0.5
    { score: 0.3, trueLabel: 1, group: 'B' }, // FN at τ=0.5
    { score: 0.2, trueLabel: 0, group: 'B' }, // TN at τ=0.5
  ];

  it('correctly classifies TP, FP, TN, FN at τ=0.5', () => {
    const cm = confusionMatrix(dataset, 0.5);
    expect(cm.tp).toBe(1);
    expect(cm.fp).toBe(1);
    expect(cm.fn).toBe(1);
    expect(cm.tn).toBe(1);
  });

  it('all are TP or FP when τ=0 (everyone flagged)', () => {
    const cm = confusionMatrix(dataset, 0);
    expect(cm.tp).toBe(2); // true positives
    expect(cm.fp).toBe(2); // true negatives wrongly flagged
    expect(cm.fn).toBe(0);
    expect(cm.tn).toBe(0);
  });

  it('all are FN or TN when τ=1 (no one flagged)', () => {
    const cm = confusionMatrix(dataset, 1.0);
    expect(cm.tp).toBe(0);
    expect(cm.fp).toBe(0);
    expect(cm.fn).toBe(2);
    expect(cm.tn).toBe(2);
  });

  it('sum of TP+FP+TN+FN equals dataset length', () => {
    const cm = confusionMatrix(dataset, 0.5);
    expect(cm.tp + cm.fp + cm.tn + cm.fn).toBe(dataset.length);
  });

  it('returns all zeros for empty dataset', () => {
    const cm = confusionMatrix([], 0.5);
    expect(cm).toEqual({ tp: 0, fp: 0, tn: 0, fn: 0 });
  });
});

// ─── computeThresholdMetrics ──────────────────────────────────────────────────

describe('computeThresholdMetrics', () => {
  const dataset: Claimant[] = [
    { score: 0.9, trueLabel: 1, group: 'A' }, // TP
    { score: 0.8, trueLabel: 0, group: 'A' }, // FP
    { score: 0.4, trueLabel: 1, group: 'B' }, // FN
    { score: 0.3, trueLabel: 0, group: 'B' }, // TN
  ];

  it('overall TPR = 0.5 (1 TP, 1 FN)', () => {
    const { overall } = computeThresholdMetrics(dataset, 0.5);
    expect(overall.tpr).toBeCloseTo(0.5, 5);
  });

  it('overall FPR = 0.5 (1 FP, 1 TN)', () => {
    const { overall } = computeThresholdMetrics(dataset, 0.5);
    expect(overall.fpr).toBeCloseTo(0.5, 5);
  });

  it('TNR = 1 − FPR', () => {
    const { overall } = computeThresholdMetrics(dataset, 0.5);
    expect(overall.tnr).toBeCloseTo(1 - overall.fpr, 10);
  });

  it('FNR = 1 − TPR', () => {
    const { overall } = computeThresholdMetrics(dataset, 0.5);
    expect(overall.fnr).toBeCloseTo(1 - overall.tpr, 10);
  });

  it('group metrics sum matches overall metrics', () => {
    const { overall, groupA, groupB } = computeThresholdMetrics(dataset, 0.5);
    expect(groupA.tp + groupB.tp).toBe(overall.tp);
    expect(groupA.fp + groupB.fp).toBe(overall.fp);
  });

  it('F1 is between 0 and 1', () => {
    const { overall } = computeThresholdMetrics(dataset, 0.5);
    expect(overall.f1).toBeGreaterThanOrEqual(0);
    expect(overall.f1).toBeLessThanOrEqual(1);
  });
});

// ─── computeRocCurve ─────────────────────────────────────────────────────────

describe('computeRocCurve', () => {
  const dataset: Claimant[] = [
    { score: 0.9, trueLabel: 1, group: 'A' },
    { score: 0.7, trueLabel: 1, group: 'A' },
    { score: 0.4, trueLabel: 0, group: 'B' },
    { score: 0.2, trueLabel: 0, group: 'B' },
  ];

  it('returns an array of ROC points', () => {
    const roc = computeRocCurve(dataset);
    expect(Array.isArray(roc)).toBe(true);
    expect(roc.length).toBeGreaterThan(2);
  });

  it('all FPR values are in [0, 1]', () => {
    const roc = computeRocCurve(dataset);
    for (const p of roc) {
      expect(p.fpr).toBeGreaterThanOrEqual(0);
      expect(p.fpr).toBeLessThanOrEqual(1);
    }
  });

  it('all TPR values are in [0, 1]', () => {
    const roc = computeRocCurve(dataset);
    for (const p of roc) {
      expect(p.tpr).toBeGreaterThanOrEqual(0);
      expect(p.tpr).toBeLessThanOrEqual(1);
    }
  });
});

// ─── computeAuc ──────────────────────────────────────────────────────────────

describe('computeAuc', () => {
  it('returns 1.0 for a perfect model', () => {
    const perfRoc = [
      { fpr: 0, tpr: 0, threshold: 1 },
      { fpr: 0, tpr: 1, threshold: 0.5 },
      { fpr: 1, tpr: 1, threshold: 0 },
    ];
    expect(computeAuc(perfRoc)).toBeCloseTo(1.0, 5);
  });

  it('returns 0.5 for a random model (diagonal)', () => {
    const diagRoc = [
      { fpr: 0, tpr: 0, threshold: 1 },
      { fpr: 0.5, tpr: 0.5, threshold: 0.5 },
      { fpr: 1, tpr: 1, threshold: 0 },
    ];
    expect(computeAuc(diagRoc)).toBeCloseTo(0.5, 5);
  });

  it('AUC is between 0 and 1', () => {
    expect(AUC).toBeGreaterThanOrEqual(0);
    expect(AUC).toBeLessThanOrEqual(1);
  });

  it('AUC for synthetic dataset is > 0.5 (model is better than random)', () => {
    expect(AUC).toBeGreaterThan(0.5);
  });
});

// ─── SYNTHETIC_CLAIMANTS dataset integrity ────────────────────────────────────

describe('SYNTHETIC_CLAIMANTS', () => {
  it('has exactly 300 claimants', () => {
    expect(TOTAL_CLAIMANTS).toBe(300);
    expect(SYNTHETIC_CLAIMANTS).toHaveLength(300);
  });

  it('GROUP_A + GROUP_B = TOTAL', () => {
    expect(GROUP_A_COUNT + GROUP_B_COUNT).toBe(TOTAL_CLAIMANTS);
  });

  it('GROUP_A has 200 claimants', () => {
    expect(GROUP_A_COUNT).toBe(200);
  });

  it('GROUP_B has 100 claimants', () => {
    expect(GROUP_B_COUNT).toBe(100);
  });

  it('all scores are in (0, 1)', () => {
    for (const c of SYNTHETIC_CLAIMANTS) {
      expect(c.score).toBeGreaterThan(0);
      expect(c.score).toBeLessThan(1);
    }
  });

  it('true labels are only 0 or 1', () => {
    for (const c of SYNTHETIC_CLAIMANTS) {
      expect([0, 1]).toContain(c.trueLabel);
    }
  });

  it('groups are only A or B', () => {
    for (const c of SYNTHETIC_CLAIMANTS) {
      expect(['A', 'B']).toContain(c.group);
    }
  });

  it('Group A has ~20% true positive base rate', () => {
    const groupA = SYNTHETIC_CLAIMANTS.filter((c) => c.group === 'A');
    const posRate = groupA.filter((c) => c.trueLabel === 1).length / groupA.length;
    expect(posRate).toBeCloseTo(0.20, 1);
  });

  it('Group B has ~40% true positive base rate', () => {
    const groupB = SYNTHETIC_CLAIMANTS.filter((c) => c.group === 'B');
    const posRate = groupB.filter((c) => c.trueLabel === 1).length / groupB.length;
    expect(posRate).toBeCloseTo(0.40, 1);
  });

  it('THRESHOLD_DEFAULT is within [THRESHOLD_MIN, THRESHOLD_MAX]', () => {
    expect(THRESHOLD_DEFAULT).toBeGreaterThanOrEqual(THRESHOLD_MIN);
    expect(THRESHOLD_DEFAULT).toBeLessThanOrEqual(THRESHOLD_MAX);
  });
});

// ─── Threshold sensitivity ────────────────────────────────────────────────────

describe('threshold sensitivity', () => {
  it('lowering threshold increases TPR (catches more true positives)', () => {
    const high = computeThresholdMetrics(SYNTHETIC_CLAIMANTS, 0.7);
    const low = computeThresholdMetrics(SYNTHETIC_CLAIMANTS, 0.3);
    expect(low.overall.tpr).toBeGreaterThan(high.overall.tpr);
  });

  it('lowering threshold increases FPR (more false positives)', () => {
    const high = computeThresholdMetrics(SYNTHETIC_CLAIMANTS, 0.7);
    const low = computeThresholdMetrics(SYNTHETIC_CLAIMANTS, 0.3);
    expect(low.overall.fpr).toBeGreaterThan(high.overall.fpr);
  });

  it('ROC_CURVE length equals unique thresholds + 2 extremes', () => {
    expect(ROC_CURVE.length).toBeGreaterThan(10);
  });
});
