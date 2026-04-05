/**
 * BarcodeComparator.data.ts — Task 6.1b — Agent_Interactive_Advanced
 *
 * Synthetic participatory dataset and persistence computation for the
 * Barcode Comparator interactive.
 *
 * Module concept (path2-module-8): the same population described using
 * official deprivation dimensions vs community-defined dimensions produces
 * different persistence barcodes — the mathematical signature of the
 * difference between being measured and being heard.
 *
 * Data model:
 *   30 households, each with 5 values in two coordinate systems:
 *
 *   Official dimensions (standardised to [0,1]):
 *     income_deprivation, employment_deprivation,
 *     health_deprivation, education_deprivation, housing_deprivation
 *
 *   Community-defined dimensions (standardised to [0,1]):
 *     safety_score, green_space_access,
 *     neighbourhood_trust, public_transport, childcare_access
 *
 *   The two sets are correlated but not identical: some households score
 *   "not deprived" on official indices while scoring poorly on community
 *   measures (and vice versa). This divergence is the subject of Chapter 16.
 *
 * Persistence computation:
 *   Both 5D datasets are projected to 2D via PCA-like linear projection
 *   (fixed weights) for compatibility with the existing Point2D-based
 *   computePersistence infrastructure.
 *
 *   Alternatively: for visualisation, each dataset is reduced to a 2D
 *   coordinates pair representing the two most structurally distinctive
 *   dimensions in each system (official: income + housing; community:
 *   safety + trust). The Vietoris-Rips filtration on these 2D populations
 *   gives the persistence barcode.
 */

import {
  computePersistence,
  type Point2D,
  type PersistenceFeature,
} from '@lib/tda/vietorisRips';
import {
  buildRadiusSteps,
  maxPairwiseDist,
} from '@lib/tda/filtrationUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single household record in both coordinate systems. */
export interface HouseholdRecord {
  id: string;
  label: string;
  /** Official deprivation dimensions (5-dimensional, each 0–1). */
  official: {
    income: number;
    employment: number;
    health: number;
    education: number;
    housing: number;
  };
  /** Community-defined dimensions (5-dimensional, each 0–1). */
  community: {
    safety: number;
    green_space: number;
    trust: number;
    transport: number;
    childcare: number;
  };
}

export interface DatasetResult {
  label: string;
  description: string;
  points: Point2D[];
  features: PersistenceFeature[];
  h0Count: number;
  h1Count: number;
}

// ─── Synthetic dataset ────────────────────────────────────────────────────────

/**
 * 30 synthetic households from a hypothetical East Manchester estate.
 *
 * Design principles:
 *   - 10 households "deprived officially but not by community norms":
 *     low income/employment but strong local trust, good safety.
 *   - 10 households "not deprived officially but deprived by community norms":
 *     acceptable income but isolated, no green space, no childcare.
 *   - 10 households consistently deprived (both systems agree).
 *
 * This creates a **different topological clustering** under each coordinate
 * system — a different persistence barcode.
 */
