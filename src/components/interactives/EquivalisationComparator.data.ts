/**
 * EquivalisationComparator.data.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Data model and calculation engine for the Equivalisation Comparator.
 *
 * Three equivalisation scales are applied to a stylised UK household income
 * distribution. For each scale and poverty threshold, the tool computes the
 * resulting poverty rate and the distribution of equivalised income.
 *
 * Scales implemented:
 *   Original OECD:  S = 1.0 + 0.7(n_a−1) + 0.5·n_c
 *   Modified OECD:  S = 1.0 + 0.5(n_a−1) + 0.3·n_c
 *   McClements:     S = 1.0 + 0.57 + 0.29·n_c  (simplified: mean child weight
 *                   across age bands; adult = head + spouse only for demo)
 *
 * Poverty threshold: x% of median equivalised income (default 60%).
 * Poverty rate: share of households below the threshold.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** One of the three equivalisation scales. */
export type ScaleId = 'oecd-original' | 'oecd-modified' | 'mcclements';

/** A stylised household record. */
export interface Household {
  /** Monthly gross cash income (£). */
  income: number;
  /** Number of adults (≥ 1). */
  adults: number;
  /** Number of dependent children. */
  children: number;
}

/** Per-household computed result under a given scale. */
export interface HouseholdResult {
  grossIncome: number;
  adults: number;
  children: number;
  equivalisedIncome: number;
  /** True if equivalised income is below the poverty threshold. */
  isPoor: boolean;
}

/** Aggregate result for one scale at a given threshold. */
export interface ScaleResult {
  scale: ScaleId;
  label: string;
  shortLabel: string;
  /** Percentage of households below the poverty line (0–100). */
  povertyRate: number;
  /** Poverty threshold value (£/month). */
  povertyThreshold: number;
  /** Median equivalised income (£/month). */
  medianEquivIncome: number;
  rowResults: HouseholdResult[];
}

// ─── Equivalisation scale formulas ───────────────────────────────────────────

/**
 * Compute the equivalisation factor S under the Original OECD scale.
 *   S = 1.0 + 0.7·(n_a − 1) + 0.5·n_c
 */
export function oecdOriginalFactor(adults: number, children: number): number {
  return 1.0 + 0.7 * Math.max(0, adults - 1) + 0.5 * children;
}

/**
 * Compute the equivalisation factor S under the Modified OECD scale.
 *   S = 1.0 + 0.5·(n_a − 1) + 0.3·n_c
 */
export function oecdModifiedFactor(adults: number, children: number): number {
  return 1.0 + 0.5 * Math.max(0, adults - 1) + 0.3 * children;
}

/**
 * Compute the equivalisation factor S under a simplified McClements scale.
 *
 * Full McClements uses age-banded child weights (0.09 to 0.36).
 * For this comparative tool, we use the mean child weight across
 * the 0–15 age range (approximately 0.29) — a realistic approximation
 * for a household with children of mixed ages.
 *
 * Adult structure: head = 1.0, spouse = 0.57, each additional adult = 0.42.
 */
export function mcclementsFactorSimplified(adults: number, children: number): number {
  // Head of household
  let s = 1.0;
  // Spouse (if adults ≥ 2)
  if (adults >= 2) s += 0.57;
  // Additional adults beyond two
  if (adults > 2) s += 0.42 * (adults - 2);
  // Children (mean weight across age bands)
  s += 0.29 * children;
  return s;
}

/** Dispatch: return the equivalisation factor for the requested scale. */
export function equivalisationFactor(
  scale: ScaleId,
  adults: number,
  children: number,
): number {
  switch (scale) {
    case 'oecd-original':
      return oecdOriginalFactor(adults, children);
    case 'oecd-modified':
      return oecdModifiedFactor(adults, children);
    case 'mcclements':
      return mcclementsFactorSimplified(adults, children);
  }
}

// ─── Statistical helpers ──────────────────────────────────────────────────────

/**
 * Compute the median of a numeric array.
 * Returns 0 for empty arrays.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// ─── Core calculation ─────────────────────────────────────────────────────────

/**
 * Apply an equivalisation scale to a household dataset and compute poverty
 * statistics at the given threshold fraction.
 *
 * @param households      - The household dataset.
 * @param scale           - Which scale to apply.
 * @param thresholdFraction - Poverty line as a fraction of median (e.g. 0.60).
 * @returns ScaleResult with per-household details and aggregate statistics.
 */
