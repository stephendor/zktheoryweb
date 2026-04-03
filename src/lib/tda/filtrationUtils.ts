/**
 * filtrationUtils.ts — Task 5.3 — Agent_Interactive_Advanced
 *
 * Algorithm helpers for the Filtration Playground.
 *
 * Why a separate file: vietorisRips.ts hardcodes MAX_POINTS = 30 and silently
 * truncates larger inputs. The Filtration Playground allows up to 50 points.
 * Per task instructions, vietorisRips.ts must not be modified. This file
 * provides a 50-point-capable `buildComplexFP` plus shared step-building
 * helpers used by the playground component.
 */

import type { Point2D, Simplex } from './vietorisRips';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum point count for the Filtration Playground algorithm. */
const MAX_POINTS_FP = 50;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function dist(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Compute the maximum pairwise Euclidean distance across all points.
 * Returns 1 if fewer than 2 points are provided (safe default for radius steps).
 */
export function maxPairwiseDist(pts: Point2D[]): number {
  if (pts.length < 2) return 1;
  let max = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = dist(pts[i], pts[j]);
      if (d > max) max = d;
    }
  }
  return max > 0 ? max : 1;
}

/**
 * Build `numSteps` evenly-spaced radius values from 0 to `maxRadius` (inclusive).
 * Equivalent to buildRadiusSteps in PersistenceDiagramBuilder but generalised.
 */
export function buildRadiusSteps(maxRadius: number, numSteps: number): number[] {
  return Array.from(
    { length: numSteps },
    (_, i) => (numSteps > 1 ? (i / (numSteps - 1)) * maxRadius : 0),
  );
}

/**
 * Build the Vietoris-Rips simplicial complex at the given radius.
 *
 * Identical algorithm to vietorisRips.buildComplex but supports up to
 * MAX_POINTS_FP (50) instead of 30. Input is silently truncated at 50 points.
 *
 * Returns a flat Simplex[] array filtered by dimension:
 *   dimension 0 — vertices
 *   dimension 1 — edges  (pairs with dist ≤ radius)
 *   dimension 2 — triangles  (triples where all pairwise dists ≤ radius)
 */
export function buildComplexFP(points: Point2D[], radius: number): Simplex[] {
  if (points.length === 0) return [];

  const pts = points.slice(0, MAX_POINTS_FP);
  const simplices: Simplex[] = [];

  // 0-simplices
  for (const p of pts) {
    simplices.push({ vertices: [p.id], dimension: 0 });
  }

  // 1-simplices
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (dist(pts[i], pts[j]) <= radius) {
        simplices.push({ vertices: [pts[i].id, pts[j].id], dimension: 1 });
      }
    }
  }

  // 2-simplices
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
