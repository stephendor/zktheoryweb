/**
 * HomologyEditor.data.test.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Unit tests for the Homology Editor data module.
 * Tests: rankGF2, computeHomology, preset data integrity.
 *
 * Key formulas under test:
 *   β₀ = connected components (Union-Find)
 *   β₁ = (E - V + β₀) - rank_GF2(∂₂)
 */

import { afterEach, describe, it, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import {
  rankGF2,
  computeHomology,
  edgeKey,
  triangleKey,
  HOMOLOGY_PRESETS,
  DEFAULT_HOMOLOGY_PRESET_ID,
} from './HomologyEditor.data';
import type { HVertex, HEdge, HTriangle } from './HomologyEditor.data';

afterEach(cleanup);

// ─── rankGF2 ─────────────────────────────────────────────────────────────────

describe('rankGF2', () => {
  it('returns 0 for an empty matrix', () => {
    expect(rankGF2([])).toBe(0);
  });

  it('returns 0 for a zero matrix', () => {
    expect(rankGF2([[0, 0], [0, 0]])).toBe(0);
  });

  it('returns 1 for a single [1] entry', () => {
    expect(rankGF2([[1]])).toBe(1);
  });

  it('computes rank of identity matrix as its dimension', () => {
    const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    expect(rankGF2(I3)).toBe(3);
  });

  it('ranks over GF(2): [1,1] + [1,1] cancels to zero → rank 1', () => {
    // Two identical rows → rank 1 (not 2)
    expect(rankGF2([[1, 1], [1, 1]])).toBe(1);
  });

  it('ranks over GF(2): XOR correctly: [[1,0],[1,1]] has rank 2', () => {
    expect(rankGF2([[1, 0], [1, 1]])).toBe(2);
  });

  it('ranks a 3×2 matrix with a dependent column correctly', () => {
    // col 2 = col 0 XOR col 1 → rank 2 (not 3)
    expect(rankGF2([[1, 0, 1], [0, 1, 1], [1, 1, 0]])).toBe(2);
  });

  it('does not mutate the input matrix', () => {
    const mat = [[1, 0], [1, 1]];
    const copy = mat.map((r) => [...r]);
    rankGF2(mat);
    expect(mat).toEqual(copy);
  });
});

// ─── edgeKey and triangleKey ──────────────────────────────────────────────────

describe('edgeKey', () => {
  it('produces the same key regardless of vertex order', () => {
    expect(edgeKey(0, 3)).toBe(edgeKey(3, 0));
  });

  it('smaller index is first', () => {
    expect(edgeKey(5, 2)).toBe('2-5');
  });
});

describe('triangleKey', () => {
  it('produces the same key for any permutation of vertices', () => {
    const k = triangleKey(1, 3, 2);
    expect(k).toBe(triangleKey(3, 1, 2));
    expect(k).toBe(triangleKey(2, 3, 1));
  });

  it('smallest index is first', () => {
    expect(triangleKey(5, 2, 3)).toBe('2-3-5');
  });
});

// ─── computeHomology ─────────────────────────────────────────────────────────

// Helper factories
function v(id: number): HVertex { return { id, x: 0, y: 0 }; }
function e(a: number, b: number): HEdge {
  const k = edgeKey(a, b);
  return { key: k, v0: Math.min(a, b), v1: Math.max(a, b) };
}
function t(a: number, b: number, c: number): HTriangle {
  const sorted = [a, b, c].sort((x, y) => x - y);
  return { key: sorted.join('-'), v0: sorted[0], v1: sorted[1], v2: sorted[2] };
}

describe('computeHomology — basic cases', () => {
  it('empty complex: β₀=0, β₁=0', () => {
    const result = computeHomology([], new Set(), new Set(), [], []);
    expect(result).toEqual({ beta0: 0, beta1: 0 });
  });

  it('single isolated vertex: β₀=1, β₁=0', () => {
    const result = computeHomology(
      [v(0)], new Set(), new Set(), [], [],
    );
    expect(result).toEqual({ beta0: 1, beta1: 0 });
  });

  it('two isolated vertices: β₀=2, β₁=0', () => {
    const result = computeHomology(
      [v(0), v(1)], new Set(), new Set(), [], [],
    );
    expect(result).toEqual({ beta0: 2, beta1: 0 });
  });

  it('two vertices connected by edge: β₀=1, β₁=0', () => {
    const edge = e(0, 1);
    const result = computeHomology(
      [v(0), v(1)],
      new Set([edge.key]),
      new Set(),
      [edge],
      [],
    );
    expect(result).toEqual({ beta0: 1, beta1: 0 });
  });
});

describe('computeHomology — triangle preset', () => {
  const vertices = [v(0), v(1), v(2)];
  const edges = [e(0, 1), e(0, 2), e(1, 2)];
  const triangles = [t(0, 1, 2)];
  const allEdgeKeys = new Set(edges.map((x) => x.key));
  const noTriKeys: Set<string> = new Set();

  it('3 edges, no triangle: β₀=1, β₁=1', () => {
    const result = computeHomology(vertices, allEdgeKeys, noTriKeys, edges, triangles);
    expect(result).toEqual({ beta0: 1, beta1: 1 });
  });

  it('3 edges + 1 triangle: β₀=1, β₁=0 (loop filled)', () => {
    const allTriKeys = new Set([triangles[0].key]);
    const result = computeHomology(vertices, allEdgeKeys, allTriKeys, edges, triangles);
    expect(result).toEqual({ beta0: 1, beta1: 0 });
  });

  it('2 edges (path), no triangle: β₀=1, β₁=0', () => {
    const twoEdgeKeys = new Set([edges[0].key, edges[1].key]);
    const result = computeHomology(vertices, twoEdgeKeys, noTriKeys, edges, triangles);
    expect(result).toEqual({ beta0: 1, beta1: 0 });
  });

  it('single edge only, vertex 2 isolated: β₀=2', () => {
    // Only edge (0,1) → vertex 2 is isolated → two components
    const oneEdgeKeys = new Set([edges[0].key]);
    const result = computeHomology(vertices, oneEdgeKeys, noTriKeys, edges, triangles);
    expect(result.beta0).toBe(2);
  });
});

describe('computeHomology — torus skeleton preset', () => {
  // 4-vertex diamond: edges (0,1),(0,2),(1,3),(2,3),(1,2)
  // 2 triangles: (0,1,2) upper, (1,2,3) lower
  const vertices = [v(0), v(1), v(2), v(3)];
  const edges = [e(0, 1), e(0, 2), e(1, 3), e(2, 3), e(1, 2)];
  const triangles = [t(0, 1, 2), t(1, 2, 3)];
  const allEdgeKeys = new Set(edges.map((x) => x.key));
  const noTriKeys: Set<string> = new Set();

  it('all 5 edges, no triangles: β₀=1, β₁=2', () => {
    const result = computeHomology(vertices, allEdgeKeys, noTriKeys, edges, triangles);
    expect(result).toEqual({ beta0: 1, beta1: 2 });
  });

  it('fill upper triangle: β₀=1, β₁=1', () => {
    const oneTriKeys = new Set([triangles[0].key]);
    const result = computeHomology(vertices, allEdgeKeys, oneTriKeys, edges, triangles);
    expect(result).toEqual({ beta0: 1, beta1: 1 });
  });

  it('fill both triangles: β₀=1, β₁=0', () => {
    const allTriKeys = new Set(triangles.map((x) => x.key));
    const result = computeHomology(vertices, allEdgeKeys, allTriKeys, edges, triangles);
    expect(result).toEqual({ beta0: 1, beta1: 0 });
  });
});

describe('computeHomology — GF(2) rank correctness', () => {
  // Test specifically that the GF(2) rank is correct: two triangles that
  // together form a "closed surface" should be detected as a 2-cycle.
  // Using 4 vertices forming a square split into two triangles:
  // V={0,1,2,3}, E={(0,1),(1,2),(2,3),(0,3),(0,2)}, T={(0,1,2),(0,2,3)}
  const vertices = [v(0), v(1), v(2), v(3)];
  const edges = [e(0, 1), e(1, 2), e(2, 3), e(0, 3), e(0, 2)];
  const triangles = [t(0, 1, 2), t(0, 2, 3)];
  const allEdgeKeys = new Set(edges.map((x) => x.key));

  it('all 5 edges, no triangles: β₁ = 5 - 4 + 1 = 2', () => {
    const result = computeHomology(vertices, allEdgeKeys, new Set(), edges, triangles);
    expect(result.beta1).toBe(2);
  });

  it('fill one triangle: β₁ = 2 - 1 = 1', () => {
    const result = computeHomology(
      vertices, allEdgeKeys, new Set([triangles[0].key]), edges, triangles,
    );
    expect(result.beta1).toBe(1);
  });

  it('fill both triangles: β₁ = 0 (disk, no loops remaining)', () => {
    const allTriKeys = new Set(triangles.map((x) => x.key));
    const result = computeHomology(vertices, allEdgeKeys, allTriKeys, edges, triangles);
    expect(result.beta1).toBe(0);
  });
});

// ─── Preset data integrity ────────────────────────────────────────────────────

describe('HOMOLOGY_PRESETS', () => {
  it('has three presets', () => {
    expect(HOMOLOGY_PRESETS).toHaveLength(3);
  });

  it('each preset has a non-empty vertex list', () => {
    for (const p of HOMOLOGY_PRESETS) {
      expect(p.vertices.length).toBeGreaterThan(0);
    }
  });

  it('vertex coordinates are in [0,1]', () => {
    for (const p of HOMOLOGY_PRESETS) {
      for (const vert of p.vertices) {
        expect(vert.x).toBeGreaterThanOrEqual(0);
        expect(vert.x).toBeLessThanOrEqual(1);
        expect(vert.y).toBeGreaterThanOrEqual(0);
        expect(vert.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('triangle preset has β₀=1, β₁=1 in initial state', () => {
    const p = HOMOLOGY_PRESETS.find((x) => x.id === 'triangle')!;
    const result = computeHomology(
      p.vertices,
      p.initialEdgeKeys,
      p.initialTriangleKeys,
      p.possibleEdges,
      p.possibleTriangles,
    );
    expect(result).toEqual({ beta0: 1, beta1: 1 });
  });

  it('torus-skeleton preset has β₀=1, β₁=2 in initial state', () => {
    const p = HOMOLOGY_PRESETS.find((x) => x.id === 'torus-skeleton')!;
    const result = computeHomology(
      p.vertices,
      p.initialEdgeKeys,
      p.initialTriangleKeys,
      p.possibleEdges,
      p.possibleTriangles,
    );
    expect(result).toEqual({ beta0: 1, beta1: 2 });
  });

  it('DEFAULT_HOMOLOGY_PRESET_ID matches a preset id', () => {
    expect(HOMOLOGY_PRESETS.some((p) => p.id === DEFAULT_HOMOLOGY_PRESET_ID)).toBe(true);
  });
});