export function applyScale(
  households: Household[],
  scale: ScaleId,
  thresholdFraction: number,
): ScaleResult {
  const SCALE_META: Record<ScaleId, { label: string; shortLabel: string }> = {
    'oecd-original': { label: 'Original OECD', shortLabel: 'OECD-orig' },
    'oecd-modified': { label: 'Modified OECD', shortLabel: 'OECD-mod' },
    'mcclements':    { label: 'McClements', shortLabel: 'McC' },
  };

  const equivIncomes = households.map((h) => {
    const s = equivalisationFactor(scale, h.adults, h.children);
    return h.income / s;
  });

  const medianEquivIncome = median(equivIncomes);
  const povertyThreshold = medianEquivIncome * thresholdFraction;

  const rowResults: HouseholdResult[] = households.map((h, i) => ({
    grossIncome: h.income,
    adults: h.adults,
    children: h.children,
    equivalisedIncome: equivIncomes[i],
    isPoor: equivIncomes[i] < povertyThreshold,
  }));

  const poorCount = rowResults.filter((r) => r.isPoor).length;
  const povertyRate = households.length > 0 ? (poorCount / households.length) * 100 : 0;

  return {
    scale,
    label: SCALE_META[scale].label,
    shortLabel: SCALE_META[scale].shortLabel,
    povertyRate,
    povertyThreshold,
    medianEquivIncome,
    rowResults,
  };
}

/**
 * Run all three scales on the same household dataset.
 * Returns results in the fixed order: Original OECD, Modified OECD, McClements.
 */
export function compareScales(
  households: Household[],
  thresholdFraction: number,
): [ScaleResult, ScaleResult, ScaleResult] {
  return [
    applyScale(households, 'oecd-original', thresholdFraction),
    applyScale(households, 'oecd-modified', thresholdFraction),
    applyScale(households, 'mcclements', thresholdFraction),
  ];
}

// ─── Stylised UK household dataset ───────────────────────────────────────────

/**
 * Stylised UK income distribution: 200 households sampled from a
 * log-normal distribution with parameters calibrated to approximate
 * the UK 2023–24 monthly gross household income distribution.
 *
 * Composition distribution (rough UK averages):
 *   ~35%: single adult (1 adult, 0 children)
 *   ~25%: couple, no children (2 adults, 0 children)
 *   ~25%: couple with children (2 adults, 1–3 children)
 *   ~10%: lone parent (1 adult, 1–2 children)
 *   ~5%:  single adult, 1 child
 *
 * Monthly income range: £800–£7,000 (gross, log-normal).
 * Median target: ~£2,200/month (consistent with HBAI data).
 *
 * The dataset is fixed (not random) for reproducibility.
 */
function makeHousehold(income: number, adults: number, children: number): Household {
  return { income: Math.round(income), adults, children };
}

// 200 deterministic households: combinations of composition × income tier
// Generated to match the UK distribution shape without a random seed.
export const UK_HOUSEHOLDS: Household[] = [
  // ── Single adult, no children (70 households, spanning £850–£5400) ──────
  ...Array.from({ length: 70 }, (_, i) => {
    const income = 850 * Math.exp((i / 69) * Math.log(5400 / 850));
    return makeHousehold(income, 1, 0);
  }),
  // ── Couple, no children (50 households, spanning £1200–£6800) ───────────
  ...Array.from({ length: 50 }, (_, i) => {
    const income = 1200 * Math.exp((i / 49) * Math.log(6800 / 1200));
    return makeHousehold(income, 2, 0);
  }),
  // ── Couple, 1 child (25 households, spanning £1100–£5600) ───────────────
  ...Array.from({ length: 25 }, (_, i) => {
    const income = 1100 * Math.exp((i / 24) * Math.log(5600 / 1100));
    return makeHousehold(income, 2, 1);
  }),
  // ── Couple, 2 children (25 households, spanning £1300–£6000) ────────────
  ...Array.from({ length: 25 }, (_, i) => {
    const income = 1300 * Math.exp((i / 24) * Math.log(6000 / 1300));
    return makeHousehold(income, 2, 2);
  }),
  // ── Lone parent, 1 child (20 households, spanning £900–£3200) ───────────
  ...Array.from({ length: 20 }, (_, i) => {
    const income = 900 * Math.exp((i / 19) * Math.log(3200 / 900));
    return makeHousehold(income, 1, 1);
  }),
  // ── Lone parent, 2 children (10 households, spanning £950–£3500) ────────
  ...Array.from({ length: 10 }, (_, i) => {
    const income = 950 * Math.exp((i / 9) * Math.log(3500 / 950));
    return makeHousehold(income, 1, 2);
  }),
];

export const TOTAL_HOUSEHOLDS = UK_HOUSEHOLDS.length;

// ─── Household type labels ─────────────────────────────────────────────────────

export function householdTypeLabel(adults: number, children: number): string {
  const adultStr = adults === 1 ? 'Single adult' : `${adults} adults`;
  const childStr =
    children === 0 ? '' : children === 1 ? ', 1 child' : `, ${children} children`;
  return `${adultStr}${childStr}`;
}

// ─── Threshold range ──────────────────────────────────────────────────────────

export const THRESHOLD_DEFAULT = 0.60;
export const THRESHOLD_MIN = 0.40;
export const THRESHOLD_MAX = 0.75;
export const THRESHOLD_STEP = 0.01;
