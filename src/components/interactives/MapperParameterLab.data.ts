/**
 * MapperParameterLab.data.ts — Task 5.2 — Agent_Interactive_Advanced
 *
 * Preset point-cloud datasets for the Mapper Parameter Lab.
 * All coordinates are deterministic (no Math.random at module level) so
 * that the module is safe to import in SSR and test contexts.
 */

import type { Point2D } from '@lib/tda/mapper';

export interface PointCloudPreset {
  id: string;
  label: string;
  points: Point2D[];
}

// ─── Circle cloud ─────────────────────────────────────────────────────────────

/** 20 evenly-spaced points on the unit circle. */
const circlePoints: Point2D[] = Array.from({ length: 20 }, (_, i) => {
  const angle = (2 * Math.PI * i) / 20;
  return { x: Math.cos(angle), y: Math.sin(angle), id: `circle_${i}` };
});

export const circleCloud: PointCloudPreset = {
  id: 'circle',
  label: 'Circle',
  points: circlePoints,
};

// ─── Two-blobs cloud ──────────────────────────────────────────────────────────

/**
 * Two Gaussian clusters (12 + 13 = 25 points), centres at (−1.5, 0) and
 * (1.5, 0), σ = 0.4. Deterministic pseudo-Gaussian via stratified sampling
 * of the Box-Muller transform with a seeded sequence.
 */
function makeBlobPoints(): Point2D[] {
  // Box-Muller transform from a linearly-spaced sequence in (0,1).
  // Using stratified sampling avoids Math.random() calls.
  function gaussianSample(
    cx: number,
    cy: number,
    sigma: number,
    n: number,
    idPrefix: string,
  ): Point2D[] {
    return Array.from({ length: n }, (_, i) => {
      // Evenly spaced u1 and u2 in (0,1), paired for Box-Muller.
      const u1 = (i + 0.5) / n;
      const u2 = (i * 0.618033988 + 0.1) % 1; // golden-ratio sequence
      const mag = sigma * Math.sqrt(-2 * Math.log(u1));
      const angle = 2 * Math.PI * u2;
      return {
        x: cx + mag * Math.cos(angle),
        y: cy + mag * Math.sin(angle),
        id: `${idPrefix}_${i}`,
      };
    });
  }

  const a = gaussianSample(-1.5, 0, 0.4, 12, 'blob_a');
  const b = gaussianSample(1.5, 0, 0.4, 13, 'blob_b');
  return [...a, ...b];
}

export const blobsCloud: PointCloudPreset = {
  id: 'blobs',
  label: 'Two Blobs',
  points: makeBlobPoints(),
};

// ─── Crescent cloud ───────────────────────────────────────────────────────────

/**
 * 20 points sampled from a half-annulus (crescent shape).
 * Points lie on angles [10°, 170°] with radius ∈ [0.8, 1.2], using a
 * deterministic stratified layout.
 */
function makeCrescentPoints(): Point2D[] {
  return Array.from({ length: 20 }, (_, i) => {
    // Angle spans 10° → 170° (top half of annulus → crescent shape).
    const angle = (Math.PI * 10) / 180 + (i / 19) * (Math.PI * 160) / 180;
    // Alternating inner/outer radius for spread.
    const r = i % 2 === 0 ? 0.85 : 1.15;
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
      id: `crescent_${i}`,
    };
  });
}

export const crescentCloud: PointCloudPreset = {
  id: 'crescent',
  label: 'Crescent',
  points: makeCrescentPoints(),
};

// ─── Ordered list for UI ──────────────────────────────────────────────────────

export const PRESETS: PointCloudPreset[] = [circleCloud, blobsCloud, crescentCloud];