export const HOUSEHOLD_RECORDS: HouseholdRecord[] = [
  // ── Officially deprived, community-resilient (hh01–hh10) ──
  { id: 'hh01', label: 'HH 1',  official: { income:0.15, employment:0.20, health:0.40, education:0.35, housing:0.25 }, community: { safety:0.75, green_space:0.80, trust:0.85, transport:0.60, childcare:0.70 } },
  { id: 'hh02', label: 'HH 2',  official: { income:0.20, employment:0.15, health:0.35, education:0.30, housing:0.30 }, community: { safety:0.80, green_space:0.75, trust:0.90, transport:0.65, childcare:0.75 } },
  { id: 'hh03', label: 'HH 3',  official: { income:0.10, employment:0.25, health:0.45, education:0.40, housing:0.20 }, community: { safety:0.70, green_space:0.85, trust:0.80, transport:0.55, childcare:0.65 } },
  { id: 'hh04', label: 'HH 4',  official: { income:0.25, employment:0.20, health:0.30, education:0.25, housing:0.35 }, community: { safety:0.85, green_space:0.70, trust:0.75, transport:0.70, childcare:0.80 } },
  { id: 'hh05', label: 'HH 5',  official: { income:0.18, employment:0.18, health:0.38, education:0.32, housing:0.22 }, community: { safety:0.78, green_space:0.78, trust:0.83, transport:0.63, childcare:0.72 } },
  { id: 'hh06', label: 'HH 6',  official: { income:0.12, employment:0.22, health:0.42, education:0.38, housing:0.18 }, community: { safety:0.72, green_space:0.82, trust:0.88, transport:0.58, childcare:0.68 } },
  { id: 'hh07', label: 'HH 7',  official: { income:0.22, employment:0.17, health:0.33, education:0.28, housing:0.32 }, community: { safety:0.82, green_space:0.73, trust:0.78, transport:0.67, childcare:0.77 } },
  { id: 'hh08', label: 'HH 8',  official: { income:0.16, employment:0.21, health:0.36, education:0.36, housing:0.26 }, community: { safety:0.76, green_space:0.79, trust:0.86, transport:0.62, childcare:0.71 } },
  { id: 'hh09', label: 'HH 9',  official: { income:0.19, employment:0.16, health:0.39, education:0.31, housing:0.29 }, community: { safety:0.79, green_space:0.77, trust:0.84, transport:0.64, childcare:0.73 } },
  { id: 'hh10', label: 'HH 10', official: { income:0.13, employment:0.24, health:0.43, education:0.39, housing:0.17 }, community: { safety:0.73, green_space:0.83, trust:0.87, transport:0.57, childcare:0.67 } },

  // ── Not deprived officially, community-isolated (hh11–hh20) ──
  { id: 'hh11', label: 'HH 11', official: { income:0.70, employment:0.75, health:0.65, education:0.60, housing:0.72 }, community: { safety:0.25, green_space:0.20, trust:0.15, transport:0.30, childcare:0.10 } },
  { id: 'hh12', label: 'HH 12', official: { income:0.75, employment:0.70, health:0.60, education:0.65, housing:0.68 }, community: { safety:0.20, green_space:0.25, trust:0.20, transport:0.25, childcare:0.15 } },
  { id: 'hh13', label: 'HH 13', official: { income:0.65, employment:0.80, health:0.70, education:0.55, housing:0.75 }, community: { safety:0.30, green_space:0.15, trust:0.10, transport:0.35, childcare:0.05 } },
  { id: 'hh14', label: 'HH 14', official: { income:0.80, employment:0.65, health:0.55, education:0.70, housing:0.65 }, community: { safety:0.15, green_space:0.30, trust:0.25, transport:0.20, childcare:0.20 } },
  { id: 'hh15', label: 'HH 15', official: { income:0.72, employment:0.73, health:0.63, education:0.62, housing:0.70 }, community: { safety:0.23, green_space:0.23, trust:0.18, transport:0.28, childcare:0.13 } },
  { id: 'hh16', label: 'HH 16', official: { income:0.67, employment:0.78, health:0.68, education:0.57, housing:0.73 }, community: { safety:0.28, green_space:0.18, trust:0.13, transport:0.33, childcare:0.08 } },
  { id: 'hh17', label: 'HH 17', official: { income:0.78, employment:0.67, health:0.57, education:0.67, housing:0.67 }, community: { safety:0.17, green_space:0.28, trust:0.23, transport:0.22, childcare:0.18 } },
  { id: 'hh18', label: 'HH 18', official: { income:0.68, employment:0.72, health:0.62, education:0.60, housing:0.69 }, community: { safety:0.22, green_space:0.22, trust:0.17, transport:0.27, childcare:0.12 } },
  { id: 'hh19', label: 'HH 19', official: { income:0.73, employment:0.71, health:0.64, education:0.63, housing:0.71 }, community: { safety:0.24, green_space:0.24, trust:0.19, transport:0.29, childcare:0.14 } },
  { id: 'hh20', label: 'HH 20', official: { income:0.66, employment:0.79, health:0.69, education:0.56, housing:0.74 }, community: { safety:0.29, green_space:0.19, trust:0.14, transport:0.34, childcare:0.09 } },

  // ── Consistently deprived (both systems agree, hh21–hh30) ──
  { id: 'hh21', label: 'HH 21', official: { income:0.12, employment:0.10, health:0.20, education:0.15, housing:0.10 }, community: { safety:0.18, green_space:0.15, trust:0.12, transport:0.20, childcare:0.10 } },
  { id: 'hh22', label: 'HH 22', official: { income:0.15, employment:0.12, health:0.22, education:0.18, housing:0.12 }, community: { safety:0.22, green_space:0.18, trust:0.15, transport:0.25, childcare:0.13 } },
  { id: 'hh23', label: 'HH 23', official: { income:0.10, employment:0.08, health:0.18, education:0.12, housing:0.08 }, community: { safety:0.15, green_space:0.12, trust:0.10, transport:0.18, childcare:0.08 } },
  { id: 'hh24', label: 'HH 24', official: { income:0.18, employment:0.15, health:0.25, education:0.20, housing:0.15 }, community: { safety:0.25, green_space:0.20, trust:0.18, transport:0.28, childcare:0.15 } },
  { id: 'hh25', label: 'HH 25', official: { income:0.13, employment:0.11, health:0.21, education:0.16, housing:0.11 }, community: { safety:0.20, green_space:0.16, trust:0.13, transport:0.22, childcare:0.11 } },
  { id: 'hh26', label: 'HH 26', official: { income:0.11, employment:0.09, health:0.19, education:0.13, housing:0.09 }, community: { safety:0.17, green_space:0.13, trust:0.11, transport:0.19, childcare:0.09 } },
  { id: 'hh27', label: 'HH 27', official: { income:0.16, employment:0.13, health:0.23, education:0.19, housing:0.13 }, community: { safety:0.23, green_space:0.19, trust:0.16, transport:0.26, childcare:0.14 } },
  { id: 'hh28', label: 'HH 28', official: { income:0.14, employment:0.11, health:0.22, education:0.17, housing:0.11 }, community: { safety:0.21, green_space:0.17, trust:0.14, transport:0.23, childcare:0.12 } },
  { id: 'hh29', label: 'HH 29', official: { income:0.17, employment:0.14, health:0.24, education:0.21, housing:0.14 }, community: { safety:0.24, green_space:0.21, trust:0.17, transport:0.27, childcare:0.15 } },
  { id: 'hh30', label: 'HH 30', official: { income:0.11, employment:0.09, health:0.19, education:0.13, housing:0.09 }, community: { safety:0.16, green_space:0.14, trust:0.12, transport:0.21, childcare:0.10 } },
];

