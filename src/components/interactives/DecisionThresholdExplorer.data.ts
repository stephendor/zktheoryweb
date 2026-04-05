/**
 * DecisionThresholdExplorer.data.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Synthetic welfare scoring dataset and threshold calculation engine for the
 * Decision Threshold Explorer interactive.
 *
 * Dataset:
 *   300 synthetic claimants, each with:
 *     - A predicted probability score (0–1) from a logistic regression model
 *     - A true outcome label (genuinely high-risk: 1, genuinely low-risk: 0)
 *     - A demographic group: A (majority), B (minority)
 *
 * The dataset is designed so that:
 *   - Group B has a higher base rate of true positives (reflecting a
 *     structurally disadvantaged population)
 *   - The model's calibration is worse for Group B (reflecting label bias
 *     from historical investigatory patterns)
 *
 * Threshold metrics:
 *   For a given τ, every claimant is classified:
 *     TP: score ≥ τ AND true label = 1
 *     FP: score ≥ τ AND true label = 0
 *     TN: score < τ AND true label = 0
 *     FN: score < τ AND true label = 1
 *
 *   TPR (sensitivity / recall) = TP / (TP + FN)
 *   FPR (fall-out)             = FP / (FP + TN)
 *   TNR (specificity)          = TN / (FP + TN) = 1 − FPR
 *   FNR (miss rate)            = FN / (TP + FN) = 1 − TPR
 *   Precision                  = TP / (TP + FP)
 *   F1                         = 2·TP / (2·TP + FP + FN)
 *
 * ROC curve: sweep τ from 1 to 0 and record (FPR, TPR) pairs.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Group = 'A' | 'B';

export interface Claimant {
  /** Predicted probability output of the logistic regression model. */
  score: number;
  /** True outcome: 1 = genuinely high-risk, 0 = genuinely low-risk. */
  trueLabel: 0 | 1;
  /** Demographic group. */
  group: Group;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface ThresholdMetrics {
  threshold: number;
  /** All claimants combined. */
  overall: ConfusionMatrix & {
    tpr: number; fpr: number; tnr: number; fnr: number;
    precision: number; f1: number;
  };
  /** Group A only. */
  groupA: ConfusionMatrix & {
    tpr: number; fpr: number; tnr: number; fnr: number;
  };
  /** Group B only. */
  groupB: ConfusionMatrix & {
    tpr: number; fpr: number; tnr: number; fnr: number;
  };
}

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

// ─── Confusion matrix from a scored dataset ───────────────────────────────────

/**
 * Compute a confusion matrix for a subset of claimants at threshold τ.
 */
export function confusionMatrix(
  claimants: Claimant[],
  threshold: number,
): ConfusionMatrix {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const c of claimants) {
    const flagged = c.score >= threshold;
    if (flagged && c.trueLabel === 1) tp++;
    else if (flagged && c.trueLabel === 0) fp++;
    else if (!flagged && c.trueLabel === 0) tn++;
    else fn++;
  }
  return { tp, fp, tn, fn };
}

/**
 * Extend a confusion matrix with derived metrics.
 * Safe division: returns 0 when denominator is 0.
 */
function withMetrics(cm: ConfusionMatrix): ReturnType<ThresholdMetrics['overall']['tpr'] extends number ? typeof Object.assign : never> & any {
  const { tp, fp, tn, fn } = cm;
  const tpr = tp + fn > 0 ? tp / (tp + fn) : 0;
  const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
  const tnr = 1 - fpr;
  const fnr = 1 - tpr;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const f1 = 2 * tp + fp + fn > 0 ? (2 * tp) / (2 * tp + fp + fn) : 0;
  return { tp, fp, tn, fn, tpr, fpr, tnr, fnr, precision, f1 };
}

function withGroupMetrics(cm: ConfusionMatrix) {
  const { tp, fp, tn, fn } = cm;
  const tpr = tp + fn > 0 ? tp / (tp + fn) : 0;
  const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
  const tnr = 1 - fpr;
  const fnr = 1 - tpr;
  return { tp, fp, tn, fn, tpr, fpr, tnr, fnr };
}

/**
 * Compute all threshold metrics (overall + per group) at threshold τ.
 */
export function computeThresholdMetrics(
  claimants: Claimant[],
  threshold: number,
): ThresholdMetrics {
  const groupA = claimants.filter((c) => c.group === 'A');
  const groupB = claimants.filter((c) => c.group === 'B');
  return {
    threshold,
    overall: withMetrics(confusionMatrix(claimants, threshold)),
    groupA: withGroupMetrics(confusionMatrix(groupA, threshold)),
    groupB: withGroupMetrics(confusionMatrix(groupB, threshold)),
  };
}

/**
 * Compute the ROC curve by sweeping τ over all unique score values,
 * plus 0 and 1 as extremes.
 */
