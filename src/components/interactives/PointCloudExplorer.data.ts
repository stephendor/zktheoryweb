/**
 * PointCloudExplorer.data.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Data types, distance functions, preset point clouds, and the ε-ball
 * query used by the Point Cloud & Distance Explorer interactive.
 *
 * All functions are pure (no side effects) and are independently testable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A point in 2-D space. */
export interface Point2D {
  x: number;
  y: number;
}

/** Supported distance metrics. */
export type Metric = 'euclidean' | 'manhattan';

/** A named preset point cloud. */
export interface PointCloudPreset {
  id: string;
  label: string;
  points: Point2D[];
}

/** Result of a distance matrix computation. */
export type DistanceMatrix = number[][];

// ─── Distance functions ───────────────────────────────────────────────────────

/**
 * Euclidean (L₂) distance between two 2-D points.
 * $d_2(a, b) = \sqrt{(a_x - b_x)^2 + (a_y - b_y)^2}$
 */
export function euclideanDistance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Manhattan (L₁) distance between two 2-D points.
 * $d_1(a, b) = |a_x - b_x| + |a_y - b_y|$
 */
export function manhattanDistance(a: Point2D, b: Point2D): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Dispatch wrapper: returns the appropriate distance for the given metric.
 */
export function getDistance(a: Point2D, b: Point2D, metric: Metric): number {
  return metric === 'euclidean'
    ? euclideanDistance(a, b)
    : manhattanDistance(a, b);
}

// ─── ε-ball query ─────────────────────────────────────────────────────────────

/**
 * Return the indices of all points strictly within distance ε of `center`
 * (the open ball $B(center, \varepsilon)$), not including `center` itself.
 *
 * @param centerIdx - Index of the selected centre point in `points`.
 * @param points    - Full point cloud.
 * @param eps       - Ball radius (in the coordinate space of `points`).
 * @param metric    - Which metric to use.
 * @returns Sorted array of indices of points inside the ball.
 */
export function getEpsBallIndices(
  centerIdx: number,
  points: Point2D[],
  eps: number,
  metric: Metric,
): number[] {
  const center = points[centerIdx];
  const result: number[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === centerIdx) continue;
    if (getDistance(center, points[i], metric) < eps) {
      result.push(i);
    }
  }
  return result;
}

// ─── Pairwise distance matrix ─────────────────────────────────────────────────

/**
 * Compute the full NxN pairwise distance matrix for a set of points.
 * The matrix is symmetric with zeros on the diagonal.
 *
 * @param points - Point cloud.
 * @param metric - Which metric to use.
 * @returns 2-D array `M` where `M[i][j]` is the distance between points i and j.
 */
export function computeDistanceMatrix(
  points: Point2D[],
  metric: Metric,
): DistanceMatrix {
  const n = points.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = getDistance(points[i], points[j], metric);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}

// ─── Preset point clouds ──────────────────────────────────────────────────────

/**
 * Scattered preset — 12 roughly uniform random points in [0.05, 0.95]².
 * Coordinates are normalised to [0,1] so the chart scales them to any viewport.
 */
const SCATTERED_POINTS: Point2D[] = [
  { x: 0.10, y: 0.20 },
  { x: 0.22, y: 0.65 },
  { x: 0.35, y: 0.10 },
  { x: 0.42, y: 0.45 },
  { x: 0.48, y: 0.80 },
  { x: 0.55, y: 0.30 },
  { x: 0.60, y: 0.70 },
  { x: 0.65, y: 0.15 },
  { x: 0.72, y: 0.55 },
  { x: 0.80, y: 0.85 },
  { x: 0.88, y: 0.35 },
  { x: 0.92, y: 0.60 },
];

/**
 * Two clusters preset — two tight groups of 7 points each, well separated.
 * Illustrates how ε must exceed the inter-cluster gap to reach the other cluster.
 */
const TWO_CLUSTERS_POINTS: Point2D[] = [
  // Left cluster
  { x: 0.20, y: 0.45 },
  { x: 0.25, y: 0.55 },
  { x: 0.28, y: 0.40 },
  { x: 0.32, y: 0.60 },
  { x: 0.18, y: 0.62 },
  { x: 0.35, y: 0.48 },
  { x: 0.23, y: 0.50 },
  // Right cluster
  { x: 0.65, y: 0.45 },
  { x: 0.70, y: 0.55 },
  { x: 0.73, y: 0.40 },
  { x: 0.77, y: 0.60 },
  { x: 0.63, y: 0.62 },
  { x: 0.80, y: 0.48 },
  { x: 0.68, y: 0.50 },
];

/**
 * Ring preset — 16 points arranged on a circle of radius 0.35 centred at (0.5, 0.5).
 * At small ε only adjacent points are in-ball; at larger ε the ring structure becomes apparent.
 */
const RING_POINTS: Point2D[] = Array.from({ length: 16 }, (_, i) => {
  const angle = (2 * Math.PI * i) / 16;
  return {
    x: 0.5 + 0.35 * Math.cos(angle),
    y: 0.5 + 0.35 * Math.sin(angle),
  };
});

export const POINT_CLOUD_PRESETS: PointCloudPreset[] = [
  { id: 'scattered', label: 'Scattered', points: SCATTERED_POINTS },
  { id: 'two-clusters', label: 'Two clusters', points: TWO_CLUSTERS_POINTS },
  { id: 'ring', label: 'Ring', points: RING_POINTS },
];

export const DEFAULT_PRESET_ID = 'scattered';

/** Default ε as a fraction of the unit [0,1] coordinate space. */
export const DEFAULT_EPS = 0.28;
export const EPS_MIN = 0.05;
export const EPS_MAX = 0.80;
export const EPS_STEP = 0.01;