// ─── Project to 2D for filtration ─────────────────────────────────────────────

/**
 * Project the official 5D dimensions to 2D using the two most structurally
 * meaningful axes for visualisation:
 *   x = income_deprivation + 0.5·employment_deprivation (economic axis)
 *   y = housing_deprivation + 0.5·health_deprivation    (infrastructure axis)
 *
 * Values are scaled to fit within ~[0, 1] per axis.
 */
function projectOfficial(h: HouseholdRecord): Point2D {
  return {
    x: (h.official.income + 0.5 * h.official.employment) / 1.5,
    y: (h.official.housing + 0.5 * h.official.health) / 1.5,
    id: h.id,
  };
}

/**
 * Project the community 5D dimensions to 2D:
 *   x = safety + 0.5·trust      (social safety axis)
 *   y = green_space + 0.5·childcare (physical / care infrastructure axis)
 *
 * Values are scaled to fit within ~[0, 1] per axis.
 */
function projectCommunity(h: HouseholdRecord): Point2D {
  return {
    x: (h.community.safety + 0.5 * h.community.trust) / 1.5,
    y: (h.community.green_space + 0.5 * h.community.childcare) / 1.5,
    id: h.id,
  };
}

// ─── Compute persistence for a point cloud ────────────────────────────────────

const N_STEPS = 40;

/**
 * Compute H₀ and H₁ persistence features for a 2D point cloud.
 */
export function computeDatasetPersistence(
  points: Point2D[],
): PersistenceFeature[] {
  const maxDist = maxPairwiseDist(points);
  if (maxDist <= 0) return [];
  const steps = buildRadiusSteps(maxDist, N_STEPS);
  return computePersistence(points, steps);
}

// ─── Build comparison datasets ────────────────────────────────────────────────

export function buildOfficialDataset(): DatasetResult {
  const points = HOUSEHOLD_RECORDS.map(projectOfficial);
  const features = computeDatasetPersistence(points);
  const h0 = features.filter((f) => f.dimension === 0);
  const h1 = features.filter((f) => f.dimension === 1);
  return {
    label: 'Official deprivation indices',
    description: 'Income, employment, health, education, housing (DWP index dimensions)',
    points,
    features,
    h0Count: h0.length,
    h1Count: h1.length,
  };
}

