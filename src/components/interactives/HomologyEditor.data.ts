/**
 * HomologyEditor.data.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Data types, preset simplicial complexes, and Betti number computation
 * for the Simplex/Homology Editor interactive.
 *
 * Homology is computed over GF(2) (Z/2Z) — the standard field for
 * computational TDA. This means:
 *   - Coefficients are 0 or 1 (every simplex is either present or absent)
 *   - Addition is mod 2 (two cancels to zero)
 *
 * Betti numbers:
 *   β₀ = number of connected components (Union-Find over active V and E)
 *   β₁ = dim(ker(∂₁)) − rank(∂₂)
 *      = (|E_active| − |V| + β₀) − rank_GF2(∂₂_matrix)
 *
 * Using rank(∂₂) via Gaussian elimination over GF(2) is essential:
 * the simpler formula β₁ = E − V + β₀ − T (used for VR complexes in the
 * existing bettiNumbers.ts library) **fails** when triangles form a Z₂
 * 2-cycle (e.g., an annular region). Full GF(2) elimination gives the
 * correct answer in all cases.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A vertex with fixed position in [0,1]². */
export interface HVertex {
  id: number;
  x: number;
  y: number;
  label?: string;
}

/** A directed edge (v0 < v1 by convention). */
export interface HEdge {
  /** Canonical key string: "v0-v1" with v0 < v1. */
  key: string;
  v0: number;
  v1: number;
}

/** A directed triangle (v0 < v1 < v2 by convention). */
export interface HTriangle {
  /** Canonical key string: "v0-v1-v2". */
  key: string;
  v0: number;
  v1: number;
  v2: number;
}

export interface BettiResult {
  beta0: number;
  beta1: number;
}

/** A named preset simplicial complex. */
export interface HomologyPreset {
  id: string;
  label: string;
  description: string;
  vertices: HVertex[];
  possibleEdges: HEdge[];
  possibleTriangles: HTriangle[];
  initialEdgeKeys: Set<string>;
  initialTriangleKeys: Set<string>;
}

// ─── Canonical key helpers ─────────────────────────────────────────────────────

/** Build a canonical edge key (smaller index first). */
export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/** Build a canonical triangle key (sorted indices). */
export function triangleKey(a: number, b: number, c: number): string {
  const sorted = [a, b, c].sort((x, y) => x - y);
  return sorted.join('-');
}

// ─── Union-Find (for β₀) ──────────────────────────────────────────────────────

class UnionFind {
  private parent: Map<number, number>;

  constructor(ids: number[]) {
    this.parent = new Map(ids.map((id) => [id, id]));
  }

  find(id: number): number {
    let root = id;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    let cur = id;
    while (cur !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }

  componentCount(): number {
    const roots = new Set<number>();
    for (const [id] of this.parent) roots.add(this.find(id));
    return roots.size;
  }
}

// ─── Gaussian elimination over GF(2) ─────────────────────────────────────────

/**
 * Compute the rank of an M×N matrix over GF(2) via row reduction.
 * The matrix is passed as a flat row-major array of 0s and 1s.
 *
 * @param matrix - Array of M rows, each of length N (elements 0 or 1).
 * @returns The rank of the matrix over GF(2).
 */
export function rankGF2(matrix: number[][]): number {
  if (matrix.length === 0 || matrix[0].length === 0) return 0;

  // Deep-copy to avoid mutating input
  const m = matrix.map((row) => [...row]);
  const rows = m.length;
  const cols = m[0].length;
  let rank = 0;
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    // Find a row with a 1 in this column
    let found = -1;
    for (let row = pivotRow; row < rows; row++) {
      if (m[row][col] === 1) {
        found = row;
        break;
      }
    }
    if (found === -1) continue;

    // Swap this row to pivotRow position
    [m[pivotRow], m[found]] = [m[found], m[pivotRow]];

    // Eliminate all other rows that have a 1 in this column
    for (let row = 0; row < rows; row++) {
      if (row !== pivotRow && m[row][col] === 1) {
        for (let c = 0; c < cols; c++) {
          m[row][c] = (m[row][c] + m[pivotRow][c]) % 2;
        }
      }
    }

    rank++;
    pivotRow++;
  }

  return rank;
}

// ─── Betti number computation ─────────────────────────────────────────────────

