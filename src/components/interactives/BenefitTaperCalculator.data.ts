/**
 * BenefitTaperCalculator.data.ts — Task 5.4 — Agent_Interactive_Advanced
 *
 * UC (Universal Credit) benefit taper calculation model for UK 2025–26
 * policy parameters. Computes net income and effective marginal rates at
 * each gross earnings level following the taper formula:
 *
 *   taper     = max(0, (earnings − workAllowance) × taperRate)
 *   UC        = max(0, standardAllowance − taper)
 *   netIncome = earnings + UC
 *
 * Effective marginal rate zones:
 *   ≤ work allowance  → 0%  (UC constant; keep £1 for every £1 earned)
 *   taper zone (UC>0) → taperRate × 100%  (e.g. 55% → keep 45p/£1)
 *   beyond exhaustion → 0%  (no further UC to withdraw)
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Parameters defining a UC policy regime. */
export interface UCParams {
  /** Taper rate as a decimal, e.g. 0.55 for 55%. */
  taperRate: number;
  /**
   * Higher-rate work allowance (no housing element), £/month.
   * e.g. £673 for 2025–26.
   */
  workAllowance: number;
  /** Standard allowance for a single claimant aged 25+, £/month. */
  standardAllowance: number;
  /** Human-readable label for this policy regime. */
  label: string;
}

/** Input parameters describing a claimant's household situation. */
export interface HouseholdParams {
  /** Whether the claimant receives a housing element (lowers work allowance). */
  hasHousingElement: boolean;
  /** Gross monthly earnings, £. */
  monthlyEarnings: number;
}

