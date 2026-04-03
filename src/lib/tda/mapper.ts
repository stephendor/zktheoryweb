/**
 * mapper.ts — Task 5.2 — Agent_Interactive_Advanced
 *
 * Simplified Mapper algorithm implementation.
 *
 * The Mapper algorithm (Singh, Carlsson, Mémoli 2007) produces a topological
 * summary of a point cloud as a graph:
 *   1. Apply a filter function to project each point to a scalar value.
 *   2. Cover the scalar range with overlapping intervals.
 *   3. For each interval, cluster the preimage (points in that interval).
 *      Each cluster becomes a graph node.
 *   4. Add edges between nodes from different intervals that share points.
 *
 * All filter functions are factory functions: they close over the full
 * dataset and return a `(p: Point2D) => number` suitable for `computeMapper`.
 */

import type { Point2D } from './vietorisRips';
export type { Point2D };

// ─── Exported Types ───────────────────────────────────────────────────────────

export interface MapperNode {
  /** Unique string identifier, e.g. "node_2_0" (interval 2, cluster 0). */
  id: string;
  /** Indices into the original `points` array that belong to this node. */
  pointIndices: number[];
  /** Mean filter value of all points in this node. */
  filterMeanValue: number;
  /** Number of points in the node. */
  size: number;
}

export interface MapperEdge {
  source: string;
  target: string;
  /** Number of original points shared between the two nodes. */
  sharedPoints: number;
}

export interface MapperGraph {
  nodes: MapperNode[];
  edges: MapperEdge[];
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

/** Euclidean distance between two 2D points. */
function euclidean(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Single-linkage hierarchical clustering via Union-Find.
 *
 * Merges any pair of points within `threshold` distance into the same
 * cluster. Returns an array of clusters, each cluster being an array of
 * indices into `points`.
 *
 * Edge cases:
 *   - Empty `indices` → []
 *   - Single element → [[index]]
 */
function singleLinkageCluster(
  points: Point2D[],
  indices: number[],
  threshold: number,
): number[][] {
  if (indices.length === 0) return [];
  if (indices.length === 1) return [[indices[0]]];

  // Union-Find with path-halving compression.
  const parent = new Map<number, number>();
  for (const idx of indices) parent.set(idx, idx);

  const find = (x: number): number => {
    while (parent.get(x) !== x) {
      // Path-halving: point x to its grandparent.
      const gp = parent.get(parent.get(x)!)!;
      parent.set(x, gp);
      x = gp;
    }
    return x;
  };

  const union = (x: number, y: number): void => {
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) parent.set(rx, ry);
  };

  // Merge all pairs within the threshold.
  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      const a = indices[i];
      const b = indices[j];
      if (euclidean(points[a], points[b]) <= threshold) {
        union(a, b);
      }
    }
  }

  // Collect groups by root.
  const groups = new Map<number, number[]>();
  for (const idx of indices) {
    const root = find(idx);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(idx);
  }
  return Array.from(groups.values());
}

// ─── Core Algorithm ───────────────────────────────────────────────────────────

/**
 * Compute the Mapper graph for a point cloud.
 *
 * @param points          - Input 2D point cloud.
 * @param filterFn        - Scalar-valued lens function (e.g. `pcaFilter(points)`).
 * @param resolution      - Number of cover intervals (e.g. 10).
 * @param overlap         - Fractional overlap between adjacent intervals, 0–1
 *                          (e.g. 0.5 means each interval extends by 50% of the
 *                          base step width beyond the non-overlapping bin edge).
 * @param clusterThreshold - Single-linkage distance cutoff for the clustering
 *                          step within each preimage.
 * @returns MapperGraph with nodes and edges.
 */
