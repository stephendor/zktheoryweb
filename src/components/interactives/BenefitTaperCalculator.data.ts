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