/** Computed UC outcome at a single gross earnings level. */
export interface UCResult {
  /** Gross monthly earnings, £. */
  grossEarnings: number;
  /** UC amount received, £. Always ≥ 0. */
  ucAmount: number;
  /** Net monthly income (earnings + UC), £. */
  netIncome: number;
  /**
   * Effective marginal rate as a percentage (0–100).
   * Represents the fraction of each additional £1 earned "lost" to
   * UC withdrawal. 55 means the claimant keeps only 45p per extra £1.
   */
  effectiveMarginalRate: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Lower-rate work allowance applied when the claimant has a housing element,
 * £/month (2025–26). Consistent across current and pre-2021 regimes.
 */
const WORK_ALLOWANCE_LOWER = 404;

/** Maximum gross monthly earnings displayed on the chart, £. */
export const MAX_EARNINGS = 3000;

// ─── Policy presets ────────────────────────────────────────────────────────────

/** Current 2025–26 UC parameters: 55% taper introduced by the 2021 reform. */
export const CURRENT_PARAMS: UCParams = {
  taperRate: 0.55,
  workAllowance: 673,
  standardAllowance: 393.45,
  label: 'Current (55% taper)',
};

/** Pre-2021 UC parameters: original 63% taper (for historical comparison). */
export const PRE_2021_PARAMS: UCParams = {
  taperRate: 0.63,
  workAllowance: 673,
  standardAllowance: 393.45,
  label: 'Pre-2021 (63% taper)',
};

// ─── Slider range ──────────────────────────────────────────────────────────────

/** Minimum adjustable taper rate (integer percent). */
export const TAPER_RATE_MIN = 40;

/** Maximum adjustable taper rate (integer percent). */
export const TAPER_RATE_MAX = 75;

/** Default taper rate displayed on load (integer percent, matches current policy). */
export const TAPER_RATE_DEFAULT = 55;

// ─── Fiscal cost model ─────────────────────────────────────────────────────────

/**
 * Representative earnings distribution parameters (log-normal, stylised UK model).
 * Used exclusively for the fiscal cost delta readout.
 * Mean of the underlying normal: ln(monthly earnings). A monthly mean of ~£2,100
 * (annual ~£25,200) is consistent with median UK full-time earnings.
 */
const FISCAL_DIST_MEAN = Math.log(2100);
const FISCAL_DIST_SIGMA = 0.65;

/**
 * Number of integration steps for the fiscal cost integral.
 * Higher = more accurate but each call is O(FISCAL_STEPS).
 */
const FISCAL_STEPS = 500;

/**
 * Population scale factor: approximate number of working-age UC claimants
 * in the earnings range (stylised). Used to convert per-person monthly delta
 * to an annualised aggregate figure (£bn).
 * Source: ~2.5 million UC claimants in employment (2024).
 */
const FISCAL_CLAIMANT_COUNT = 2_500_000;

/**
 * Compute the approximate annualised UC expenditure for a given taper rate,
 * relative to the 55% baseline.
 *
 * Model:
 *   1. Draw `steps` representative earners from a log-normal(mu, sigma) distribution
 *      across the earnings range [0, MAX_EARNINGS].
 *   2. For each earner, compute their UC award under the selected rate and under the
 *      55% baseline, using no housing element (the more common case).
 *   3. Average the difference per earner per month.
 *   4. Scale to annualised total across the full claimant population.
 *
 * Returns a positive value when the selected rate is LOWER than 55% (more generous),
 * negative when higher (cheaper).
 *
 * @param taperRatePct  - Selected taper rate as an integer percentage (e.g. 55).
 * @returns Annualised expenditure delta in £ billion (positive = more expensive).
 */
export function computeFiscalCostDelta(taperRatePct: number): number {
  const selectedRate = taperRatePct / 100;
  const baselineRate = TAPER_RATE_DEFAULT / 100;

  if (selectedRate === baselineRate) return 0;

  const baselineParams: UCParams = {
    ...CURRENT_PARAMS,
    taperRate: baselineRate,
  };
  const selectedParams: UCParams = {
    ...CURRENT_PARAMS,
    taperRate: selectedRate,
  };

  // Integrate the UC delta over the log-normal earnings distribution.
  // We use a quadrature-style approach: sample `FISCAL_STEPS` earnings levels
  // weighted by the log-normal PDF, then average the per-person UC delta.
  const step = MAX_EARNINGS / FISCAL_STEPS;
  let totalDelta = 0;
  let totalWeight = 0;

  for (let i = 1; i <= FISCAL_STEPS; i++) {
    const earnings = i * step;
    // Log-normal PDF weight (unnormalised; we normalise below).
    const lnE = Math.log(earnings);
    const weight =
      (1 / (earnings * FISCAL_DIST_SIGMA)) *
      Math.exp(-0.5 * ((lnE - FISCAL_DIST_MEAN) / FISCAL_DIST_SIGMA) ** 2);

    const ucBase = computeUCAtEarnings(baselineParams, false, earnings);
    const ucSelected = computeUCAtEarnings(selectedParams, false, earnings);
    // Delta: positive when the selected rate pays more UC than baseline.
    totalDelta += (ucSelected - ucBase) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  // Average monthly per-person delta (£).
  const avgMonthlyDelta = totalDelta / totalWeight;

  // Scale to annualised aggregate across UK claimant population (£bn).
  const annualTotalGBP = avgMonthlyDelta * 12 * FISCAL_CLAIMANT_COUNT;
  return annualTotalGBP / 1_000_000_000;
}

/**
 * Compute the UC amount for a single earner under the given policy params.
 * Internal helper for `computeFiscalCostDelta`.
 */
function computeUCAtEarnings(
  params: UCParams,
  hasHousingElement: boolean,
  grossEarnings: number,
): number {
  const workAllowance = hasHousingElement ? WORK_ALLOWANCE_LOWER : params.workAllowance;
  const tapered = Math.max(0, (grossEarnings - workAllowance) * params.taperRate);
  return Math.max(0, params.standardAllowance - tapered);
}

// ─── Calculation ───────────────────────────────────────────────────────────────

/**
 * Compute a UC earnings schedule: an array of UCResult at each gross earnings
 * increment from £0 to MAX_EARNINGS (inclusive).
 *
 * @param params            - UC policy parameters.
 * @param hasHousingElement - Whether the claimant has a housing element
 *                            (uses the lower £404 work allowance).
 * @param steps             - Number of sampling intervals.
 *                            Produces `steps + 1` results.
 *                            e.g. 300 → £10 increments over £0–£3,000.
 * @returns Array of UCResult objects ordered by ascending gross earnings.
 */
export function computeUCSchedule(
  params: UCParams,
  hasHousingElement: boolean,
  steps: number,
): UCResult[] {
  if (steps <= 0) return [];

  const { taperRate, standardAllowance } = params;

  // Select the applicable work allowance based on housing element.
  const workAllowance = hasHousingElement
    ? WORK_ALLOWANCE_LOWER
    : params.workAllowance;

  const results: UCResult[] = [];

  for (let i = 0; i <= steps; i++) {
    const grossEarnings = (i / steps) * MAX_EARNINGS;

    // Taper: amount of UC withdrawn is (earnings above threshold) × rate.
    // Clamped at 0 — no withdrawal below the work allowance.
    const tapered = Math.max(0, (grossEarnings - workAllowance) * taperRate);

    // UC amount: standard allowance minus the taper withdrawal, floor at 0.
    const ucAmount = Math.max(0, standardAllowance - tapered);

    // Net income: gross earnings plus any remaining UC.
    const netIncome = grossEarnings + ucAmount;

    // Effective marginal rate:
    //   • Below / at work allowance: no taper active, EMR = 0%.
    //   • In taper zone (UC > 0 and earnings > threshold): each extra £1
    //     earned reduces UC by taperRate → EMR = taperRate × 100%.
    //   • Beyond UC exhaustion (UC = 0): no further withdrawal, EMR = 0%.
    // Math.round snaps taperRate × 100 to the nearest integer (e.g. 55, 63)
    // avoiding floating-point representation artefacts (0.55 × 100 ≠ 55.0
    // exactly in IEEE 754).
    let effectiveMarginalRate: number;
    if (grossEarnings <= workAllowance || ucAmount === 0) {
      effectiveMarginalRate = 0;
    } else {
      effectiveMarginalRate = Math.round(taperRate * 100);
    }

    results.push({ grossEarnings, ucAmount, netIncome, effectiveMarginalRate });
  }

  return results;
}
