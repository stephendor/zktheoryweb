/**
 * ShapInstability.data.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * A small deterministic neural network and exact SHAP computation engine
 * for the SHAP Instability Demonstrator interactive.
 *
 * Architecture:
 *   4 input features → 8 hidden (ReLU) → 4 hidden (ReLU) → 1 output (sigmoid)
 *
 * Fixed weights are hand-tuned so that:
 *   1. The baseline claimant scores near the decision threshold (≈ 0.50).
 *   2. In the near-threshold region, the local gradient oscillates between
 *      two dominant features — so tiny perturbations flip which feature
 *      "explains" the score.
 *   3. The predicted score remains in the 0.42–0.58 range across typical
 *      perturbations, while SHAP attributions shift by ±0.15+.
 *
 * SHAP computation: exact Shapley values via all 2^4 = 16 subsets.
 *   φⱼ = Σ_{S ⊆ F\{j}} [ (|S|)!(|F|-|S|-1)! / |F|! ] · [f(S∪{j}) − f(S)]
 *
 * Marginalisation strategy: when feature j is absent from subset S,
 * its value is replaced by the dataset mean (E[xⱼ]), which approximates
 * the conditional expectation for SHAP in the independent-features case.
 *
 * 4 features:
 *   0: age         (0–1, normalised from 18–65)
 *   1: income      (0–1, normalised)
 *   2: bft_dur     (0–1, benefit claim duration in months / 36)
 *   3: hhld_size   (0–1, household size / 6)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export const FEATURE_NAMES = ['Age', 'Income score', 'Benefit duration', 'Household size'] as const;
export type FeatureName = (typeof FEATURE_NAMES)[number];
export type Features = [number, number, number, number];

export interface ShapResult {
  /** Predicted probability (sigmoid output). */
  score: number;
  /** SHAP values for each of the 4 features (sum = score − E[f]). */
  shapValues: Features;
  /** Baseline value E[f] — the mean prediction across the dataset. */
  baseline: number;
}

// ─── Fixed weights ────────────────────────────────────────────────────────────

// Layer 1: 4 inputs → 8 hidden neurons (8×4 weight matrix, 8-vector bias)
// Weights chosen to create complex interactions between income and bft_dur
// near the centre of feature space (where the baseline claimant lives).

const W1: number[][] = [
  [ 1.80, -2.60,  1.40,  0.50],  // h1
  [-1.20,  2.10, -1.90,  0.30],  // h2
  [ 2.20, -0.80,  0.60, -1.10],  // h3
  [-0.90,  1.70,  2.30,  0.40],  // h4
  [ 1.50, -1.30, -0.70,  1.80],  // h5
  [-2.00,  0.60,  1.60, -0.90],  // h6
  [ 0.40,  1.90, -1.50,  0.70],  // h7
  [ 1.10, -0.50,  0.90, -1.40],  // h8
];
const b1 = [-0.80, 0.50, -0.20, 0.30, -0.60, 0.70, 0.20, -0.40];

// Layer 2: 8 hidden → 4 hidden (4×8 weight matrix, 4-vector bias)
const W2: number[][] = [
  [ 1.40, -0.60,  0.80,  1.10, -0.70,  0.50, -1.20,  0.90],
  [-0.80,  1.70, -0.50, -0.30,  1.20, -0.90,  0.40, -0.60],
  [ 0.60, -1.30,  1.50, -0.70,  0.30,  1.40, -0.80,  0.50],
  [-1.10,  0.40, -0.90,  1.60, -1.50,  0.20,  1.10, -0.30],
];
const b2 = [0.20, -0.30, 0.40, -0.10];

// Output layer: 4 hidden → 1 (1×4 weight, scalar bias)
// b_out calibrated so that BASELINE_FEATURES → score ≈ 0.50
const W_out = [0.90, -1.10, 0.70, -0.85];
const b_out = 1.12;

// ─── Feature space ────────────────────────────────────────────────────────────

/**
 * Dataset mean features — used as the background distribution for SHAP
 * marginalisation (independent-feature approximation).
 */
export const FEATURE_MEANS: Features = [0.52, 0.45, 0.38, 0.40];

/** Minimum and maximum allowed values for each feature slider. */
export const FEATURE_MIN: Features = [0.15, 0.10, 0.05, 0.10];
export const FEATURE_MAX: Features = [0.95, 0.90, 0.95, 0.85];

