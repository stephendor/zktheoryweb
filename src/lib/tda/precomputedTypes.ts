/**
 * precomputedTypes.ts — Task 5.5b — Agent_Interactive_Advanced
 *
 * TypeScript types matching the pre-computed TDA JSON schema produced by
 * scripts/compute-tda.py. These types are shared between TDAResultsExplorer
 * and the test suite (TDAResultsExplorer.test.ts).
 */

export interface TDAFeature {
  birth: number;
  death: number;
}

export interface TDAPreset {
  metadata: {
    n_points: number;
    max_dimension: number;
    epsilon_range: [number, number];
  };
  point_cloud: [number, number][];
  diagrams: {
    H0: TDAFeature[];
    H1: TDAFeature[];
  };
}
