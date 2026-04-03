/**
 * vietorisRips.ts — Task 3.7a — Agent_Interactive_Core
 *
 * Vietoris-Rips filtration and persistent homology (H₀, H₁) for small
 * point clouds (max 30 points).
 *
 * Implementation note: Third-party TDA packages were evaluated:
 *   - `simplicial-complex` (mikolalysenko): integer-array API, no persistence
 *     computation, C-style interface ill-suited for TypeScript and our 30-pt cap.
 *   - `topological-data-analysis`: not found in npm registry.
 * Decision: implemented from scratch for clean TypeScript types, correctness,
 * and full control over the union-find / cycle-detection logic.
 *
 * Truncation policy (30-point cap):
 *   buildComplex and computePersistence silently truncate input to the first
 *   30 points if more are provided. Callers that need strict rejection should
 *   validate length before calling. This is the safer UX choice — the editor
 *   enforces the cap at interaction level; the algorithm never hard-errors on
 *   slightly over-sized payloads that may arrive via preset buttons.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type Point2D = { x: number; y: number; id: string };

export type Simplex = {
  vertices: string[];
  dimension: 0 | 1 | 2;
};

export type PersistenceFeature = {
  dimension: 0 | 1;
  birth: number;
  death: number | null;
  /** IDs of the generating vertices/edge cycle. Optional diagnostic info. */
  generator?: string[];
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const MAX_POINTS = 30;
/** Squared-distance tolerance for duplicate-point detection. */
const DUPLICATE_TOL_SQ = 1e-6 * 1e-6;

/** Euclidean distance between two points. */
function dist(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Deduplicate points whose squared distance is below DUPLICATE_TOL_SQ.
 * Keeps the first occurrence, discards subsequent duplicates.
 */
function deduplicatePoints(points: Point2D[]): Point2D[] {
  const kept: Point2D[] = [];
  for (const p of points) {
    const isDup = kept.some((k) => {
      const dx = k.x - p.x;
      const dy = k.y - p.y;
      return dx * dx + dy * dy < DUPLICATE_TOL_SQ;
    });
    if (!isDup) kept.push(p);
  }
  return kept;
}

// ---------------------------------------------------------------------------
// Union-Find (for H₀ — connected components)
// ---------------------------------------------------------------------------

class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  add(id: string): void {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
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

  /** Returns true if the two ids were in different components (merge happened). */
  union(a: string, b: string): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false; // same component — edge creates a cycle
    const rankA = this.rank.get(ra)!;
    const rankB = this.rank.get(rb)!;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
    return true;
  }

  /** Count distinct roots (number of components). */
  componentCount(): number {
    const roots = new Set<string>();
    for (const [id] of this.parent) {
      roots.add(this.find(id));
    }
    return roots.size;
  }

  /** Return current root for each id (snapshot). */
  roots(): Map<string, string> {
    const map = new Map<string, string>();
    for (const [id] of this.parent) {
      map.set(id, this.find(id));
    }
    return map;
  }
}

// ---------------------------------------------------------------------------
// buildComplex
// ---------------------------------------------------------------------------

/**
 * Build the Vietoris-Rips simplicial complex at the given radius.
 *
 * Returns all:
 *   - 0-simplices (vertices) for every point
 *   - 1-simplices (edges) for pairs with dist ≤ radius
 *   - 2-simplices (triangles) for triples where all 3 edges ≤ radius
 *
 * Input is silently truncated to MAX_POINTS (30).
 */
export function buildComplex(points: Point2D[], radius: number): Simplex[] {
  if (points.length === 0) return [];

  const pts = deduplicatePoints(points.slice(0, MAX_POINTS));
  const simplices: Simplex[] = [];

  // 0-simplices
  for (const p of pts) {
    simplices.push({ vertices: [p.id], dimension: 0 });
  }

  // 1-simplices: all pairs within radius
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (dist(pts[i], pts[j]) <= radius) {
        simplices.push({ vertices: [pts[i].id, pts[j].id], dimension: 1 });
        edges.push([i, j]);
      }
    }
  }

  // 2-simplices: all triples where every pair is within radius
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      for (let k = j + 1; k < pts.length; k++) {
        if (
          dist(pts[i], pts[j]) <= radius &&
          dist(pts[i], pts[k]) <= radius &&
          dist(pts[j], pts[k]) <= radius
        ) {
          simplices.push({
            vertices: [pts[i].id, pts[j].id, pts[k].id],
            dimension: 2,
          });
        }
      }
    }
  }

  return simplices;
}

