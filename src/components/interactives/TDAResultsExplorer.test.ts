/**
 * TDAResultsExplorer.test.ts — Task 5.5b — Agent_Interactive_Advanced
 *
 * JSON schema validation tests for the four pre-computed TDA assets.
 * Tests the static data only — no React rendering, no afterEach(cleanup).
 *
 * Assertions per asset:
 *   - H0 has at least 1 feature
 *   - H1 is an array
 *   - All birth/death values are finite numbers
 *   - death >= birth for all features (no negative persistence)
 *   - epsilon_range[0] === 0
 *
 * Additional assertion for circle-20pts:
 *   - At least one H1 feature with persistence (death − birth) > 0.5
 *     (confirming the persistent loop is present)
 */

import { describe, it, expect } from 'vitest';
import type { TDAPreset, TDAFeature } from '@lib/tda/precomputedTypes';

import circleData from '@data/tda/circle-20pts.json';
import clustersData from '@data/tda/two-clusters-16pts.json';
import figureEightData from '@data/tda/figure-eight-11pts.json';
import randomData from '@data/tda/random-30pts.json';

// Cast all JSON imports to the typed schema
const PRESETS: Array<{ name: string; data: TDAPreset }> = [
  { name: 'circle-20pts', data: circleData as TDAPreset },
  { name: 'two-clusters-16pts', data: clustersData as TDAPreset },
  { name: 'figure-eight-11pts', data: figureEightData as TDAPreset },
  { name: 'random-30pts', data: randomData as TDAPreset },
];

// ─── Shared schema tests (run for every preset) ───────────────────────────────

describe.each(PRESETS)('$name — JSON schema validation', ({ data }) => {
  it('has a metadata object with n_points, max_dimension, and epsilon_range', () => {
    expect(data.metadata).toBeDefined();
    expect(typeof data.metadata.n_points).toBe('number');
    expect(data.metadata.max_dimension).toBe(1);
    expect(Array.isArray(data.metadata.epsilon_range)).toBe(true);
    expect(data.metadata.epsilon_range).toHaveLength(2);
  });

  it('epsilon_range starts at 0', () => {
    expect(data.metadata.epsilon_range[0]).toBe(0);
  });

  it('has a non-empty point_cloud array', () => {
    expect(Array.isArray(data.point_cloud)).toBe(true);
    expect(data.point_cloud.length).toBeGreaterThan(0);
  });

  it('point_cloud length matches metadata.n_points', () => {
    expect(data.point_cloud.length).toBe(data.metadata.n_points);
  });

  it('every point in point_cloud is a 2-element array of finite numbers', () => {
    for (const pt of data.point_cloud) {
      expect(pt).toHaveLength(2);
      expect(Number.isFinite(pt[0])).toBe(true);
      expect(Number.isFinite(pt[1])).toBe(true);
    }
  });

  it('H0 has at least 1 feature', () => {
    expect(Array.isArray(data.diagrams.H0)).toBe(true);
    expect(data.diagrams.H0.length).toBeGreaterThan(0);
  });

  it('H1 is an array', () => {
    expect(Array.isArray(data.diagrams.H1)).toBe(true);
  });

  it('all H0 birth and death values are finite numbers', () => {
    for (const f of data.diagrams.H0 as TDAFeature[]) {
      expect(Number.isFinite(f.birth)).toBe(true);
      expect(Number.isFinite(f.death)).toBe(true);
    }
  });

  it('all H1 birth and death values are finite numbers', () => {
    for (const f of data.diagrams.H1 as TDAFeature[]) {
      expect(Number.isFinite(f.birth)).toBe(true);
      expect(Number.isFinite(f.death)).toBe(true);
    }
  });

  it('death >= birth for all H0 features (no negative persistence)', () => {
    for (const f of data.diagrams.H0 as TDAFeature[]) {
      expect(f.death).toBeGreaterThanOrEqual(f.birth);
    }
  });

  it('death >= birth for all H1 features (no negative persistence)', () => {
    for (const f of data.diagrams.H1 as TDAFeature[]) {
      expect(f.death).toBeGreaterThanOrEqual(f.birth);
    }
  });
});

// ─── circle-20pts: confirm persistent H₁ loop ─────────────────────────────────

describe('circle-20pts — topological assertions', () => {
  const data = circleData as TDAPreset;

  it('has at least one H1 feature with persistence (death − birth) > 0.5', () => {
    const persistentLoops = data.diagrams.H1.filter(
      (f: TDAFeature) => f.death - f.birth > 0.5,
    );
    expect(persistentLoops.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── figure-eight-11pts: confirm two H₁ loops ────────────────────────────────

describe('figure-eight-11pts — topological assertions', () => {
  const data = figureEightData as TDAPreset;

  it('has exactly 2 H1 features (two loops — one per lobe)', () => {
    expect(data.diagrams.H1.length).toBe(2);
  });
});

// ─── two-clusters-16pts: confirm long-lived H₀ feature (inter-cluster gap) ───

describe('two-clusters-16pts — topological assertions', () => {
  const data = clustersData as TDAPreset;

  it('has a long-lived H0 feature with persistence > 1.0 (inter-cluster gap)', () => {
    const longLived = data.diagrams.H0.filter(
      (f: TDAFeature) => f.death - f.birth > 1.0,
    );
    expect(longLived.length).toBeGreaterThanOrEqual(1);
  });
});