export function computeRocCurve(claimants: Claimant[]): RocPoint[] {
  const thresholds = [
    0,
    ...Array.from(new Set(claimants.map((c) => c.score))).sort((a, b) => a - b),
    1.01,
  ];
  return thresholds.map((t) => {
    const cm = confusionMatrix(claimants, t);
    const tpr = cm.tp + cm.fn > 0 ? cm.tp / (cm.tp + cm.fn) : 0;
    const fpr = cm.fp + cm.tn > 0 ? cm.fp / (cm.fp + cm.tn) : 0;
    return { fpr, tpr, threshold: t };
  });
}

/**
 * Compute the Area Under the ROC Curve (AUC) using the trapezoidal rule.
 */
export function computeAuc(rocCurve: RocPoint[]): number {
  const sorted = [...rocCurve].sort((a, b) => a.fpr - b.fpr);
  let auc = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dx = sorted[i].fpr - sorted[i - 1].fpr;
    const avgY = (sorted[i].tpr + sorted[i - 1].tpr) / 2;
    auc += dx * avgY;
  }
  return Math.max(0, Math.min(1, auc));
}

// ─── Synthetic dataset ────────────────────────────────────────────────────────

/**
 * Sigmoid function for generating scores.
 * σ(z) = 1 / (1 + e^{-z})
 */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Generate a deterministic synthetic welfare risk scoring dataset.
 *
 * 300 claimants: 200 Group A (majority), 100 Group B (minority).
 *
 * True base rates:
 *   Group A: 20% genuinely high-risk (40 of 200)
 *   Group B: 40% genuinely high-risk (40 of 100)
 *   (Group B has higher structural risk)
 *
 * Model score generation (deterministic pseudo-random via index):
 *   Scores for true positives are drawn from a distribution centred ~0.65
 *   Scores for true negatives are drawn from a distribution centred ~0.35
 *   Group B scores have added noise (worse calibration / label bias)
 *
 * The distributions are generated deterministically using integer arithmetic
 * to avoid any dependency on Math.random().
 */
function generateDataset(): Claimant[] {
  const claimants: Claimant[] = [];

  // Deterministic "hash" for position i in [min, max]
  function deterministicScore(
    i: number,
    total: number,
    centre: number,
    spread: number,
    noiseMagnitude: number,
    noisePhase: number,
  ): number {
    // Base: evenly spaced around centre with `spread` range
    const base = centre + spread * ((i / (total - 1)) - 0.5);
    // Deterministic noise via sine with different phase per group
    const noise = noiseMagnitude * Math.sin((i * noisePhase * Math.PI) / total);
    return Math.max(0.01, Math.min(0.99, base + noise));
  }

  // ── Group A — 200 claimants ────────────────────────────────────────────────
  // 40 true positives (indices 0–39), 160 true negatives (indices 40–199)
  for (let i = 0; i < 40; i++) {
    const score = deterministicScore(i, 40, 0.67, 0.50, 0.08, 3.7);
    claimants.push({ score, trueLabel: 1, group: 'A' });
  }
  for (let i = 0; i < 160; i++) {
    const score = deterministicScore(i, 160, 0.30, 0.55, 0.06, 2.3);
    claimants.push({ score, trueLabel: 0, group: 'A' });
  }

  // ── Group B — 100 claimants (worse calibration, higher noise) ─────────────
  // 40 true positives, 60 true negatives
  for (let i = 0; i < 40; i++) {
    // Noisier: centre pulled slightly lower due to label bias
    const score = deterministicScore(i, 40, 0.60, 0.55, 0.14, 4.1);
    claimants.push({ score, trueLabel: 1, group: 'B' });
  }
  for (let i = 0; i < 60; i++) {
    // Noisier: some low-risk Group B members score higher (investigatory bias)
    const score = deterministicScore(i, 60, 0.40, 0.50, 0.15, 3.9);
    claimants.push({ score, trueLabel: 0, group: 'B' });
  }

  return claimants;
}

export const SYNTHETIC_CLAIMANTS: Claimant[] = generateDataset();

export const TOTAL_CLAIMANTS = SYNTHETIC_CLAIMANTS.length;
export const GROUP_A_COUNT = SYNTHETIC_CLAIMANTS.filter((c) => c.group === 'A').length;
export const GROUP_B_COUNT = SYNTHETIC_CLAIMANTS.filter((c) => c.group === 'B').length;

// ─── Pre-computed ROC curve ───────────────────────────────────────────────────

export const ROC_CURVE = computeRocCurve(SYNTHETIC_CLAIMANTS);
export const AUC = computeAuc(ROC_CURVE);

// ─── Threshold range ──────────────────────────────────────────────────────────

export const THRESHOLD_DEFAULT = 0.50;
export const THRESHOLD_MIN = 0.10;
export const THRESHOLD_MAX = 0.90;
export const THRESHOLD_STEP = 0.01;