// ---------------------------------------------------------------------------
// computePersistence
// ---------------------------------------------------------------------------

/**
 * Compute persistent H₀ and H₁ features by sweeping the given radius steps.
 *
 * Algorithm:
 *   H₀ (connected components): Union-Find over vertices.
 *     - Each vertex born at the first radius step where it appears (step 0).
 *     - When a 1-simplex merges two components, the younger component dies
 *       at that radius (elder rule: the component born later dies).
 *     - The single surviving component has death = null (lives forever).
 *
 *   H₁ (loops): Edge-by-edge cycle detection.
 *     - When a 1-simplex is added that creates a cycle (union returns false),
 *       a H₁ feature is born at that radius.
 *     - A H₁ feature dies when the bounding 2-simplex appears (i.e. the
 *       triangle that fills the loop is added). We track this by watching for
 *       2-simplices that close a specific cycle's generating edge set.
 *     - Loops not killed by a 2-simplex survive to death = null.
 *
 * Input is silently truncated to MAX_POINTS (30).
 */
export function computePersistence(
  points: Point2D[],
  radiusSteps: number[],
): PersistenceFeature[] {
  if (points.length === 0) return [];

  const pts = deduplicatePoints(points.slice(0, MAX_POINTS));

  if (pts.length === 1) {
    // Single point: one H₀ feature born at 0, never dying.
    return [
      {
        dimension: 0,
        birth: radiusSteps.length > 0 ? radiusSteps[0] : 0,
        death: null,
        generator: [pts[0].id],
      },
    ];
  }

  const steps = [...radiusSteps].sort((a, b) => a - b);

  // We'll track:
  //   h0Features: one per component, keyed by their "elder" root id
  //   h1Features: one per cycle detected

  // Track which "component root" was born at which step.
  // Convention: when union-find merges two roots, the root with the *smaller*
  // birth step is the elder and survives; the younger one dies.
  const componentBirth = new Map<string, number>(); // root id → birth radius
  const h0Deaths = new Map<string, number>(); // root id → death radius

  // H₁ state
  interface CycleInfo {
    birth: number;
    generatingEdge: [string, string];
    dead: boolean;
    death: number | null;
  }
  const cycles: CycleInfo[] = [];

  // We use a fresh UF for H₀ tracking and a separate one for H₁ cycle detection.
  // They share state because both need to know connectivity at each step.
  // We run the filtration once, incrementally.

  const uf = new UnionFind();

  // Initialise all vertices at step 0 (or the first radius step).
  const birthRadius = steps.length > 0 ? steps[0] : 0;
  for (const p of pts) {
    uf.add(p.id);
    componentBirth.set(p.id, birthRadius);
  }

  // Pre-compute all pairwise distances once.
  const pairDist = new Map<string, number>();
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const key = `${pts[i].id}|${pts[j].id}`;
      pairDist.set(key, dist(pts[i], pts[j]));
    }
  }

  function edgeDist(a: string, b: string): number {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    return pairDist.get(key) ?? Infinity;
  }

  // Track which 2-simplices we've already added (by sorted vertex key).
  const addedTriangles = new Set<string>();
  // Track which edges we've already processed in UF (to avoid re-running union).
  const addedEdges = new Set<string>();

  for (const r of steps) {
    // Add all edges at this radius step, in order of length (shorter edges first
    // gives more topologically stable results).
    const newEdges: Array<{ a: Point2D; b: Point2D; d: number }> = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const edgeKey = `${pts[i].id}|${pts[j].id}`;
        if (!addedEdges.has(edgeKey)) {
          const d = dist(pts[i], pts[j]);
          if (d <= r) {
            newEdges.push({ a: pts[i], b: pts[j], d });
          }
        }
      }
    }
    newEdges.sort((x, y) => x.d - y.d);

    for (const { a, b } of newEdges) {
      const edgeKey = `${a.id}|${b.id}`;
      addedEdges.add(edgeKey);

      const rootA = uf.find(a.id);
      const rootB = uf.find(b.id);

      if (rootA !== rootB) {
        // Merging two components — H₀ death event.
        // Elder rule: the root born *earlier* survives; later-born root dies.
        const birthA = componentBirth.get(rootA) ?? r;
        const birthB = componentBirth.get(rootB) ?? r;

        let elder: string, younger: string;
        if (birthA <= birthB) {
          elder = rootA;
          younger = rootB;
        } else {
          elder = rootB;
          younger = rootA;
        }

        h0Deaths.set(younger, r);

        // After union, the new root may change — keep the elder as the representative.
        uf.union(a.id, b.id);
        const newRoot = uf.find(a.id);

        // Carry forward the elder's birth time to the new root.
        componentBirth.set(newRoot, componentBirth.get(elder) ?? r);
      } else {
        // Same component — this edge creates a cycle: H₁ birth.
        cycles.push({
          birth: r,
          generatingEdge: [a.id, b.id],
          dead: false,
          death: null,
        });
      }
    }

    // Check for 2-simplices that kill H₁ features.
    // A triangle [i,j,k] fills the loop formed by its three edges.
    // We kill the youngest undead cycle whose generating edge is one of the
    // three edges of the triangle (standard "killing" heuristic).
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        for (let k = j + 1; k < pts.length; k++) {
          const triKey = `${pts[i].id}|${pts[j].id}|${pts[k].id}`;
          if (addedTriangles.has(triKey)) continue;
          const dij = edgeDist(pts[i].id, pts[j].id);
          const dik = edgeDist(pts[i].id, pts[k].id);
          const djk = edgeDist(pts[j].id, pts[k].id);
          if (dij <= r && dik <= r && djk <= r) {
            addedTriangles.add(triKey);
            // The triangle's "birth" edge is the longest of its three edges
            // (the last one to be added — this is the standard V-R boundary).
            const maxEdgeDist = Math.max(dij, dik, djk);
            let killerEdge: [string, string];
            if (maxEdgeDist === dij) killerEdge = [pts[i].id, pts[j].id];
            else if (maxEdgeDist === dik) killerEdge = [pts[i].id, pts[k].id];
            else killerEdge = [pts[j].id, pts[k].id];

            // Find the most recently born undead cycle whose birth matches this triangle's
            // maxEdgeDist (i.e., born when the longest edge was added).
            // We kill the youngest matching cycle.
            let youngestIdx = -1;
            let youngestBirth = -1;
            for (let c = 0; c < cycles.length; c++) {
              const cy = cycles[c];
              if (cy.dead) continue;
              const [ea, eb] = cy.generatingEdge;
              const [ka, kb] = killerEdge;
              if (
                (ea === ka && eb === kb) ||
                (ea === kb && eb === ka)
              ) {
                if (cy.birth >= youngestBirth) {
                  youngestBirth = cy.birth;
                  youngestIdx = c;
                }
              }
            }
            if (youngestIdx >= 0) {
              cycles[youngestIdx].dead = true;
              cycles[youngestIdx].death = r;
            }
          }
        }
      }
    }
  }

  // Build H₀ features.
  // Each point's root at time of "death" (or no death = immortal) is a feature.
  // We need to reconstruct which roots existed and their births.
  //
  // Strategy: for every point, its root at step 0 is itself. We record
  // (birth, death) from componentBirth and h0Deaths maps.
  // Deduplicate by root identity at the end.

  const h0Features: PersistenceFeature[] = [];
  const seenRoots = new Set<string>();

  // Iterate all points and find their "original" root identity by checking
  // whether they have a death entry.
  // Simpler approach: each point represents a component at birth.
  // If it has a death, it died. If not, it lives forever.
  // We need to avoid duplicates: two points that merged and the "younger" died
  // — only the younger gets a death entry.
  for (const p of pts) {
    const rootKey = p.id; // each point was its own root at birth
    if (seenRoots.has(rootKey)) continue;
    seenRoots.add(rootKey);

    const birth = componentBirth.get(rootKey) ?? birthRadius;
    const death = h0Deaths.get(rootKey) ?? null;

    h0Features.push({
      dimension: 0,
      birth,
      death,
      generator: [p.id],
    });
  }

  // Build H₁ features.
  const h1Features: PersistenceFeature[] = cycles.map((cy) => ({
    dimension: 1,
    birth: cy.birth,
    death: cy.death,
    generator: cy.generatingEdge,
  }));

  return [...h0Features, ...h1Features];
}