/**
 * Compute β₀ and β₁ for a simplicial complex defined by the given active
 * edges and active triangles, over the fixed vertex set.
 *
 * Uses GF(2) Gaussian elimination for rank(∂₂), ensuring correctness even
 * when triangles form 2-cycles (e.g., annular regions).
 *
 * @param vertices         - Full vertex set (all vertices, including isolated ones).
 * @param activeEdgeKeys   - Keys of currently active edges.
 * @param activeTriangleKeys - Keys of currently active triangles.
 * @param allEdges         - All possible edges (needed to build ∂₂ indexing).
 * @param allTriangles     - All possible triangles (needed for ∂₂).
 */
export function computeHomology(
  vertices: HVertex[],
  activeEdgeKeys: Set<string>,
  activeTriangleKeys: Set<string>,
  allEdges: HEdge[],
  allTriangles: HTriangle[],
): BettiResult {
  const V = vertices.length;
  if (V === 0) return { beta0: 0, beta1: 0 };

  // Active subsets
  const activeEdges = allEdges.filter((e) => activeEdgeKeys.has(e.key));
  const activeTriangles = allTriangles.filter((t) => activeTriangleKeys.has(t.key));
  const E = activeEdges.length;
  const T = activeTriangles.length;

  // β₀: Union-Find over all vertices, connected by active edges
  const uf = new UnionFind(vertices.map((v) => v.id));
  for (const e of activeEdges) {
    uf.union(e.v0, e.v1);
  }
  const beta0 = uf.componentCount();

  if (E === 0) {
    // No edges: β₁ = 0 (no cycles possible)
    return { beta0, beta1: 0 };
  }

  // rank(∂₂): boundary matrix of active triangles against active edges.
  // Each row = one active edge, each column = one active triangle.
  // B[i][j] = 1 if active edge i is in the boundary of active triangle j.
  if (T === 0) {
    // No triangles: rank(∂₂) = 0
    const beta1 = Math.max(0, E - V + beta0);
    return { beta0, beta1 };
  }

  // Build edge index for active edges
  const edgeIndex = new Map<string, number>();
  activeEdges.forEach((e, i) => edgeIndex.set(e.key, i));

  // Build boundary matrix rows (indexed by active edge) × cols (indexed by active triangle)
  const bmat: number[][] = Array.from({ length: E }, () => new Array(T).fill(0));

  for (let j = 0; j < T; j++) {
    const t = activeTriangles[j];
    // Boundary of triangle (v0,v1,v2) = edge(v0,v1) + edge(v1,v2) + edge(v0,v2)
    const boundaryEdges = [
      edgeKey(t.v0, t.v1),
      edgeKey(t.v1, t.v2),
      edgeKey(t.v0, t.v2),
    ];
    for (const ek of boundaryEdges) {
      const idx = edgeIndex.get(ek);
      if (idx !== undefined) {
        bmat[idx][j] = 1;
      }
      // If the boundary edge is not active, it doesn't appear in our active edge index.
      // This is geometrically valid (the triangle's boundary edge may not be in the complex),
      // but topologically unusual — we allow it (no constraint on "closure").
    }
  }

  const rank2 = rankGF2(bmat);
  const beta1 = Math.max(0, E - V + beta0 - rank2);

  return { beta0, beta1 };
}

// ─── Preset helpers ───────────────────────────────────────────────────────────

function makeEdge(a: number, b: number): HEdge {
  const k = edgeKey(a, b);
  return { key: k, v0: Math.min(a, b), v1: Math.max(a, b) };
}

function makeTriangle(a: number, b: number, c: number): HTriangle {
  const sorted = [a, b, c].sort((x, y) => x - y);
  const k = sorted.join('-');
  return { key: k, v0: sorted[0], v1: sorted[1], v2: sorted[2] };
}

// ─── Preset 1: Triangle ───────────────────────────────────────────────────────
// 3 vertices, 3 possible edges, 1 possible triangle.
// Initial: 3 edges active, no triangle → β₀=1, β₁=1.
// Add the triangle → β₁=0.

const TRI_V: HVertex[] = [
  { id: 0, x: 0.25, y: 0.78, label: 'A' },
  { id: 1, x: 0.75, y: 0.78, label: 'B' },
  { id: 2, x: 0.50, y: 0.22, label: 'C' },
];
const TRI_E = [makeEdge(0, 1), makeEdge(0, 2), makeEdge(1, 2)];
const TRI_T = [makeTriangle(0, 1, 2)];

