/**
 * PointCloudExplorer.data.test.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Unit tests for PointCloudExplorer distance functions and ε-ball query.
 * Pure calculation tests — no React rendering.
 *
 * Distance formula validation:
 *   Euclidean: d₂(a,b) = sqrt((Δx)² + (Δy)²)
 *   Manhattan: d₁(a,b) = |Δx| + |Δy|
 */

import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  manhattanDistance,
  getDistance,
  getEpsBallIndices,
  computeDistanceMatrix,
  POINT_CLOUD_PRESETS,
  DEFAULT_EPS,
  EPS_MIN,
  EPS_MAX,
} from './PointCloudExplorer.data';

// ─── euclideanDistance ────────────────────────────────────────────────────────

describe('euclideanDistance', () => {
  it('returns 0 for identical points', () => {
    expect(euclideanDistance({ x: 0.3, y: 0.7 }, { x: 0.3, y: 0.7 })).toBe(0);
  });

  it('computes 3-4-5 right triangle correctly', () => {
    // d = sqrt(3² + 4²) = 5
    expect(euclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5, 10);
  });

  it('is symmetric', () => {
    const a = { x: 0.1, y: 0.8 };
    const b = { x: 0.6, y: 0.2 };
    expect(euclideanDistance(a, b)).toBeCloseTo(euclideanDistance(b, a), 10);
  });

  it('is always non-negative', () => {
    expect(euclideanDistance({ x: 0.9, y: 0.1 }, { x: 0.0, y: 0.5 })).toBeGreaterThanOrEqual(0);
  });
});

// ─── manhattanDistance ────────────────────────────────────────────────────────

describe('manhattanDistance', () => {
  it('returns 0 for identical points', () => {
    expect(manhattanDistance({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })).toBe(0);
  });

  it('computes |Δx| + |Δy| correctly', () => {
    // |0.8 - 0.2| + |0.9 - 0.3| = 0.6 + 0.6 = 1.2
    expect(manhattanDistance({ x: 0.2, y: 0.3 }, { x: 0.8, y: 0.9 })).toBeCloseTo(1.2, 10);
  });

  it('is symmetric', () => {
    const a = { x: 0.1, y: 0.4 };
    const b = { x: 0.7, y: 0.2 };
    expect(manhattanDistance(a, b)).toBeCloseTo(manhattanDistance(b, a), 10);
  });

  it('is always non-negative', () => {
    expect(manhattanDistance({ x: 0.9, y: 0.1 }, { x: 0.0, y: 0.5 })).toBeGreaterThanOrEqual(0);
  });

  it('Manhattan ≥ Euclidean for same pair (L1 ≥ L2 in 2D)', () => {
    const a = { x: 0.1, y: 0.2 };
    const b = { x: 0.7, y: 0.9 };
    expect(manhattanDistance(a, b)).toBeGreaterThanOrEqual(euclideanDistance(a, b));
  });
});

// ─── getDistance dispatch ─────────────────────────────────────────────────────

describe('getDistance', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 3, y: 4 };

  it('dispatches to euclideanDistance when metric = "euclidean"', () => {
    expect(getDistance(a, b, 'euclidean')).toBeCloseTo(5, 10);
  });

  it('dispatches to manhattanDistance when metric = "manhattan"', () => {
    // |3 - 0| + |4 - 0| = 7
    expect(getDistance(a, b, 'manhattan')).toBeCloseTo(7, 10);
  });
});

// ─── getEpsBallIndices ────────────────────────────────────────────────────────

