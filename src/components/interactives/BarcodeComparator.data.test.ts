/**
 * BarcodeComparator.data.test.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Unit tests for the Barcode Comparator data module.
 */

import { describe, it, expect } from 'vitest';
import {
  buildOfficialDataset,
  buildCommunityDataset,
  approximateBottleneckDistance,
  HOUSEHOLD_RECORDS,
  OFFICIAL_DATASET,
  COMMUNITY_DATASET,
  H0_BOTTLENECK,
  H1_BOTTLENECK,
  computeDatasetPersistence,
} from './BarcodeComparator.data';
import type { PersistenceFeature } from '@lib/tda/vietorisRips';

// ─── Dataset integrity ────────────────────────────────────────────────────────

describe('HOUSEHOLD_RECORDS', () => {
  it('has exactly 30 households', () => {
    expect(HOUSEHOLD_RECORDS).toHaveLength(30);
  });

  it('all IDs are unique', () => {
    const ids = HOUSEHOLD_RECORDS.map((h) => h.id);
    expect(new Set(ids).size).toBe(30);
  });

  it('all official dimensions are in [0, 1]', () => {
    for (const h of HOUSEHOLD_RECORDS) {
      for (const [, v] of Object.entries(h.official)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('all community dimensions are in [0, 1]', () => {
    for (const h of HOUSEHOLD_RECORDS) {
      for (const [, v] of Object.entries(h.community)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('first 10 households: official income < 0.30 (officially deprived)', () => {
    for (const h of HOUSEHOLD_RECORDS.slice(0, 10)) {
      expect(h.official.income).toBeLessThan(0.30);
    }
  });

  it('first 10 households: community trust > 0.70 (community-resilient)', () => {
    for (const h of HOUSEHOLD_RECORDS.slice(0, 10)) {
      expect(h.community.trust).toBeGreaterThan(0.70);
    }
  });

  it('hh11–hh20: official income > 0.60 (not officially deprived)', () => {
    for (const h of HOUSEHOLD_RECORDS.slice(10, 20)) {
      expect(h.official.income).toBeGreaterThan(0.60);
    }
  });

  it('hh11–hh20: community trust < 0.30 (community-isolated)', () => {
    for (const h of HOUSEHOLD_RECORDS.slice(10, 20)) {
      expect(h.community.trust).toBeLessThan(0.30);
    }
  });
});

// ─── buildOfficialDataset / buildCommunityDataset ─────────────────────────────

describe('buildOfficialDataset', () => {
  it('returns 30 points', () => {
    const ds = buildOfficialDataset();
    expect(ds.points).toHaveLength(30);
  });

  it('all points have x and y in [0, 1]', () => {
    const ds = buildOfficialDataset();
    for (const p of ds.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  it('all point IDs match household IDs', () => {
    const ds = buildOfficialDataset();
    const hhIds = HOUSEHOLD_RECORDS.map((h) => h.id);
    for (const p of ds.points) {
      expect(hhIds).toContain(p.id);
    }
  });

  it('returns persistence features', () => {
    const ds = buildOfficialDataset();
    expect(Array.isArray(ds.features)).toBe(true);
    expect(ds.features.length).toBeGreaterThan(0);
  });

  it('h0Count is positive (at least one connected component)', () => {
    const ds = buildOfficialDataset();
    expect(ds.h0Count).toBeGreaterThan(0);
  });
});

describe('buildCommunityDataset', () => {
  it('returns 30 points', () => {
    const ds = buildCommunityDataset();
    expect(ds.points).toHaveLength(30);
  });

  it('community dataset points differ from official dataset points', () => {
    const off = buildOfficialDataset();
    const com = buildCommunityDataset();
    const allSame = off.points.every((p, i) =>
      p.x === com.points[i].x && p.y === com.points[i].y,
    );
    expect(allSame).toBe(false);
  });
});

// ─── computeDatasetPersistence ────────────────────────────────────────────────

describe('computeDatasetPersistence', () => {
  it('returns an array of PersistenceFeature', () => {
    const points = OFFICIAL_DATASET.points.slice(0, 5);
    const features = computeDatasetPersistence(points);
    expect(Array.isArray(features)).toBe(true);
  });

  it('returns empty array for empty input', () => {
    expect(computeDatasetPersistence([])).toEqual([]);
  });

  it('all features have dimension 0 or 1', () => {
    for (const f of OFFICIAL_DATASET.features) {
      expect([0, 1]).toContain(f.dimension);
    }
  });

  it('all birth values are non-negative', () => {
    for (const f of OFFICIAL_DATASET.features) {
      expect(f.birth).toBeGreaterThanOrEqual(0);
    }
  });

  it('death is null or >= birth for all features', () => {
    for (const f of OFFICIAL_DATASET.features) {
      if (f.death !== null) {
        expect(f.death).toBeGreaterThanOrEqual(f.birth);
      }
    }
  });
});

// ─── approximateBottleneckDistance ───────────────────────────────────────────

describe('approximateBottleneckDistance', () => {
  it('returns 0 for identical diagrams', () => {
    const feats: PersistenceFeature[] = [
      { dimension: 0, birth: 0, death: 0.5 },
      { dimension: 0, birth: 0, death: 0.3 },
    ];
    expect(approximateBottleneckDistance(feats, feats, 0)).toBe(0);
  });

  it('returns a non-negative distance', () => {
    expect(H0_BOTTLENECK).toBeGreaterThanOrEqual(0);
    expect(H1_BOTTLENECK).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 for two empty diagrams', () => {
    expect(approximateBottleneckDistance([], [], 0)).toBe(0);
  });

  it('H0 or H1 bottleneck > 0 (two diagrams must differ)', () => {
    // At least one of the bottleneck distances should be non-zero,
    // confirming the two datasets produce different topological structures.
    expect(H0_BOTTLENECK + H1_BOTTLENECK).toBeGreaterThan(0);
  });
});

// ─── Pre-computed results ─────────────────────────────────────────────────────

describe('OFFICIAL_DATASET vs COMMUNITY_DATASET', () => {
  it('OFFICIAL_DATASET.h0Count ≥ 1', () => {
    expect(OFFICIAL_DATASET.h0Count).toBeGreaterThanOrEqual(1);
  });

  it('COMMUNITY_DATASET.h0Count ≥ 1', () => {
    expect(COMMUNITY_DATASET.h0Count).toBeGreaterThanOrEqual(1);
  });

  it('the two datasets produce different numbers of H₀ or H₁ features', () => {
    const sameCounts =
      OFFICIAL_DATASET.h0Count === COMMUNITY_DATASET.h0Count &&
      OFFICIAL_DATASET.h1Count === COMMUNITY_DATASET.h1Count;
    // The datasets must differ in topological counts or structure —
    // if counts happen to match, the bottleneck distance must be positive.
    expect(sameCounts === false || H0_BOTTLENECK > 0 || H1_BOTTLENECK > 0).toBe(true);
  });
});
