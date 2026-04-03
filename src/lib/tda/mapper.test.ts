/**
 * mapper.test.ts — Task 5.2 — Agent_Interactive_Advanced
 *
 * Unit tests for the Mapper algorithm and filter functions.
 *
 * Test coverage:
 *   - computeMapper: cycle detection, disconnected components, single point, empty input
 *   - pcaFilter, densityFilter, eccentricityFilter: length contracts
 *
 * NOTE: No React components are rendered here — `afterEach(cleanup)` is NOT needed.
 */

import { describe, it, expect } from 'vitest';
import {
  computeMapper,
  pcaFilter,
  densityFilter,
  eccentricityFilter,
} from './mapper';
import type { Point2D } from './mapper';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build n evenly-spaced points on a unit circle. */
function circlePoints(n: number): Point2D[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return { x: Math.cos(angle), y: Math.sin(angle), id: `c${i}` };
  });
}

/**
 * Detect whether the undirected graph contains a cycle using DFS.
 * Returns true if any cycle is found.
 */
function hasCycle(
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>,
): boolean {
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const { source, target } of edges) {
    adj.get(source)?.push(target);
    adj.get(target)?.push(source);
  }

  const visited = new Set<string>();

  const dfs = (node: string, parent: string | null): boolean => {
    visited.add(node);
    for (const neighbour of adj.get(node) ?? []) {
      if (!visited.has(neighbour)) {
        if (dfs(neighbour, node)) return true;
      } else if (neighbour !== parent) {
        // Back-edge to a visited non-parent → cycle.
        return true;
      }
    }
    return false;
  };

  for (const id of nodeIds) {
    if (!visited.has(id) && dfs(id, null)) return true;
  }
  return false;
}

/**
 * Count connected components using BFS.
 */
function countComponents(
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>,
): number {
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const { source, target } of edges) {
    adj.get(source)?.push(target);
    adj.get(target)?.push(source);
  }

  const visited = new Set<string>();
  let components = 0;

  for (const id of nodeIds) {
    if (visited.has(id)) continue;
    components++;
    const queue = [id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      for (const n of adj.get(curr) ?? []) {
        if (!visited.has(n)) queue.push(n);
      }
    }
  }
  return components;
}

// ─── computeMapper ────────────────────────────────────────────────────────────

describe('computeMapper', () => {
  describe('cycle detection on unit circle', () => {
    it('pcaFilter + resolution=6 + overlap=0.5 produces a cycle', () => {
      // 16 evenly-spaced points on the unit circle.
      // PCA projects onto x-axis (covXX = covYY = 0.5, covXY = 0 by symmetry)
      // → filter values = cos(θ) ∈ [-1, 1].
      // With resolution=6 and overlap=0.5 each interval extends by 0.5*step,
      // giving 0.5-wide overlapping bins. clusterThreshold=0.5 keeps each
      // arc-segment as one cluster except the medial intervals which split
      // into upper/lower arcs → a 10-node 10-edge cycle.
      const pts = circlePoints(16);
      const filter = pcaFilter(pts);
      const graph = computeMapper(pts, filter, 6, 0.5, 0.5);

      expect(graph.nodes.length).toBeGreaterThan(1);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(hasCycle(graph.nodes.map((n) => n.id), graph.edges)).toBe(true);
    });
  });

  describe('two disconnected components on two-blob point cloud', () => {
    it('eccentricityFilter + low clusterThreshold → exactly 2 components', () => {
      // Two tight clusters at x=-1.5 and x=+1.5. Physical separation ≈ 3.
      // clusterThreshold=0.05 << 3, so A-points and B-points never merge
      // within a preimage interval. Each original data point is exclusively
      // from cluster A or cluster B, so no Mapper node can span both clusters
      // → zero cross-cluster edges → exactly 2 connected components.
      const clusterA: Point2D[] = Array.from({ length: 10 }, (_, i) => ({
        x: -1.5 + (i - 4.5) * 0.04,
        y: 0,
        id: `a${i}`,
      }));
      const clusterB: Point2D[] = Array.from({ length: 10 }, (_, i) => ({
        x: 1.5 + (i - 4.5) * 0.04,
        y: 0,
        id: `b${i}`,
      }));
      const pts = [...clusterA, ...clusterB];
      const filter = eccentricityFilter(pts);

      const graph = computeMapper(pts, filter, 6, 0.3, 0.05);

      expect(graph.nodes.length).toBeGreaterThan(0);
      const components = countComponents(
        graph.nodes.map((n) => n.id),
        graph.edges,
      );
      expect(components).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('single point → 1 node, 0 edges', () => {
      const pts: Point2D[] = [{ x: 0, y: 0, id: 'p0' }];
      const filter = pcaFilter(pts);
      const graph = computeMapper(pts, filter, 4, 0.5, 0.5);

      expect(graph.nodes).toHaveLength(1);
      expect(graph.edges).toHaveLength(0);
    });

    it('empty input → { nodes: [], edges: [] }', () => {
      const graph = computeMapper([], () => 0, 4, 0.5, 0.5);
      expect(graph.nodes).toHaveLength(0);
      expect(graph.edges).toHaveLength(0);
    });
  });
});

// ─── Filter functions: length contracts ──────────────────────────────────────

describe('filter functions — output length equals input length', () => {
  const pts: Point2D[] = circlePoints(8);

  it('pcaFilter returns one scalar per point', () => {
    const filter = pcaFilter(pts);
    const values = pts.map(filter);
    expect(values).toHaveLength(pts.length);
    // All values must be finite numbers.
    for (const v of values) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('densityFilter returns one scalar per point', () => {
    const filter = densityFilter(pts, 0.5);
    const values = pts.map(filter);
    expect(values).toHaveLength(pts.length);
    for (const v of values) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0); // KDE density is always positive.
    }
  });

  it('eccentricityFilter returns one scalar per point', () => {
    const filter = eccentricityFilter(pts);
    const values = pts.map(filter);
    expect(values).toHaveLength(pts.length);
    for (const v of values) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Filter function edge cases ───────────────────────────────────────────────

describe('filter functions — edge cases', () => {
  it('pcaFilter on empty array returns constant zero function', () => {
    const filter = pcaFilter([]);
    const pt: Point2D = { x: 1, y: 2, id: 'x' };
    expect(filter(pt)).toBe(0);
  });

  it('densityFilter on empty array returns constant zero function', () => {
    const filter = densityFilter([], 0.5);
    const pt: Point2D = { x: 1, y: 2, id: 'x' };
    expect(filter(pt)).toBe(0);
  });

  it('eccentricityFilter on single point returns 0 (no other points)', () => {
    const pt: Point2D = { x: 0, y: 0, id: 'p0' };
    const filter = eccentricityFilter([pt]);
    expect(filter(pt)).toBe(0);
  });

  it('pcaFilter on collinear points along y-axis projects correctly', () => {
    // Points along y-axis: (0, -1), (0, 0), (0, 1).
    // covXX = 0, covXY = 0, covYY > 0 → first PC = y-axis.
    const pts: Point2D[] = [
      { x: 0, y: -1, id: 'p0' },
      { x: 0, y: 0, id: 'p1' },
      { x: 0, y: 1, id: 'p2' },
    ];
    const filter = pcaFilter(pts);
    const values = pts.map(filter);
    // Values should be monotonically increasing (or decreasing, since sign of PC is arbitrary).
    const ascending =
      values[0] < values[1] && values[1] < values[2];
    const descending =
      values[0] > values[1] && values[1] > values[2];
    expect(ascending || descending).toBe(true);
  });
});
