/**
 * vietorisRips3D.ts — Task 5.1 — Agent_Interactive_Advanced
 *
 * Thin wrapper around vietorisRips.ts that accepts 3D point input.
 *
 * Design decision: The 3D Persistence Diagram Builder is a visual upgrade
 * only. Mathematical persistence computation (Vietoris-Rips filtration) is
 * unchanged and continues to operate on 2D projections. The z coordinate is
 * stripped before any TDA computation so the existing vietorisRips.ts is
 * never modified. This ensures:
 *   - No regressions in H₀/H₁ computation correctness
 *   - No changes to generator edge IDs or cross-highlight logic
 *
 * Do NOT modify vietorisRips.ts.
 */

import type { Point2D, PersistenceFeature, Simplex } from './vietorisRips';
import { buildComplex, computePersistence } from './vietorisRips';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A point in 3D space with a stable ID. */
export type Point3D = { x: number; y: number; z: number; id: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip the z coordinate to get a Point2D projection. */
function to2D(p: Point3D): Point2D {
  return { x: p.x, y: p.y, id: p.id };
}

// ---------------------------------------------------------------------------
// Public API — mirrors vietorisRips.ts but accepts Point3D[]
// ---------------------------------------------------------------------------

/**
 * Build the Vietoris-Rips simplicial complex from a 3D point cloud at the
 * given radius. Distance computation uses the 2D projection (x, y only).
 */
export function buildComplex3D(points: Point3D[], radius: number): Simplex[] {
  return buildComplex(points.map(to2D), radius);
}

/**
 * Compute persistent homology (H₀, H₁) from a 3D point cloud over the
 * given radius steps. Persistence is computed on the 2D projection.
 */
export function computePersistence3D(
  points: Point3D[],
  steps: number[],
): PersistenceFeature[] {
  return computePersistence(points.map(to2D), steps);
}