describe('getEpsBallIndices', () => {
  // Simple 4-point setup: origin + three others at known distances.
  const points = [
    { x: 0, y: 0 },   // index 0 — centre
    { x: 0.1, y: 0 }, // index 1 — distance 0.1 away
    { x: 0.3, y: 0 }, // index 2 — distance 0.3 away
    { x: 0.6, y: 0 }, // index 3 — distance 0.6 away
  ];

  it('includes only points strictly within ε (open ball)', () => {
    const inside = getEpsBallIndices(0, points, 0.2, 'euclidean');
    expect(inside).toContain(1);
    expect(inside).not.toContain(2);
    expect(inside).not.toContain(3);
  });

  it('excludes the centre point itself', () => {
    const inside = getEpsBallIndices(0, points, 0.9, 'euclidean');
    expect(inside).not.toContain(0);
  });

  it('returns empty array when ε is too small', () => {
    const inside = getEpsBallIndices(0, points, 0.01, 'euclidean');
    expect(inside).toHaveLength(0);
  });

  it('returns all other points when ε is large enough', () => {
    const inside = getEpsBallIndices(0, points, 1.0, 'euclidean');
    expect(inside).toHaveLength(3);
    expect(inside).toEqual([1, 2, 3]);
  });

  it('uses Manhattan metric correctly — ball is a diamond shape', () => {
    // Manhattan: point at (0.15, 0.15) has d₁ = 0.3 from origin.
    const pts = [
      { x: 0, y: 0 },
      { x: 0.15, y: 0.15 }, // d₁ = 0.30
    ];
    // With ε = 0.25: 0.30 ≥ 0.25 → point not in ball
    expect(getEpsBallIndices(0, pts, 0.25, 'manhattan')).toHaveLength(0);
    // With ε = 0.35: 0.30 < 0.35 → in ball
    expect(getEpsBallIndices(0, pts, 0.35, 'manhattan')).toContain(1);
  });

  it('Euclidean and Manhattan give different ball contents for the same ε', () => {
    // For a point at (0.2, 0.2): Euclidean d = sqrt(0.08) ≈ 0.283, Manhattan d = 0.4.
    // With ε = 0.35: Euclidean includes it but Manhattan does not.
    const pts = [
      { x: 0, y: 0 },
      { x: 0.2, y: 0.2 },
    ];
    const euclidInside = getEpsBallIndices(0, pts, 0.35, 'euclidean');
    const manhattanInside = getEpsBallIndices(0, pts, 0.35, 'manhattan');
    expect(euclidInside).toContain(1);
    expect(manhattanInside).not.toContain(1);
  });
});

// ─── computeDistanceMatrix ────────────────────────────────────────────────────

describe('computeDistanceMatrix', () => {
  const pts = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];

  it('produces an N×N matrix', () => {
    const m = computeDistanceMatrix(pts, 'euclidean');
    expect(m).toHaveLength(3);
    expect(m[0]).toHaveLength(3);
  });

  it('diagonal is zero', () => {
    const m = computeDistanceMatrix(pts, 'euclidean');
    for (let i = 0; i < pts.length; i++) {
      expect(m[i][i]).toBe(0);
    }
  });

  it('is symmetric', () => {
    const m = computeDistanceMatrix(pts, 'euclidean');
    for (let i = 0; i < pts.length; i++) {
      for (let j = 0; j < pts.length; j++) {
        expect(m[i][j]).toBeCloseTo(m[j][i], 10);
      }
    }
  });

  it('correct value: Euclidean distance (0,0)→(1,0) = 1', () => {
    const m = computeDistanceMatrix(pts, 'euclidean');
    expect(m[0][1]).toBeCloseTo(1, 10);
  });

  it('correct value: Euclidean distance (0,0)→(0,1) = 1', () => {
    const m = computeDistanceMatrix(pts, 'euclidean');
    expect(m[0][2]).toBeCloseTo(1, 10);
  });

  it('correct value: Euclidean distance (1,0)→(0,1) = sqrt(2) ≈ 1.414', () => {
    const m = computeDistanceMatrix(pts, 'euclidean');
    expect(m[1][2]).toBeCloseTo(Math.SQRT2, 5);
  });

  it('Manhattan matrix: (0,0)→(1,0) = 1 and (1,0)→(0,1) = 2', () => {
    const m = computeDistanceMatrix(pts, 'manhattan');
    expect(m[0][1]).toBeCloseTo(1, 10);
    expect(m[1][2]).toBeCloseTo(2, 10);
  });
});

// ─── Preset data integrity ────────────────────────────────────────────────────

describe('POINT_CLOUD_PRESETS', () => {
  it('has three presets', () => {
    expect(POINT_CLOUD_PRESETS).toHaveLength(3);
  });

  it('each preset has a non-empty points array', () => {
    for (const preset of POINT_CLOUD_PRESETS) {
      expect(preset.points.length).toBeGreaterThan(0);
    }
  });

  it('all point coordinates are within [0, 1]', () => {
    for (const preset of POINT_CLOUD_PRESETS) {
      for (const p of preset.points) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('DEFAULT_EPS is within [EPS_MIN, EPS_MAX]', () => {
    expect(DEFAULT_EPS).toBeGreaterThanOrEqual(EPS_MIN);
    expect(DEFAULT_EPS).toBeLessThanOrEqual(EPS_MAX);
  });
});
