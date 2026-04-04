/**
 * bettiNumbers.test.ts — Task 5.3 — Agent_Interactive_Advanced
 *
 * Unit tests for computeBettiNumbers().
 * These are pure TypeScript tests — no React rendering, so no cleanup needed.
 */

import { describe, it, expect } from 'vitest';
import { computeBettiNumbers } from './bettiNumbers';
import type { Simplex } from './vietorisRips';

// ---------------------------------------------------------------------------
// Helpers to build minimal Simplex arrays
// ---------------------------------------------------------------------------

function vertex(id: string): Simplex {
  return { vertices: [id], dimension: 0 };
}

function edge(a: string, b: string): Simplex {
  return { vertices: [a, b], dimension: 1 };
}

function triangle(a: string, b: string, c: string): Simplex {
  return { vertices: [a, b, c], dimension: 2 };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeBettiNumbers', () => {
  it('empty complex → β₀=0, β₁=0, β₂=0', () => {
    const result = computeBettiNumbers([]);
    expect(result).toEqual({ beta0: 0, beta1: 0, beta2: 0 });
  });

  it('3 isolated vertices, no edges → β₀=3, β₁=0, β₂=0', () => {
    const complex: Simplex[] = [vertex('a'), vertex('b'), vertex('c')];
    const result = computeBettiNumbers(complex);
    expect(result).toEqual({ beta0: 3, beta1: 0, beta2: 0 });
  });

  it('filled triangle (3 vertices, 3 edges, 1 triangle) → β₀=1, β₁=0, β₂=0', () => {
    // All three pairs connected and triangle filled → no loops
    const complex: Simplex[] = [
      vertex('a'), vertex('b'), vertex('c'),
      edge('a', 'b'), edge('a', 'c'), edge('b', 'c'),
      triangle('a', 'b', 'c'),
    ];
    const result = computeBettiNumbers(complex);
    expect(result).toEqual({ beta0: 1, beta1: 0, beta2: 0 });
  });

  it('square loop (4 vertices, 4 edges, 0 triangles) → β₀=1, β₁=1, β₂=0', () => {
    // A square: v0-v1-v2-v3-v0, no diagonal, no fill → one loop
    const complex: Simplex[] = [
      vertex('v0'), vertex('v1'), vertex('v2'), vertex('v3'),
      edge('v0', 'v1'), edge('v1', 'v2'), edge('v2', 'v3'), edge('v3', 'v0'),
    ];
    const result = computeBettiNumbers(complex);
    expect(result).toEqual({ beta0: 1, beta1: 1, beta2: 0 });
  });
});
