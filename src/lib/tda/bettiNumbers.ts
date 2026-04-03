/**
 * bettiNumbers.ts — Task 5.3 — Agent_Interactive_Advanced
 *
 * Computes Betti numbers (β₀, β₁, β₂) from a simplicial complex returned
 * by buildComplex() from vietorisRips.ts.
 *
 * β₀ = number of connected components (Union-Find over vertices and edges)
 * β₁ = E − V + β₀ − T  (simplicial Euler characteristic formula)
 *        where E = edge count, V = vertex count, T = triangle count
 * β₂ = 0  (always 0 for 2D Vietoris-Rips complexes; included for extensibility)
 */

import type { Simplex } from './vietorisRips';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BettiNumbers {
  beta0: number;
  beta1: number;
  beta2: number;
}

// ---------------------------------------------------------------------------
// Internal Union-Find (minimal implementation for β₀ computation)
// ---------------------------------------------------------------------------

class UnionFind {
  private parent = new Map<string, string>();

  add(id: string): void {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
    }
  }

  find(id: string): string {
    let root = id;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let cur = id;
    while (cur !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent.set(rb, ra);
    }
  }

  componentCount(): number {
    const roots = new Set<string>();
    for (const [id] of this.parent) {
      roots.add(this.find(id));
    }
    return roots.size;
  }
}

// ---------------------------------------------------------------------------
// computeBettiNumbers
// ---------------------------------------------------------------------------

/**
 * Compute Betti numbers for a simplicial complex (the flat Simplex[] array
 * returned by buildComplex).
 *
 * @param complex - Array of Simplex objects as returned by buildComplex()
 * @returns BettiNumbers { beta0, beta1, beta2 }
 */
export function computeBettiNumbers(complex: Simplex[]): BettiNumbers {
  const vertices = complex.filter((s) => s.dimension === 0);
  const edges = complex.filter((s) => s.dimension === 1);
  const triangles = complex.filter((s) => s.dimension === 2);

  // Empty complex
  if (vertices.length === 0) {
    return { beta0: 0, beta1: 0, beta2: 0 };
  }

  // β₀: connected components via Union-Find
  const uf = new UnionFind();
  for (const v of vertices) {
    uf.add(v.vertices[0]);
  }
  for (const e of edges) {
    uf.union(e.vertices[0], e.vertices[1]);
  }
  const beta0 = uf.componentCount();

  // β₁ = E − V + β₀ − T  (Euler characteristic for 2-complexes: χ = V − E + T → β₀ − β₁ = χ)
  const beta1 = Math.max(0, edges.length - vertices.length + beta0 - triangles.length);

  return { beta0, beta1, beta2: 0 };
}
