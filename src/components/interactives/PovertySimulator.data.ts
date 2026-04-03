/**
 * PovertySimulator.data.ts — Task 3.3 — Agent_Interactive_Core
 *
 * Data model and calculation logic for the Poverty Threshold Simulator.
 * All income figures are annual GBP (£). Sources are documented inline.
 *
 * Three measurement methods:
 *   absolute — Rowntree Foundation Minimum Income Standard (MIS) 2024
 *   relative — 60 % of UK median equivalised household income (EU/Townsend tradition)
 *   dwp      — 60 % of DWP HBAI Before Housing Costs (BHC) median (official UK statistics)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Administrative region of the household. */
export type Region = 'london' | 'rest-of-england' | 'scotland' | 'wales';

/** The three poverty measurement methods supported by the simulator. */
export type ThresholdMethod = 'absolute' | 'relative' | 'dwp';

/** User-adjustable household composition parameters. */
export interface HouseholdParams {
  /** Number of adults in the household. Min 1, max 5. */
  adults: number;
  /** Number of children (under-16) in the household. Min 0, max 5. */
  children: number;
  /** UK administrative region (drives cost-of-living adjustment for MIS only). */
  region: Region;
}

/** Result returned by calculateThreshold. */
export interface ThresholdResult {
  /** Annual household income threshold in £ (before housing costs). */
  threshold: number;
  /** Fraction (0–1) of the simulated population below this threshold. */
  rate: number;
  /** Human-readable description of the applied method and result. */
  description: string;
}

/** One point on the income density curve for the area chart. */
export interface IncomeDataPoint {
  /** Annual income in £. */
  income: number;
  /** Probability density at this income level. */
  density: number;
}

// ─── Population Distribution Parameters ──────────────────────────────────────

/**
 * Log-normal model of UK household annual gross income (2024/25).
 *
 * Source: ONS Family Resources Survey 2022/23 (approximate).
 *   Mean gross household income ≈ £28,000 / yr (working-age, 2024 prices)
 *   Shape parameter σ = 0.6 (produces a realistic Lorenz-curve skew)
 *
 * For X ~ LogNormal(μ, σ): E[X] = exp(μ + σ²/2)
 *   → μ = ln(28 000) − σ²/2
 */
export const POPULATION_MEAN = 28_000;
export const POPULATION_SIGMA = 0.6;
export const POPULATION_MU =
  Math.log(POPULATION_MEAN) - (POPULATION_SIGMA * POPULATION_SIGMA) / 2;

// ─── Normal CDF (Abramowitz & Stegun 26.2.17 — 5-term polynomial) ─────────────

/**
 * Cumulative distribution function of the standard normal distribution.
 * Maximum absolute error ≈ 7.5 × 10⁻⁸.
 *
 * Reference: Abramowitz, M. & Stegun, I.A. (1964). Handbook of Mathematical
 * Functions. Formula 26.2.17.
 */
export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2315419 * Math.abs(x));
  const d = 0.39894228 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t *
        (-0.3565638 +
          t * (1.7814779 + t * (-1.821256 + t * 1.3302744))));
  return x > 0 ? 1 - p : p;
}

/**
 * Fraction of the simulated population with annual income at or below `income`.
 *
 * Uses the log-normal CDF: P(X ≤ x) = Φ((ln x − μ) / σ)
 *
 * @param income - Annual household income in £. Returns 0 for income ≤ 0.
 */
export function populationBelowThreshold(income: number): number {
  if (income <= 0) return 0;
  const z = (Math.log(income) - POPULATION_MU) / POPULATION_SIGMA;
  return normalCDF(z);
}

/**
 * Probability density of the log-normal distribution at `income`.
 * Used for the y-values of the area chart.
 *
 * @param income - Annual income in £. Returns 0 for income ≤ 0.
 */
export function populationDensity(income: number): number {
  if (income <= 0) return 0;
  const z = (Math.log(income) - POPULATION_MU) / POPULATION_SIGMA;
  return (
    Math.exp((-z * z) / 2) /
    (income * POPULATION_SIGMA * Math.sqrt(2 * Math.PI))
  );
}

/**
 * Generate an array of { income, density } points spanning £500–£80,000
 * for use in D3 area chart rendering.
 *
 * Starts at 500 rather than 0 to avoid ln(0); density is effectively 0
 * for incomes below ~£1,000 with these parameters.
 *
 * @param points - Number of evenly-spaced samples. Defaults to 400.
 */
export function generateDensityCurve(points = 400): IncomeDataPoint[] {
  const MIN_INCOME = 500;
  const MAX_INCOME = 80_000;
  const step = (MAX_INCOME - MIN_INCOME) / (points - 1);
  return Array.from({ length: points }, (_, i) => {
    const income = MIN_INCOME + i * step;
    return { income, density: populationDensity(income) };
  });
}

// ─── Absolute Threshold — Rowntree / JRF Minimum Income Standard (MIS 2024) ──

/**
 * MIS basket cost base figures for 2024, Before Housing Costs.
 * Source: Joseph Rowntree Foundation, Minimum Income Standard 2024 update.
 *
 *   Single working-age adult, no children:       £15,400 / yr
 *   Each additional working-age adult:           + £9,200 / yr
 *   Each child (average across age bands 0–15):  + £5,800 / yr
 *
 * Note: MIS figures represent what a household needs for an acceptable
 * minimum standard of living, not a subsistence minimum.
 */
