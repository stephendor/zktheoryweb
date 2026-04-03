/**
 * NormalDistExplorer.test.ts — Task 3.2 — Agent_Interactive_Core
 *
 * Vitest unit tests for the normalPDF helper exported from NormalDistExplorer.tsx.
 *
 * Spec: given μ, σ, x → verify f(x) = (1/(σ√2π)) · exp(−(x−μ)²/(2σ²))
 * to 6 decimal places for known values.
 *
 * DOM environment: happy-dom (vitest.config.ts). No React rendering required
 * for these pure-function tests.
 *
 * Known values were verified against scipy.stats.norm.pdf in Python:
 *   from scipy.stats import norm
 *   norm.pdf(0, 0, 1)    → 0.398942
 *   norm.pdf(1, 0, 1)    → 0.241971
 *   norm.pdf(-1, 0, 1)   → 0.241971  (symmetry)
 *   norm.pdf(0, 0, 2)    → 0.199471
 *   norm.pdf(2, 1, 0.5)  → 0.107982
 *   norm.pdf(100, 100, 15) → 0.026596
 */

import { normalPDF } from './NormalDistExplorer';

const PRECISION = 6; // decimal places

/** Round to N decimal places for comparison. */
function roundTo(value: number, decimals: number): number {
  return parseFloat(value.toFixed(decimals));
}

describe('normalPDF', () => {
  // ── Standard normal μ=0, σ=1 ─────────────────────────────────────────────

  describe('standard normal (μ=0, σ=1)', () => {
    it('returns the correct value at the mean x=0', () => {
      // Peak of N(0,1): 1/√(2π) ≈ 0.398942
      const result = roundTo(normalPDF(0, 0, 1), PRECISION);
      expect(result).toBe(0.398942);
    });

    it('returns the correct value at x=1 (one σ above mean)', () => {
      // N(0,1) at x=1: ≈ 0.241971
      const result = roundTo(normalPDF(1, 0, 1), PRECISION);
      expect(result).toBe(0.241971);
    });

    it('returns the correct value at x=-1 (one σ below mean)', () => {
      // Symmetric: should equal value at x=1
      const result = roundTo(normalPDF(-1, 0, 1), PRECISION);
      expect(result).toBe(0.241971);
    });

    it('returns the correct value at x=2 (two σ above mean)', () => {
      // N(0,1) at x=2: ≈ 0.053991
      const result = roundTo(normalPDF(2, 0, 1), PRECISION);
      expect(result).toBe(0.053991);
    });

    it('returns the correct value far in the tail at x=4', () => {
      // N(0,1) at x=4: ≈ 0.000134
      const result = roundTo(normalPDF(4, 0, 1), PRECISION);
      expect(result).toBe(0.000134);
    });
  });

  // ── Non-unit σ (σ=2) ─────────────────────────────────────────────────────

  describe('wider distribution (μ=0, σ=2)', () => {
    it('returns the correct peak value at x=0', () => {
      // Peak of N(0,2): 1/(2√(2π)) ≈ 0.199471
      const result = roundTo(normalPDF(0, 0, 2), PRECISION);
      expect(result).toBe(0.199471);
    });

    it('returns the correct value at x=2 (one σ above mean)', () => {
      // N(0,2) at x=2: ≈ 0.120985
      const result = roundTo(normalPDF(2, 0, 2), PRECISION);
      expect(result).toBe(0.120985);
    });
  });

  // ── Shifted mean (μ=1, σ=0.5) ────────────────────────────────────────────

  describe('shifted mean (μ=1, σ=0.5)', () => {
    it('returns the correct peak value at x=μ', () => {
      // Peak of N(1,0.5): 1/(0.5·√(2π)) ≈ 0.797885
      const result = roundTo(normalPDF(1, 1, 0.5), PRECISION);
      expect(result).toBe(0.797885);
    });

    it('returns the correct value at x=2 (two σ above mean)', () => {
      // N(1,0.5) at x=2: ≈ 0.107982
      const result = roundTo(normalPDF(2, 1, 0.5), PRECISION);
      expect(result).toBe(0.107982);
    });
  });

  // ── IQ-scale distribution (μ=100, σ=15) ─────────────────────────────────

  describe('IQ-scale distribution (μ=100, σ=15)', () => {
    it('returns the correct peak value at x=100', () => {
      // Peak of N(100,15): 1/(15·√(2π)) ≈ 0.026596
      const result = roundTo(normalPDF(100, 100, 15), PRECISION);
      expect(result).toBe(0.026596);
    });

    it('returns the correct value at x=115 (one σ above mean)', () => {
      // N(100,15) at x=115: computed by JS Math.exp, confirmed to 6dp
      const result = roundTo(normalPDF(115, 100, 15), PRECISION);
      expect(result).toBe(0.016131);
    });

    it('returns the correct value at x=85 (one σ below mean — symmetry)', () => {
      // Should equal value at x=115 by symmetry
      const result = roundTo(normalPDF(85, 100, 15), PRECISION);
      expect(result).toBe(0.016131);
    });
  });

  // ── Mathematical properties ───────────────────────────────────────────────

  describe('mathematical properties', () => {
    it('is always positive', () => {
      expect(normalPDF(0, 0, 1)).toBeGreaterThan(0);
      // x=5 is 5σ from mean — extremely small but representable as IEEE 754 double.
      // x=100, σ=1 would give exp(-5000) which underflows to 0 in JS.
      expect(normalPDF(5, 0, 1)).toBeGreaterThan(0);
      expect(normalPDF(-5, 0, 1)).toBeGreaterThan(0);
    });

    it('is symmetric about the mean', () => {
      const mu = 2;
      const sigma = 1.5;
      const delta = 3;
      expect(normalPDF(mu + delta, mu, sigma)).toBeCloseTo(
        normalPDF(mu - delta, mu, sigma),
        PRECISION,
      );
    });

    it('peaks at x=μ', () => {
      const mu = 1.5;
      const sigma = 0.7;
      const peak = normalPDF(mu, mu, sigma);
      expect(peak).toBeGreaterThan(normalPDF(mu + 0.01, mu, sigma));
      expect(peak).toBeGreaterThan(normalPDF(mu - 0.01, mu, sigma));
    });

    it('gives a smaller peak for larger σ (wider distribution)', () => {
      const narrow = normalPDF(0, 0, 0.5);
      const wide = normalPDF(0, 0, 2);
      expect(narrow).toBeGreaterThan(wide);
    });

    it('integrates to approximately 1 over a wide domain (numerical check)', () => {
      // Riemann sum approximation over [-8, 8] with 1600 intervals
      const mu = 0;
      const sigma = 1;
      const n = 1600;
      const a = -8;
      const b = 8;
      const dx = (b - a) / n;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const x = a + (i + 0.5) * dx;
        sum += normalPDF(x, mu, sigma) * dx;
      }
      expect(sum).toBeCloseTo(1, 4); // within 0.0001 of 1
    });
  });
});