export function buildCommunityDataset(): DatasetResult {
  const points = HOUSEHOLD_RECORDS.map(projectCommunity);
  const features = computeDatasetPersistence(points);
  const h0 = features.filter((f) => f.dimension === 0);
  const h1 = features.filter((f) => f.dimension === 1);
  return {
    label: 'Community-defined dimensions',
    description: 'Safety, green space, neighbourhood trust, transport, childcare',
    points,
    features,
    h0Count: h0.length,
    h1Count: h1.length,
  };
}

// ─── Pre-computed results ─────────────────────────────────────────────────────

export const OFFICIAL_DATASET = buildOfficialDataset();
export const COMMUNITY_DATASET = buildCommunityDataset();

// ─── Bottleneck distance (approximate L∞ matching) ───────────────────────────

/**
 * Approximate bottleneck distance between two persistence diagrams.
 *
 * Full bottleneck distance is NP-hard to compute exactly for large diagrams.
 * For small diagrams (< 10 non-trivial intervals) we use a greedy min-cost
 * bipartite matching on the finite-death intervals, ignoring the diagonal
 * contribution.
 *
 * The distance is the maximum edge weight in the minimum bottleneck matching
 * of persistence points, measured in the L∞ metric on the (birth, death) plane.
 *
 * This is the value discussed in the stability theorem of Cohen-Steiner et al.
 * (2007): d_B(dgm(f), dgm(g)) ≤ ||f − g||_∞.
 */
export function approximateBottleneckDistance(
  featuresA: PersistenceFeature[],
  featuresB: PersistenceFeature[],
  dimension: 0 | 1,
): number {
  const ptsA = featuresA
    .filter((f) => f.dimension === dimension && f.death !== null)
    .map((f) => [f.birth, f.death as number] as [number, number]);
  const ptsB = featuresB
    .filter((f) => f.dimension === dimension && f.death !== null)
    .map((f) => [f.birth, f.death as number] as [number, number]);

  if (ptsA.length === 0 && ptsB.length === 0) return 0;

  // Linfty distance between two diagram points
  const linfty = (p: [number, number], q: [number, number]) =>
    Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]));

  // Distance from a point p to the diagonal (nearest point on diagonal is ((b+d)/2, (b+d)/2))
  const distToDiag = (p: [number, number]) => (p[1] - p[0]) / 2;

  // Pad smaller set with diagonal projections
  const maxLen = Math.max(ptsA.length, ptsB.length);
  const augA = [...ptsA];
  const augB = [...ptsB];

  // For each unmatched point in A, pair it with its diagonal projection in B
  while (augA.length < maxLen) {
    const idx = augA.length;
    if (idx < ptsB.length) {
      const diag: [number, number] = [(ptsB[idx][0] + ptsB[idx][1]) / 2, (ptsB[idx][0] + ptsB[idx][1]) / 2];
      augA.push(diag);
    }
  }
  while (augB.length < maxLen) {
    const idx = augB.length;
    if (idx < ptsA.length) {
      const diag: [number, number] = [(ptsA[idx][0] + ptsA[idx][1]) / 2, (ptsA[idx][0] + ptsA[idx][1]) / 2];
      augB.push(diag);
    }
  }

  // Greedy: match closest pairs
  const used = new Set<number>();
  let maxDist = 0;
  for (const pa of augA) {
    let best = Infinity;
    let bestJ = -1;
    for (let j = 0; j < augB.length; j++) {
      if (used.has(j)) continue;
      const d = linfty(pa, augB[j]);
      if (d < best) { best = d; bestJ = j; }
    }
    if (bestJ >= 0) {
      used.add(bestJ);
      maxDist = Math.max(maxDist, best);
    }
  }

  return maxDist;
}

export const H0_BOTTLENECK = approximateBottleneckDistance(
  OFFICIAL_DATASET.features,
  COMMUNITY_DATASET.features,
  0,
);

export const H1_BOTTLENECK = approximateBottleneckDistance(
  OFFICIAL_DATASET.features,
  COMMUNITY_DATASET.features,
  1,
);