export function computeMapper(
  points: Point2D[],
  filterFn: (p: Point2D) => number,
  resolution: number,
  overlap: number,
  clusterThreshold: number,
): MapperGraph {
  if (points.length === 0) return { nodes: [], edges: [] };

  // Step 1: compute filter value for every point.
  const filterValues = points.map((p) => filterFn(p));
  const minF = Math.min(...filterValues);
  const maxF = Math.max(...filterValues);

  // When all filter values are identical, use a step of 1 so the
  // interval arithmetic remains valid. All points fall in interval 0 only.
  const range = maxF - minF;
  const step = range === 0 ? 1 : range / resolution;
  const extension = overlap * step;

  // Step 2: build resolution overlapping intervals.
  // Interval i covers [minF + i*step - extension, minF + (i+1)*step + extension].
  const intervals: Array<[number, number]> = [];
  for (let i = 0; i < resolution; i++) {
    const low = minF + i * step - extension;
    const high = minF + (i + 1) * step + extension;
    intervals.push([low, high]);
  }

  // Step 3: for each interval, compute preimage and cluster.
  const allNodes: MapperNode[] = [];
  // Maps interval index → node ids produced from that interval (unused but
  // useful for debugging; kept for clarity).

  for (let i = 0; i < intervals.length; i++) {
    const [low, high] = intervals[i];

    // Preimage: indices of points whose filter value lies in [low, high].
    const preimage: number[] = [];
    for (let k = 0; k < points.length; k++) {
      if (filterValues[k] >= low && filterValues[k] <= high) {
        preimage.push(k);
      }
    }

    // Empty preimage → skip interval entirely.
    if (preimage.length === 0) continue;

    // Cluster the preimage. Fewer than 2 points → trivially one cluster.
    const clusters = singleLinkageCluster(points, preimage, clusterThreshold);

    for (let j = 0; j < clusters.length; j++) {
      const cluster = clusters[j];
      const fMean =
        cluster.reduce((sum, idx) => sum + filterValues[idx], 0) / cluster.length;
      allNodes.push({
        id: `node_${i}_${j}`,
        pointIndices: cluster,
        filterMeanValue: fMean,
        size: cluster.length,
      });
    }
  }

  if (allNodes.length === 0) return { nodes: allNodes, edges: [] };

  // Step 4: add edges between nodes from different intervals that share a point.
  //
  // Build: pointIndex → list of node ids that contain this point.
  // A point can appear in at most 2 nodes (one per overlapping interval);
  // with overlap > 0.5 theoretically more, so we handle the general case.
  const pointToNodeIds = new Map<number, string[]>();
  for (const node of allNodes) {
    for (const idx of node.pointIndices) {
      if (!pointToNodeIds.has(idx)) pointToNodeIds.set(idx, []);
      pointToNodeIds.get(idx)!.push(node.id);
    }
  }

  // Collect unique edges (canonical key = lexicographic min–max to deduplicate).
  const edgeMap = new Map<string, MapperEdge>();

  for (const nodeIdList of pointToNodeIds.values()) {
    if (nodeIdList.length < 2) continue;
    for (let a = 0; a < nodeIdList.length; a++) {
      for (let b = a + 1; b < nodeIdList.length; b++) {
        const src = nodeIdList[a];
        const tgt = nodeIdList[b];
        const key = src < tgt ? `${src}||${tgt}` : `${tgt}||${src}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, { source: src, target: tgt, sharedPoints: 0 });
        }
      }
    }
  }

  // Count shared points per edge.
  const nodeById = new Map<string, MapperNode>(allNodes.map((n) => [n.id, n]));
  const edges: MapperEdge[] = [];
  for (const edge of edgeMap.values()) {
    const setA = new Set(nodeById.get(edge.source)!.pointIndices);
    const count = nodeById
      .get(edge.target)!
      .pointIndices.filter((idx) => setA.has(idx)).length;
    edges.push({ ...edge, sharedPoints: count });
  }

  return { nodes: allNodes, edges };
}

// ─── Filter Functions ─────────────────────────────────────────────────────────

/**
 * Projects each point onto the first PCA axis (maximum-variance direction).
 * The covariance matrix is computed inline with plain JS; no external packages.
 *
 * @returns A filter function `(p: Point2D) => number` that projects `p`
 *          onto the first principal component of `points`.
 */
export function pcaFilter(points: Point2D[]): (p: Point2D) => number {
  const n = points.length;
  if (n === 0) return () => 0;

  // Mean-centre the dataset.
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;

  // 2×2 covariance matrix entries.
  let covXX = 0;
  let covXY = 0;
  let covYY = 0;
  for (const p of points) {
    const cx = p.x - meanX;
    const cy = p.y - meanY;
    covXX += cx * cx;
    covXY += cx * cy;
    covYY += cy * cy;
  }
  covXX /= n;
  covXY /= n;
  covYY /= n;

  // Eigendecomposition of symmetric 2×2 matrix.
  // λ₁ = ((covXX + covYY) + √((covXX − covYY)² + 4·covXY²)) / 2
  const traceVal = covXX + covYY;
  const disc = Math.sqrt(
    Math.max(0, (covXX - covYY) ** 2 + 4 * covXY * covXY),
  );
  const lambda1 = (traceVal + disc) / 2;

  // Eigenvector for λ₁.
  // When covXY ≈ 0 the matrix is already diagonal; eigenvectors are axis-aligned.
  let evx: number;
  let evy: number;
  if (Math.abs(covXY) < 1e-10) {
    // Axis-aligned case (includes the degenerate λ₁ = λ₂ situation).
    evx = covXX >= covYY ? 1 : 0;
    evy = covXX >= covYY ? 0 : 1;
  } else {
    // General case: eigenvector = [λ₁ − covYY, covXY] (unnormalised).
    evx = lambda1 - covYY;
    evy = covXY;
    const norm = Math.sqrt(evx * evx + evy * evy);
    if (norm < 1e-10) {
      // Numerically degenerate fallback.
      evx = 1;
      evy = 0;
    } else {
      evx /= norm;
      evy /= norm;
    }
  }

  // Return projection function.
  return (p: Point2D) => {
    const cx = p.x - meanX;
    const cy = p.y - meanY;
    return cx * evx + cy * evy;
  };
}

/**
 * Kernel Density Estimate using a 2D isotropic Gaussian kernel.
 * Higher values at dense regions; lower values in sparse regions.
 *
 * @param points    - Dataset points used for the KDE.
 * @param bandwidth - Gaussian bandwidth (σ of the kernel).
 * @returns A filter function `(p: Point2D) => number` giving the KDE density
 *          at any query point.
 */
export function densityFilter(
  points: Point2D[],
  bandwidth: number,
): (p: Point2D) => number {
  const n = points.length;
  if (n === 0) return () => 0;

  const bw2 = bandwidth * bandwidth;
  // Normalisation constant for a 2D Gaussian kernel: 1 / (n · 2π · bw²).
  const normConst = 1 / (n * 2 * Math.PI * bw2);

  return (p: Point2D) => {
    let density = 0;
    for (const q of points) {
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const d2 = dx * dx + dy * dy;
      density += Math.exp(-0.5 * d2 / bw2);
    }
    return density * normConst;
  };
}

/**
 * Eccentricity filter: mean Euclidean distance from each point to all others.
 * Points near the periphery of a cloud have high eccentricity; central-core
 * points have low eccentricity.
 *
 * @param points - Dataset used to compute pairwise distances.
 * @returns A filter function `(p: Point2D) => number` computing eccentricity
 *          of any query point relative to the dataset.
 */
export function eccentricityFilter(points: Point2D[]): (p: Point2D) => number {
  const n = points.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => 0;

  return (p: Point2D) => {
    let total = 0;
    for (const q of points) {
      total += euclidean(p, q);
    }
    return total / n;
  };
}