/**
 * Default "near-threshold claimant" — hand-tuned to produce a score ≈ 0.50.
 * This is the starting point for the interactive.
 */
export const BASELINE_FEATURES: Features = [0.55, 0.42, 0.45, 0.38];

/** Human-readable labels for feature slider range extremes. */
export const FEATURE_LABELS: Record<FeatureName, { low: string; high: string }> = {
  'Age':               { low: '18', high: '65+' },
  'Income score':      { low: 'very low', high: 'high' },
  'Benefit duration':  { low: 'recent (<3 mo)', high: 'long (3+ yr)' },
  'Household size':    { low: '1 person', high: '6+ persons' },
};

// ─── Neural network forward pass ──────────────────────────────────────────────

function relu(x: number): number { return Math.max(0, x); }
function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }

function dotBias(w: number[], x: number[], b: number): number {
  let s = b;
  for (let i = 0; i < w.length; i++) s += w[i] * x[i];
  return s;
}

/**
 * Forward pass: return the sigmoid score for a 4-feature input vector.
 */
export function predictScore(features: Features): number {
  // Layer 1
  const h1 = W1.map((row, i) => relu(dotBias(row, features, b1[i])));
  // Layer 2
  const h2 = W2.map((row, i) => relu(dotBias(row, h1, b2[i])));
  // Output
  const logit = dotBias(W_out, h2, b_out);
  return sigmoid(logit);
}

// ─── Exact SHAP via subset enumeration ───────────────────────────────────────

/** Total number of features. */
const N_FEATURES = 4;

/**
 * Compute the marginalised model prediction when only the features in `mask`
 * are "present" (from input `features`). Absent features take their mean value.
 *
 * @param features - The input feature vector.
 * @param mask     - Bitmask: bit i=1 means feature i is present.
 */
function maskedPredict(features: Features, mask: number): number {
  const x: Features = features.map((v, i) =>
    mask & (1 << i) ? v : FEATURE_MEANS[i],
  ) as Features;
  return predictScore(x);
}

/** Factorial lookup (0–8). */
const FAC = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];

/**
 * Compute exact SHAP values for all 4 features using Shapley's formula:
 *
 *   φⱼ = Σ_{S ⊆ F\{j}} [ |S|!(|F|-|S|-1)! / |F|! ] · [f(S∪{j}) − f(S)]
 *
 * @param features - The specific input to explain (4-element array).
 * @returns ShapResult with SHAP values summing to (score − baseline).
 */
export function computeShap(features: Features): ShapResult {
  const score = predictScore(features);
  const shapValues: number[] = [0, 0, 0, 0];

  for (let j = 0; j < N_FEATURES; j++) {
    // Iterate over all subsets of F \ {j}
    const others = Array.from({ length: N_FEATURES }, (_, i) => i).filter((i) => i !== j);
    const nOthers = others.length; // = 3

    let phi = 0;
    // 2^nOthers = 8 subsets
    for (let maskIdx = 0; maskIdx < (1 << nOthers); maskIdx++) {
      // Build the actual feature-index mask for S
      let S = 0;
      let sSize = 0;
      for (let k = 0; k < nOthers; k++) {
        if (maskIdx & (1 << k)) {
          S |= (1 << others[k]);
          sSize++;
        }
      }
      const SandJ = S | (1 << j);
      const weight = FAC[sSize] * FAC[N_FEATURES - sSize - 1] / FAC[N_FEATURES];
      phi += weight * (maskedPredict(features, SandJ) - maskedPredict(features, S));
    }
    shapValues[j] = phi;
  }

  const baseline = maskedPredict(features, 0); // f(∅) = f(all means)
  return { score, shapValues: shapValues as Features, baseline };
}

// ─── Instability metric ───────────────────────────────────────────────────────

/**
 * Compute the L∞ distance between two SHAP value vectors (max absolute change).
 * Measures "how much did the explanation change?"
 */
export function shapInstability(a: Features, b: Features): number {
  return Math.max(...a.map((v, i) => Math.abs(v - b[i])));
}

/**
 * Compute the absolute change in predicted score between two feature vectors.
 */
export function scoreDelta(fa: Features, fb: Features): number {
  return Math.abs(predictScore(fa) - predictScore(fb));
}

// ─── Pre-computed baseline SHAP ───────────────────────────────────────────────

export const BASELINE_SHAP = computeShap(BASELINE_FEATURES);