export const MIS_BASE_SINGLE_ADULT = 15_400;
export const MIS_PER_ADDITIONAL_ADULT = 9_200;
export const MIS_PER_CHILD = 5_800;

/**
 * Regional cost-of-living multipliers for the MIS basket.
 *
 * London: JRF estimates London costs approximately 20 % above the national
 * average, principally driven by housing, transport, and childcare costs.
 * Scotland / Wales: marginal discount reflecting lower average costs in
 * consumer goods, housing, and transport.
 *
 * Source: JRF regional MIS supplements (approximate 2024 values).
 * Note: Regional adjustment applies to the MIS/absolute method only.
 * The relative and DWP methods use UK-wide median figures.
 */
export const REGION_COST_MULTIPLIER: Record<Region, number> = {
  london: 1.2,
  'rest-of-england': 1.0,
  scotland: 0.97,
  wales: 0.95,
};

function calculateAbsoluteThreshold(params: HouseholdParams): number {
  const { adults, children, region } = params;
  const base =
    MIS_BASE_SINGLE_ADULT +
    Math.max(0, adults - 1) * MIS_PER_ADDITIONAL_ADULT +
    children * MIS_PER_CHILD;
  return Math.round(base * REGION_COST_MULTIPLIER[region]);
}

// ─── Modified OECD Equivalisation Scale ──────────────────────────────────────

/**
 * Compute the modified OECD household equivalisation weight.
 *
 * Weights:
 *   First adult                    = 1.0
 *   Each additional adult (≥ 16)   = 0.5
 *   Each child (under 16)          = 0.3
 *
 * Source: DWP HBAI Technical Note; ONS household income statistics.
 * Used in both the Relative and DWP threshold methods.
 *
 * @param adults   - Number of adults in the household (min 1).
 * @param children - Number of children in the household (min 0).
 */
export function oecdEqualisationFactor(adults: number, children: number): number {
  return 1.0 + Math.max(0, adults - 1) * 0.5 + children * 0.3;
}

// ─── Relative Threshold — 60 % Median (Townsend / EU AROPE tradition) ────────

/**
 * UK median equivalised household income (Before Housing Costs, 2024/25).
 * Source: ONS Family Resources Survey 2022/23 uprated to 2024/25 prices.
 * Approximate single-adult-equivalent median: £35,000 / yr.
 */
export const RELATIVE_MEDIAN = 35_000;

function calculateRelativeThreshold(params: HouseholdParams): number {
  const factor = oecdEqualisationFactor(params.adults, params.children);
  return Math.round(0.6 * RELATIVE_MEDIAN * factor);
}

// ─── DWP Threshold — 60 % of HBAI BHC Median (official UK statistics) ────────

/**
 * DWP Households Below Average Income (HBAI) Before Housing Costs (BHC)
 * median equivalised income (2023/24).
 *
 * Source: DWP HBAI 2023/24 statistical release, Table 2.1.
 * Single-adult-equivalent BHC median: approximately £34,500 / yr.
 *
 * Slightly below the ONS FRS figure, reflecting differences in weighting,
 * population scope, and imputation methodology. The DWP series is the basis
 * for official UK poverty statistics including the Child Poverty Act targets.
 */
export const DWP_BHC_MEDIAN = 34_500;

function calculateDwpThreshold(params: HouseholdParams): number {
  const factor = oecdEqualisationFactor(params.adults, params.children);
  return Math.round(0.6 * DWP_BHC_MEDIAN * factor);
}

// ─── Method Metadata ──────────────────────────────────────────────────────────

const METHOD_LABELS: Record<ThresholdMethod, string> = {
  absolute: 'Absolute (MIS basket)',
  relative: 'Relative (60 % median)',
  dwp: 'Official (DWP HBAI BHC)',
};

const REGION_LABELS: Record<Region, string> = {
  london: 'London',
  'rest-of-england': 'Rest of England',
  scotland: 'Scotland',
  wales: 'Wales',
};

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Calculate the poverty threshold and simulated population poverty rate
 * for a given measurement method and household composition.
 *
 * The `rate` is derived from the log-normal population model and represents
 * the fraction of the simulated UK income distribution below the threshold.
 * It is a stylised approximation — not a precise empirical poverty rate.
 *
 * @param method - Measurement framework to apply.
 * @param params - Household composition parameters.
 * @returns Threshold (£/yr), fraction of simulated population below threshold, description.
 */
export function calculateThreshold(
  method: ThresholdMethod,
  params: HouseholdParams,
): ThresholdResult {
  let threshold: number;

  switch (method) {
    case 'absolute':
      threshold = calculateAbsoluteThreshold(params);
      break;
    case 'relative':
      threshold = calculateRelativeThreshold(params);
      break;
    case 'dwp':
      threshold = calculateDwpThreshold(params);
      break;
  }

  const rate = populationBelowThreshold(threshold);
  const pct = Math.round(rate * 100);

  const adultStr = `${params.adults} adult${params.adults !== 1 ? 's' : ''}`;
  const childStr =
    params.children > 0
      ? `, ${params.children} child${params.children !== 1 ? 'ren' : ''}`
      : '';
  const regionStr = REGION_LABELS[params.region];

  const description =
    `${METHOD_LABELS[method]}: £${threshold.toLocaleString()} / yr ` +
    `for ${adultStr}${childStr} in ${regionStr} — ` +
    `${pct} % of the simulated population fall below this line.`;

  return { threshold, rate, description };
}
