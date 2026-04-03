/**
 * src/data/learnPaths.ts — Task 4.1 — Agent_Design_Templates
 *
 * Static data constants for the two available learning paths and their modules.
 * This file is used by src/pages/learn/[path].astro to generate static routes
 * and render module lists without querying the content collection (MDX stubs
 * are added in Tasks 4.3/4.4).
 *
 * Palette: 'tda' → TDA Mathematical palette tokens; 'cl' → Counting Lives palette tokens.
 */

export type Palette = 'tda' | 'cl';

export interface LearnModule {
  moduleNumber: number;
  title: string;
  coreConcept: string;
  estimatedMinutes: number;
}

export interface LearnPath {
  slug: string;
  title: string;
  audience: string;
  estimatedTime: string;
  palette: Palette;
  modules: LearnModule[];
}

// ─── Path 1: Topology for Social Scientists ───────────────────────────────────

const topologySocialScientists: LearnPath = {
  slug: 'topology-social-scientists',
  title: 'Topology for Social Scientists',
  audience: 'Social researchers with no mathematics background',
  estimatedTime: '~4 hours',
  palette: 'tda',
  modules: [
    {
      moduleNumber: 1,
      title: 'What Is Shape? From Space to Data',
      coreConcept: 'Topology studies properties of space that survive continuous deformation — a framework for detecting hidden structure.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 2,
      title: 'Nearness Without Measurement',
      coreConcept: 'Metric spaces formalise the intuitive notion of closeness and form the foundation for all TDA distances.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 3,
      title: 'Simplicial Complexes: Building Shape from Points',
      coreConcept: 'A simplicial complex assembles triangles, edges, and vertices into a combinatorial representation of space.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 4,
      title: 'Holes and Connected Components',
      coreConcept: 'Homology counts the distinct "holes" at each dimension, providing a robust fingerprint of a dataset\'s shape.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 5,
      title: 'Filtrations: Shape Across Scales',
      coreConcept: 'A filtration is a growing sequence of simplicial complexes that reveals how topological features appear and disappear.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 6,
      title: 'Persistence Diagrams: Reading the Shape of Data',
      coreConcept: 'Persistent homology tracks which features survive longest, distinguishing signal from noise in a principled way.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 7,
      title: 'Mapper: A Bird\'s-Eye View of High-Dimensional Data',
      coreConcept: 'The Mapper algorithm compresses high-dimensional datasets into a navigable graph, revealing clusters and flares.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 8,
      title: 'TDA Meets Social Science: Case Studies',
      coreConcept: 'Applications of TDA to voting patterns, health inequalities, and poverty measurement demonstrate its social-science potential.',
      estimatedMinutes: 15,
    },
  ],
};

// ─── Path 2: Mathematics of Poverty ──────────────────────────────────────────

const mathematicsOfPoverty: LearnPath = {
  slug: 'mathematics-of-poverty',
  title: 'Mathematics of Poverty',
  audience: 'Policy analysts and economists',
  estimatedTime: '~4 hours',
  palette: 'cl',
  modules: [
    {
      moduleNumber: 1,
      title: 'Counting the Poor: A History of the Threshold',
      coreConcept: 'From Booth and Rowntree to the present day, poverty measurement has always embedded contested political choices.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 2,
      title: 'Absolute vs Relative Poverty: Two Traditions',
      coreConcept: 'Absolute thresholds fix a basket of necessities; relative thresholds tie poverty to the median — both are political acts.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 3,
      title: 'The Normal Distribution and the "Average Man"',
      coreConcept: 'Quetelet\'s application of the bell curve to human populations gave poverty measurement a statistical vocabulary — and its first major distortion.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 4,
      title: 'Index Construction: From Sen to the MPI',
      coreConcept: 'Multidimensional poverty indices aggregate deprivations across dimensions using axiomatic social-choice theory.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 5,
      title: 'Equivalence Scales and Household Composition',
      coreConcept: 'Equivalence scales convert household income to a per-adult-equivalent figure — a transformation that hides enormous assumptions.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 6,
      title: 'Persistent Deprivation: A Topological Reading',
      coreConcept: 'Applying homology to welfare-state data reveals structural clusters of deprivation invisible to regression analysis.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 7,
      title: 'Sensitivity Analysis: How Thresholds Shape Outcomes',
      coreConcept: 'Small changes in the poverty line can move millions in or out of poverty — sensitivity analysis quantifies this instability.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 8,
      title: 'Towards a Geometry of Social Policy',
      coreConcept: 'TDA provides a mathematically rigorous, policy-neutral framework for comparing welfare systems without choosing a single threshold.',
      estimatedMinutes: 15,
    },
  ],
};

// ─── Exported map ─────────────────────────────────────────────────────────────

export const learnPaths: Record<string, LearnPath> = {
  'topology-social-scientists': topologySocialScientists,
  'mathematics-of-poverty': mathematicsOfPoverty,
};

export const availablePathSlugs = Object.keys(learnPaths) as Array<keyof typeof learnPaths>;
