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
      title: 'Drawing the Line',
      coreConcept: 'The poverty line is a political choice masquerading as a technical one.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 2,
      title: 'The Average Person',
      coreConcept: 'Statistical normality has always encoded political normality — Quetelet\'s l\'homme moyen carries ideological weight.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 3,
      title: 'Counting What Counts',
      coreConcept: 'The choice of what to include in the poverty basket encodes a theory of human need and desert.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 4,
      title: 'The Welfare Formula',
      coreConcept: 'Equivalisation scales translate household composition into a single income denominator — and each formula embeds a theory of economies of scale.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 5,
      title: 'Optimisation and Control',
      coreConcept: 'Welfare reform uses optimisation logic — minimising fiscal cost subject to work-incentive constraints — that treats the poor as a variable to be managed.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 6,
      title: 'The Score',
      coreConcept: 'Algorithmic scoring assigns a poverty likelihood to individuals; logistic regression and its social consequences.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 7,
      title: 'The Black Box',
      coreConcept: 'Neural networks in welfare administration operate without interpretable features — the right to explanation meets the limits of adversarial auditing.',
      estimatedMinutes: 15,
    },
    {
      moduleNumber: 8,
      title: 'Counter-Mathematics',
      coreConcept: 'Participatory statistics and data justice propose that the measured should control the measurement.',
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

/**
 * Maps the path-number prefix used in content entry IDs (e.g. 'path1', 'path2')
 * to the canonical URL slug for that learning path.
 *
 * This is the single source of truth for this mapping — import it wherever you need
 * to convert an entry ID prefix to a path slug (e.g. ModuleLayout connection links).
 * When a new path is added, update this map and the Zod enum in content.config.ts together.
 */
export const pathNumberToSlug: Record<string, string> = {
  path1: 'topology-social-scientists',
  path2: 'mathematics-of-poverty',
  path3: 'data-justice',
  path4: 'tda-practitioners',
};