// ─── Preset 2: Torus skeleton ─────────────────────────────────────────────────
// 4 vertices in a diamond, 5 edges forming two triangular loops sharing an edge.
// β₁ = 5 − 4 + 1 = 2 with no triangles.
// Fill triangle (0,1,3) → β₁=1; fill (1,2,3) also → β₁=0.
// β₁=2 represents the two independent generators of H₁(torus).

const TORUS_V: HVertex[] = [
  { id: 0, x: 0.50, y: 0.12, label: 'N' },
  { id: 1, x: 0.15, y: 0.50, label: 'W' },
  { id: 2, x: 0.85, y: 0.50, label: 'E' },
  { id: 3, x: 0.50, y: 0.88, label: 'S' },
];
// Edges: outer diamond (0-1,1-3,3-2,0-2) + centre diagonal (1-2)
const TORUS_E = [
  makeEdge(0, 1), makeEdge(0, 2),
  makeEdge(1, 3), makeEdge(2, 3),
  makeEdge(1, 2), // centre edge shared between the two triangles
];
const TORUS_T = [
  makeTriangle(0, 1, 2), // upper triangle
  makeTriangle(1, 2, 3), // lower triangle
];

// ─── Preset 3: Möbius strip (flat representation) ────────────────────────────
// 6 vertices in a 3×2 rectangular grid.
// All 9 edges active initially, no triangles → β₁=4 (4 independent cycles).
// Fill all 4 triangles → β₁=0 (flat strip is contractible).
// Note: The actual Möbius band requires identifying the end edges with a twist —
// that non-planar identification gives β₁=1. This flat view shows the "unrolled"
// representative before identification.

const MOBIUS_V: HVertex[] = [
  { id: 0, x: 0.08, y: 0.30, label: '0' },
  { id: 1, x: 0.08, y: 0.70, label: '1' },
  { id: 2, x: 0.42, y: 0.30, label: '2' },
  { id: 3, x: 0.42, y: 0.70, label: '3' },
  { id: 4, x: 0.76, y: 0.30, label: '4' },
  { id: 5, x: 0.76, y: 0.70, label: '5' },
];
const MOBIUS_E = [
  // Verticals
  makeEdge(0, 1), makeEdge(2, 3), makeEdge(4, 5),
  // Horizontals (top and bottom)
  makeEdge(0, 2), makeEdge(2, 4),
  makeEdge(1, 3), makeEdge(3, 5),
  // Diagonals (one per cell, to allow triangulation)
  makeEdge(0, 3), makeEdge(2, 5),
];
const MOBIUS_T = [
  makeTriangle(0, 1, 3), makeTriangle(0, 2, 3),
  makeTriangle(2, 3, 5), makeTriangle(2, 4, 5),
];

// ─── Preset registry ──────────────────────────────────────────────────────────

export const HOMOLOGY_PRESETS: HomologyPreset[] = [
  {
    id: 'triangle',
    label: 'Triangle',
    description: 'Three vertices forming a loop. β₁=1 (one independent cycle). Fill the triangle to collapse the loop: β₁=0.',
    vertices: TRI_V,
    possibleEdges: TRI_E,
    possibleTriangles: TRI_T,
    initialEdgeKeys: new Set(TRI_E.map((e) => e.key)),
    initialTriangleKeys: new Set(),
  },
  {
    id: 'torus-skeleton',
    label: 'Torus skeleton',
    description: 'Four vertices with two independent loops. β₁=2, just like H₁ of the torus. Fill each triangle to remove one loop at a time.',
    vertices: TORUS_V,
    possibleEdges: TORUS_E,
    possibleTriangles: TORUS_T,
    initialEdgeKeys: new Set(TORUS_E.map((e) => e.key)),
    initialTriangleKeys: new Set(),
  },
  {
    id: 'mobius-strip',
    label: 'Möbius strip',
    description: 'Six vertices forming a rectangular strip. All edges active; toggle triangles to fill the cells. The flat strip is contractible (β₁=0 when full). The Möbius β₁=1 arises only after the twisted end identification (not shown).',
    vertices: MOBIUS_V,
    possibleEdges: MOBIUS_E,
    possibleTriangles: MOBIUS_T,
    initialEdgeKeys: new Set(MOBIUS_E.map((e) => e.key)),
    initialTriangleKeys: new Set(),
  },
];

export const DEFAULT_HOMOLOGY_PRESET_ID = 'triangle';
