/**
 * glossary.ts — Task 4.6 — Agent_Integration
 *
 * Static data file (not a content collection) providing the shared glossary
 * spanning the TDA research programme and the Counting Lives project.
 *
 * Each entry carries 1–2 domain-specific definitions, related term slugs,
 * and links to site content (chapters, papers, methods, modules).
 */

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface GlossaryDefinition {
  domain: 'TDA' | 'Counting Lives' | 'Shared';
  /** 1–3 sentences */
  text: string;
}

export interface GlossaryEntry {
  term: string;
  /** kebab-case, globally unique */
  slug: string;
  definitions: GlossaryDefinition[]; // 1–2 entries, one per relevant domain
  relatedTerms: string[]; // slugs of related glossary entries
  linkedContent: {
    chapters: number[]; // Counting Lives chapter numbers
    papers: number[];   // TDA paper numbers
    methods: string[];  // method page slugs
    modules: string[];  // learn module MDX slugs
  };
}

// ─── Glossary Data ────────────────────────────────────────────────────────────

export const glossaryEntries: GlossaryEntry[] = [
  // ── TDA Terms ──────────────────────────────────────────────────────────────

  {
    term: 'Topological Data Analysis',
    slug: 'topological-data-analysis',
    definitions: [
      {
        domain: 'TDA',
        text:
          'An applied branch of mathematics that uses topological invariants — properties preserved under continuous deformation — to extract structural patterns from high-dimensional data. Where classical statistics summarises data through means and variances, TDA characterises data through the "shape" of the point cloud it forms in feature space.',
      },
    ],
    relatedTerms: [
      'persistent-homology',
      'simplicial-complex',
      'betti-number',
      'point-cloud',
      'filtration',
      'mapper-algorithm',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology', 'mapper', 'markov-memory-ladder'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Persistent Homology',
    slug: 'persistent-homology',
    definitions: [
      {
        domain: 'TDA',
        text:
          'The core technique in TDA that tracks how topological features — connected components, loops, and voids — are born and die as a scale parameter ε increases across a filtration. The resulting persistence diagram or barcode records the lifespan of every feature; long-lived features signal genuine structure, short-lived ones signal noise.',
      },
    ],
    relatedTerms: [
      'filtration',
      'simplicial-complex',
      'vietoris-rips-complex',
      'persistence-diagram',
      'betti-number',
      'homology-group',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Simplicial Complex',
    slug: 'simplicial-complex',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A higher-dimensional generalisation of a graph, built from vertices, edges, triangles, tetrahedra, and their higher-dimensional analogues (simplices), assembled so that every face of a simplex is also present. Simplicial complexes are the combinatorial scaffolding on which homology groups — and thereby persistent homology — are computed.',
      },
    ],
    relatedTerms: [
      'persistent-homology',
      'filtration',
      'vietoris-rips-complex',
      'homology-group',
      'point-cloud',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7],
      methods: ['persistent-homology'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Filtration',
    slug: 'filtration',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A nested sequence of simplicial complexes parameterised by a scale value ε, where each complex is included in the next: ∅ ⊆ K(ε₁) ⊆ K(ε₂) ⊆ ⋯. Running a filtration converts a static dataset into a dynamic topological process whose evolution persistent homology can track across all scales simultaneously.',
      },
      {
        domain: 'Shared',
        text:
          'The progressive application of thresholds or scales to data — analogous in poverty measurement to varying a poverty line to observe which households enter or leave the measured population at each level. Both TDA filtrations and poverty thresholds make visible different structural features depending on the chosen scale.',
      },
    ],
    relatedTerms: [
      'persistent-homology',
      'simplicial-complex',
      'vietoris-rips-complex',
      'threshold',
    ],
    linkedContent: {
      chapters: [1, 3],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology', 'markov-memory-ladder'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Betti Number',
    slug: 'betti-number',
    definitions: [
      {
        domain: 'TDA',
        text:
          'An integer invariant that counts a specific class of topological feature: β₀ counts connected components, β₁ counts independent loops (one-dimensional holes), and β₂ counts enclosed voids. In persistent homology, Betti numbers change as the filtration parameter increases, and the record of those changes constitutes the barcode.',
      },
    ],
    relatedTerms: [
      'persistent-homology',
      'homology-group',
      'persistence-diagram',
      'filtration',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology', 'markov-memory-ladder'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Vietoris–Rips Complex',
    slug: 'vietoris-rips-complex',
    definitions: [
      {
        domain: 'TDA',
        text:
          'The simplicial complex built from a point cloud by connecting every pair of points within distance ε with an edge, every triple within diameter ε with a triangle, and so on for all higher dimensions. The Vietoris–Rips construction is the standard filtration for finite metric spaces: tractable to compute and provably stable under perturbations of the input data.',
      },
    ],
    relatedTerms: [
      'simplicial-complex',
      'filtration',
      'persistent-homology',
      'metric-space',
      'point-cloud',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Persistence Diagram',
    slug: 'persistence-diagram',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A multiset of points in the extended plane encoding the birth–death pairs (b, d) of every topological feature across a filtration. Points near the diagonal (b ≈ d) represent ephemeral noise; points far from the diagonal represent structurally significant, persistent features. Two persistence diagrams can be compared using the Wasserstein or bottleneck distance.',
      },
    ],
    relatedTerms: [
      'persistent-homology',
      'betti-number',
      'wasserstein-distance',
      'filtration',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology', 'markov-memory-ladder'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Wasserstein Distance',
    slug: 'wasserstein-distance',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A metric on the space of persistence diagrams computed as the minimum cost of matching the points of one diagram to the points of another, with unmatched points assigned to the nearest diagonal point. Used to quantify how much two datasets differ topologically, and to prove stability theorems for persistent homology.',
      },
      {
        domain: 'Shared',
        text:
          'A measure of dissimilarity between two probability distributions, interpretable as the minimum "work" required to rearrange one distribution into another. In poverty measurement, it offers a principled way to compare the welfare distributions of different populations or time periods that accounts for the entire shape of the distribution rather than only its tails.',
      },
    ],
    relatedTerms: [
      'persistence-diagram',
      'metric-space',
      'distribution',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology'],
      modules: [],
    },
  },

  {
    term: 'Mapper Algorithm',
    slug: 'mapper-algorithm',
    definitions: [
      {
        domain: 'TDA',
        text:
          'An algorithm that produces a compressed graph ("transit map") of a high-dimensional dataset by partitioning the image of a lens function into overlapping intervals, clustering the pre-image of each interval, and connecting overlapping clusters with edges. The resulting graph preserves global topological structure while discarding irrelevant detail, making the shape of the data legible.',
      },
    ],
    relatedTerms: [
      'point-cloud',
      'filtration',
      'metric-space',
      'simplicial-complex',
      'topological-data-analysis',
    ],
    linkedContent: {
      chapters: [],
      papers: [2, 5, 7],
      methods: ['mapper'],
      modules: [],
    },
  },

  {
    term: 'Homology Group',
    slug: 'homology-group',
    definitions: [
      {
        domain: 'TDA',
        text:
          'An algebraic object computed from a simplicial complex whose rank equals the corresponding Betti number. H₀ encodes connectivity, H₁ encodes loops, H₂ encodes enclosed voids. Persistent homology tracks how homology groups change across a filtration, expressing those changes as birth–death pairs in the persistence diagram.',
      },
    ],
    relatedTerms: [
      'betti-number',
      'simplicial-complex',
      'persistent-homology',
      'filtration',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology'],
      modules: ['path1-module-1'],
    },
  },

  // ── Counting Lives Terms ────────────────────────────────────────────────────

  {
    term: 'Poverty Line',
    slug: 'poverty-line',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'An income threshold below which a household is classified as "poor" for the purposes of official measurement. First formalised by Seebohm Rowntree in 1901 as a minimum dietary standard translated into a weekly income floor, the poverty line is simultaneously a scientific instrument and a political limit: it determines who is counted, and therefore who receives attention, resources, and rights.',
      },
      {
        domain: 'Shared',
        text:
          'Any threshold dividing a statistical population into two categories — above and below — analogous to a filtration scale determining which topological features are counted at a given resolution. In both cases, the choice of threshold is a methodological decision that structures what the analysis can see.',
      },
    ],
    relatedTerms: [
      'threshold',
      'absolute-poverty',
      'relative-poverty',
      'orshansky-threshold',
      'basket-of-goods-method',
      'measurement',
    ],
    linkedContent: {
      chapters: [1, 2, 3, 5],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Equivalisation',
    slug: 'equivalisation',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'The statistical adjustment of household income to account for differences in household size and composition, using an equivalence scale (such as the OECD modified scale) so that living standards can be compared across households of different structures. The choice of equivalence scale embeds contested assumptions about economies of scale in household consumption.',
      },
    ],
    relatedTerms: [
      'poverty-line',
      'normalisation',
      'measurement',
    ],
    linkedContent: {
      chapters: [3, 5],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Absolute Poverty',
    slug: 'absolute-poverty',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'A poverty standard defined by a fixed basket of minimum necessities whose cost determines the poverty threshold, regardless of prevailing living standards in the wider population. The absolute threshold does not rise when median incomes rise; Rowntree\'s dietary minimum and Orshansky\'s US poverty line are the paradigm cases. Critics argue absolute thresholds become increasingly disconnected from social reality over time.',
      },
    ],
    relatedTerms: [
      'poverty-line',
      'relative-poverty',
      'basket-of-goods-method',
      'orshansky-threshold',
    ],
    linkedContent: {
      chapters: [1, 3],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Relative Poverty',
    slug: 'relative-poverty',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'A poverty standard defined as a fraction (typically 60%) of a national income measure — usually median equivalised household income — so that the threshold moves with median income over time. Relative poverty measures capture social exclusion from prevailing living standards rather than absolute deprivation, but can produce counterintuitive results when median incomes fall sharply.',
      },
    ],
    relatedTerms: [
      'poverty-line',
      'absolute-poverty',
      'equivalisation',
      'distribution',
    ],
    linkedContent: {
      chapters: [3, 5],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Basket-of-Goods Method',
    slug: 'basket-of-goods-method',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'The construction of a poverty threshold by pricing a defined set of goods and services deemed necessary for a minimum standard of living. The method appears objective — it is, after all, just arithmetic — but the composition of the basket embeds normative judgements about what constitutes necessity, whose bodies and domestic arrangements are assumed, and at what prices goods are expected to be purchased.',
      },
    ],
    relatedTerms: [
      'poverty-line',
      'absolute-poverty',
      'orshansky-threshold',
    ],
    linkedContent: {
      chapters: [1, 3],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Orshansky Threshold',
    slug: 'orshansky-threshold',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'The US official poverty measure, devised by Social Security Administration economist Mollie Orshansky in 1963–1965 as a multiple of the Department of Agriculture\'s Economy Food Plan cost. Updated annually for price inflation but structurally unchanged since 1969, it is widely criticised for not reflecting changes in living standards, consumption patterns, or housing costs over the intervening decades.',
      },
    ],
    relatedTerms: [
      'poverty-line',
      'basket-of-goods-method',
      'absolute-poverty',
    ],
    linkedContent: {
      chapters: [5],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Universal Credit Taper Rate',
    slug: 'universal-credit-taper-rate',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'The rate at which Universal Credit (the UK\'s consolidated working-age benefit) is withdrawn as a claimant\'s earnings rise, currently 55p per pound earned above the work allowance. This creates a high effective marginal tax rate for low-wage workers transitioning from welfare to work, and reflects a design tension — present throughout the history of means-tested benefits — between income adequacy, work incentives, and fiscal cost.',
      },
    ],
    relatedTerms: [
      'poverty-line',
      'data-justice',
      'measurement',
    ],
    linkedContent: {
      chapters: [3, 5],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Data Justice',
    slug: 'data-justice',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'A framework for evaluating data systems — including poverty measurement infrastructures — according to their effects on power, autonomy, and harm for the populations they describe. Data justice asks: who controls the data, who is made legible (and who remains invisible), what harms follow from being counted in particular ways, and whether affected communities have any say in the measurement design.',
      },
      {
        domain: 'Shared',
        text:
          'The application of justice frameworks to any algorithmic or quantitative system that classifies, scores, or thresholds a population — including TDA methods applied to social trajectory data — asking whether the system\'s design choices systematically disadvantage particular groups.',
      },
    ],
    relatedTerms: [
      'counter-mathematics',
      'measurement',
      'poverty-line',
      'algorithm',
    ],
    linkedContent: {
      chapters: [4, 5],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Counter-Mathematics',
    slug: 'counter-mathematics',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          'A practice of repurposing or reframing mathematical and statistical tools to expose the political assumptions embedded in dominant measurement systems. In the Counting Lives project, this means deploying TDA\'s topology-first lens to make visible the structural violence that official poverty statistics conceal — using math against the uses to which math has historically been put in poverty research.',
      },
    ],
    relatedTerms: [
      'data-justice',
      'measurement',
      'topological-data-analysis',
    ],
    linkedContent: {
      chapters: [1, 2, 3, 4, 5],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: "L'homme moyen",
    slug: 'l-homme-moyen',
    definitions: [
      {
        domain: 'Counting Lives',
        text:
          "Adolphe Quetelet's concept of the \"average man\" — the statistical centre of a normally distributed human population, which Quetelet proposed as a social ideal rather than merely a mathematical artefact. Applied to poverty, l'homme moyen naturalised social inequality: the poor became statistical deviants from the social norm rather than products of political economy, a move that would echo through a century of social measurement.",
      },
    ],
    relatedTerms: [
      'distribution',
      'normalisation',
      'measurement',
    ],
    linkedContent: {
      chapters: [1, 2],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  // ── Shared Terms ───────────────────────────────────────────────────────────

  {
    term: 'Point Cloud',
    slug: 'point-cloud',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A finite set of points in a metric space, treated as the primary data object in TDA. Rather than imposing a grid or coordinate system, TDA analyses the intrinsic geometric and topological structure of the cloud itself — the shape of the data, independent of how it is embedded or represented.',
      },
      {
        domain: 'Counting Lives',
        text:
          'A collection of individuals or households positioned in a high-dimensional welfare-indicator space. The topological shape of this cloud can encode structural features of poverty — concentrations, gaps, topological holes — that aggregate statistics (mean income, poverty headcount) fundamentally cannot capture.',
      },
    ],
    relatedTerms: [
      'metric-space',
      'vietoris-rips-complex',
      'mapper-algorithm',
      'persistent-homology',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7],
      methods: ['persistent-homology', 'mapper'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Metric Space',
    slug: 'metric-space',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A set equipped with a distance function satisfying non-negativity, symmetry, and the triangle inequality. The choice of distance function determines which topological features are detectable in a dataset; different metrics applied to the same data can reveal qualitatively different structural properties, making metric choice a substantive methodological decision.',
      },
      {
        domain: 'Counting Lives',
        text:
          'The implicit geometric structure assumed by any poverty measurement: an income or welfare space in which individuals are separated by a distance that determines who is "near" the poverty threshold and who is not. The choice of distance measure — income, consumption, capability, subjective wellbeing — is a political as much as a technical decision.',
      },
    ],
    relatedTerms: [
      'vietoris-rips-complex',
      'point-cloud',
      'wasserstein-distance',
      'filtration',
    ],
    linkedContent: {
      chapters: [],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology', 'mapper'],
      modules: ['path1-module-1'],
    },
  },

  {
    term: 'Threshold',
    slug: 'threshold',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A scale parameter in a filtration above which topological features are included in the current simplicial complex. Varying the threshold traces the birth and death of topological features across scales, enabling a multi-resolution picture of the data\'s structure that no single threshold can provide.',
      },
      {
        domain: 'Counting Lives',
        text:
          'An income or expenditure level that divides the population into "poor" and "not poor." The choice of threshold level is a political as much as a technical decision, embedding assumptions about minimum needs, social standards, and the scope of welfare entitlement — yet it typically presents in official statistics as a neutral technical parameter.',
      },
    ],
    relatedTerms: [
      'poverty-line',
      'filtration',
      'distribution',
      'measurement',
    ],
    linkedContent: {
      chapters: [1, 2, 3, 5],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology'],
      modules: [],
    },
  },

  {
    term: 'Distribution',
    slug: 'distribution',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A probability distribution over a feature space, whose topological shape — as revealed by persistent homology — encodes structural properties invisible to summary statistics such as mean and variance. Topological analysis can detect multimodality, connectivity gaps, and other structural features that a Gaussian approximation would obscure.',
      },
      {
        domain: 'Counting Lives',
        text:
          'The spread of income or welfare across a population; the shape of the income distribution — degree of inequality, density near the poverty line, thickness of the lower tail — determines who is counted as poor under different measurement conventions, and how sensitive the poverty headcount is to small changes in the threshold.',
      },
    ],
    relatedTerms: [
      'normalisation',
      'threshold',
      'betti-number',
      'wasserstein-distance',
      'l-homme-moyen',
    ],
    linkedContent: {
      chapters: [1, 2, 5],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology'],
      modules: [],
    },
  },

  {
    term: 'Algorithm',
    slug: 'algorithm',
    definitions: [
      {
        domain: 'TDA',
        text:
          'A finite, deterministic procedure — such as the standard persistent homology algorithm or the Mapper construction — that transforms input data (typically a distance matrix or point cloud) into a topological summary. Key properties include computational complexity, sensitivity to parameter choices, and stability under perturbation of the input.',
      },
      {
        domain: 'Counting Lives',
        text:
          'A computational procedure embedded in welfare administration — benefit eligibility calculation, means testing, fraud detection, credit scoring — whose design choices encode policy values that present as technical neutrality. The history of poverty measurement shows that algorithmic systems inherit and amplify the political assumptions of the measurement frameworks they implement.',
      },
    ],
    relatedTerms: [
      'mapper-algorithm',
      'measurement',
      'data-justice',
      'topological-data-analysis',
    ],
    linkedContent: {
      chapters: [5],
      papers: [1, 2, 3, 4, 5, 6, 7, 10],
      methods: ['persistent-homology', 'mapper', 'markov-memory-ladder'],
      modules: [],
    },
  },

  {
    term: 'Measurement',
    slug: 'measurement',
    definitions: [
      {
        domain: 'TDA',
        text:
          'The process of assigning topological or numerical values to features of a dataset; in TDA, measurement is multi-scale and geometry-aware, producing summaries that are provably stable under perturbation of the input and invariant under continuous deformation of the space.',
      },
      {
        domain: 'Counting Lives',
        text:
          'The social practice of assigning numbers to conditions of life. In poverty research, measurement is never neutral — it embeds normative choices about what to count, who does the counting, and what counts as evidence. The history of poverty measurement is, at its core, a history of contested representations of who counts as poor and whose poverty counts.',
      },
    ],
    relatedTerms: [
      'threshold',
      'data-justice',
      'counter-mathematics',
      'normalisation',
      'poverty-line',
    ],
    linkedContent: {
      chapters: [1, 2, 3, 4, 5],
      papers: [],
      methods: [],
      modules: [],
    },
  },

  {
    term: 'Normalisation',
    slug: 'normalisation',
    definitions: [
      {
        domain: 'TDA',
        text:
          'The rescaling of input features to a common range (e.g. [0, 1]) before computing pairwise distances. Normalisation choices affect which topological features are detected and which are suppressed; they should be documented and justified as part of any TDA methodology, since normalisation is itself a substantive analytical decision.',
      },
      {
        domain: 'Counting Lives',
        text:
          'The statistical adjustment of an outcome variable — income, expenditure, caloric intake — to account for household size, composition, regional price level, or time. Normalisation procedures embed assumptions about household economies of scale and equivalence that are politically contested, yet they typically pass without comment in published statistics.',
      },
    ],
    relatedTerms: [
      'equivalisation',
      'distribution',
      'measurement',
      'l-homme-moyen',
    ],
    linkedContent: {
      chapters: [1, 3, 5],
      papers: [],
      methods: ['persistent-homology'],
      modules: [],
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Look up a single glossary entry by its kebab-case slug.
 * Returns `undefined` if no matching entry is found.
 */
export function getBySlug(slug: string): GlossaryEntry | undefined {
  return glossaryEntries.find((entry) => entry.slug === slug);
}
