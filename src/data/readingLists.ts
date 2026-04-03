/**
 * readingLists.ts — Task 4.7 — Agent_Content
 *
 * Curated reading lists organised by topic and level.
 *
 * Zotero key lookup:
 *   zoteroKey: string  — matches item.key (8-char Zotero ID) in zotero-library.json
 *   zoteroKey: null    — item not in library; use fallbackCitation
 *
 * Build-time resolution is handled by the [slug].astro page, which calls
 * getCitationByKey() from src/lib/bibliography.ts for non-null keys,
 * falling back to fallbackCitation when key is null or not found.
 */

export interface ReadingListEntry {
  zoteroKey: string | null;
  fallbackCitation?: string;
  annotation: string;
  level: 'introductory' | 'intermediate' | 'advanced';
  connections: {
    chapters: number[];
    papers: number[];
    paths: string[];
  };
}

export interface ReadingList {
  slug: string;
  title: string;
  topic: 'topology' | 'poverty-measurement' | 'data-justice' | 'tda-methods';
  description: string;
  entries: ReadingListEntry[];
}

export const readingLists: ReadingList[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. TDA Foundations
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'tda-foundations',
    title: 'TDA Foundations',
    topic: 'topology',
    description:
      'Core texts for understanding persistent homology and topological data analysis, from introductory primers to landmark research papers.',
    entries: [
      {
        zoteroKey: 'SHTYVPQ7',
        annotation:
          'The standard graduate-level introduction to computational topology. Edelsbrunner and Harer develop persistent homology with rigorous mathematical precision while keeping geometric intuition central. Chapter 7 on persistence is essential reading for anyone working with TDA on real data.',
        level: 'advanced',
        connections: {
          chapters: [3, 4, 5],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: '9S7AFYQ5',
        annotation:
          'Carlsson\'s survey in the Bulletin of the AMS is the most widely cited introduction to TDA. It covers simplicial complexes, persistent homology, and the mapper algorithm in under 55 pages, making it accessible to anyone with basic algebraic topology. An ideal starting point before the full Edelsbrunner–Harer textbook.',
        level: 'introductory',
        connections: {
          chapters: [1, 2],
          papers: [],
          paths: ['topology-social-scientists', 'tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Ghrist, R. (2008). Barcodes: The persistent topology of data. Bulletin of the American Mathematical Society, 45(1), 61–75.',
        annotation:
          'Ghrist\'s short paper popularised the "barcode" metaphor for persistence diagrams. It is one of the most readable introductions to why topological features persist across scales and what that tells us about the shape of data. Strongly recommended as a first encounter with the key ideas.',
        level: 'introductory',
        connections: {
          chapters: [1, 2],
          papers: [],
          paths: ['topology-social-scientists', 'tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Oudot, S. Y. (2017). Persistence theory: From quiver representations to data analysis. American Mathematical Society.',
        annotation:
          'Oudot approaches persistence from the perspective of quiver representations in algebra, providing a more algebraically rigorous foundation than Edelsbrunner–Harer. Essential for readers who want a deep understanding of the theoretical structure underlying the stability and uniqueness theorems that make TDA work.',
        level: 'advanced',
        connections: {
          chapters: [4, 5],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: 'N3ARF7VD',
        annotation:
          'Zomorodian and Carlsson\'s 2005 paper established the algebraic foundation of persistent homology by connecting persistence modules to graded modules over a polynomial ring. Their Matrix Reduction algorithm is still the basis for most practical TDA software. A technically demanding but essential paper.',
        level: 'advanced',
        connections: {
          chapters: [3, 4],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: '9HTUWNPG',
        annotation:
          'The 2002 paper that introduced topological persistence and the first computationally practical algorithm for computing it. Edelsbrunner, Letscher, and Zomorodian\'s reduction algorithm transformed an abstract mathematical idea into an implementable procedure. Reading this alongside the Zomorodian–Carlsson paper shows how the field progressed.',
        level: 'advanced',
        connections: {
          chapters: [3, 4],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Kaczynski, T., Mischaikow, K., & Mrozek, M. (2004). Computational Homology. Springer-Verlag.',
        annotation:
          'A practical introduction to computing homology groups that bridges abstract algebra and implementation. Less focused on persistence than Edelsbrunner–Harer, but an invaluable companion for understanding the algebraic machinery (chain complexes, boundary matrices) that underpins TDA algorithms.',
        level: 'intermediate',
        connections: {
          chapters: [2, 3],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Wasserman, L. (2018). Topological data analysis. Annual Review of Statistics and Its Application, 5, 501–532.',
        annotation:
          'A statistician\'s introduction to TDA, covering persistent homology and the mapper algorithm from the perspective of statistical inference. Wasserman is unusually clear on confidence sets for persistence diagrams and bootstrapping procedures — essential reading for anyone thinking about uncertainty quantification in TDA.',
        level: 'intermediate',
        connections: {
          chapters: [2, 3],
          papers: [],
          paths: ['topology-social-scientists', 'tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Lum, P. Y., Singh, G., Lehman, A., Ishkanov, T., Vejdemo-Johansson, M., Alagappan, M., … Carlsson, G. (2013). Extracting insights from the shape of complex data using topology. Scientific Reports, 3, 1236.',
        annotation:
          'A highly accessible demonstration of the mapper algorithm applied to real scientific datasets, including human genetics and basketball statistics. This paper is often used as an entry point for non-mathematicians who want to see what TDA can do before engaging with the formal theory.',
        level: 'introductory',
        connections: {
          chapters: [1, 2],
          papers: [],
          paths: ['topology-social-scientists'],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Poverty Measurement Classics
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'poverty-measurement-classics',
    title: 'Poverty Measurement Classics',
    topic: 'poverty-measurement',
    description:
      'Foundational texts in the history and methodology of poverty measurement, from Victorian social surveys to twentieth-century conceptual debates.',
    entries: [
      {
        zoteroKey: 'ST8ZEKWM',
        annotation:
          'Rowntree\'s 1901 survey of York is the origin of the scientific poverty line in Britain. His "primary poverty" threshold — calories needed for physical efficiency — established the template of subsistence-based measurement that would shape welfare policy for a century. Reading Rowntree today reveals both the power and the limitations of the efficiency model.',
        level: 'introductory',
        connections: {
          chapters: [1],
          papers: [1],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Orshansky, M. (1965). Counting the poor: Another look at the poverty profile. Social Security Bulletin, 28(1), 3–29.',
        annotation:
          'The paper that gave the United States its official poverty line. Orshansky designed the threshold as a temporary measure and spent the rest of her career critiquing its misapplication. Understanding her original methodology — and her later objections — is essential context for any contemporary discussion of absolute poverty measurement.',
        level: 'introductory',
        connections: {
          chapters: [1, 2],
          papers: [1],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Atkinson, A. B. (1969). Poverty in Britain and the Reform of Social Security. Cambridge University Press.',
        annotation:
          'Atkinson\'s early work introduced the notion that the poverty line is necessarily political — that no purely technical procedure can determine where the line should fall. This insight, which distinguishes relative from absolute approaches, anticipates the capability and social exclusion frameworks that dominate contemporary research.',
        level: 'intermediate',
        connections: {
          chapters: [2],
          papers: [2],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Sen, A. (1981). Poverty and Famines: An Essay on Entitlement and Deprivation. Oxford University Press.',
        annotation:
          'Sen\'s entitlement framework shifted poverty analysis from income to capabilities and command over resources. By showing that famines occur even when food is abundant — because the poor lose their entitlements — he demonstrated that poverty is a relational phenomenon, not simply a shortfall below a threshold. Foundational for the capability approach.',
        level: 'intermediate',
        connections: {
          chapters: [2, 3],
          papers: [2],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: 'Z9L5H83N',
        annotation:
          'Townsend\'s 1,200-page survey remains the most comprehensive attempt at a relative, sociologically grounded poverty measure. His "deprivation index" tried to identify the income level at which households began to fall out of ordinary social participation. The methodological debates it generated — especially the exchange with Piachaud — define the field.',
        level: 'intermediate',
        connections: {
          chapters: [2, 3],
          papers: [2],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Lister, R. (2004). Poverty. Polity Press.',
        annotation:
          'Ruth Lister\'s accessible synthesis integrates the quantitative measurement tradition with the lived experience of poverty, drawing on feminist and capability approaches. She insists that poverty involves not only lack of resources but disrespect, powerlessness, and social exclusion — a multi-dimensional understanding that connects to this project\'s use of TDA.',
        level: 'introductory',
        connections: {
          chapters: [1, 2, 3],
          papers: [1, 2],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Brady, D. (2003). Rethinking the sociological measurement of poverty. Social Forces, 81(3), 715–751.',
        annotation:
          'Brady\'s critique of US-centric absolute measures proposes empirically anchored relative measures calibrated to each society\'s median income. His paper is a useful bridge between the classical texts and contemporary cross-national comparative work, and introduces statistical regularisation ideas with direct relevance to the TDA framing.',
        level: 'intermediate',
        connections: {
          chapters: [2, 3],
          papers: [3],
          paths: ['mathematics-of-poverty', 'topology-social-scientists'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Gordon, D., & Pantazis, C. (Eds.). (1997). Breadline Britain in the 1990s. Ashgate.',
        annotation:
          'Applies the Townsend deprivation approach with updated survey data, refining the methodology through factor analysis and logistic regression. This volume documents the continued relevance of relative poverty measurement in the British context through the 1990s, and is a practical complement to Townsend\'s theoretical framework.',
        level: 'intermediate',
        connections: {
          chapters: [2, 3],
          papers: [2],
          paths: ['mathematics-of-poverty'],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Data Justice & Algorithmic Harm
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'data-justice-algorithmic-harm',
    title: 'Data Justice & Algorithmic Harm',
    topic: 'data-justice',
    description:
      'Critical scholarship on algorithmic systems, data collection, and their disproportionate harms to marginalised communities.',
    entries: [
      {
        zoteroKey: null,
        fallbackCitation:
          'Eubanks, V. (2018). Automating Inequality: How High-Tech Tools Profile, Police, and Punish the Poor. St. Martin\'s Press.',
        annotation:
          'Eubanks documents how automated systems in public services — from child welfare algorithms to predictive policing — systematically disadvantage poor and working-class communities. Her case studies from Pennsylvania, Indiana, and Los Angeles show that "objective" algorithmic scoring often encodes existing inequalities, making their consequences harder to contest.',
        level: 'introductory',
        connections: {
          chapters: [3],
          papers: [3],
          paths: ['data-justice', 'mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Noble, S. U. (2018). Algorithms of Oppression: How Search Engines Reinforce Racism. NYU Press.',
        annotation:
          'Noble analyses the racial biases embedded in commercial search algorithms, arguing that these systems function as instruments of power that reproduce white supremacist ideas through the apparently neutral operation of relevance ranking. Essential for understanding how statistical models trained on historical data perpetuate structural discrimination.',
        level: 'introductory',
        connections: {
          chapters: [3],
          papers: [3],
          paths: ['data-justice'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'O\'Neil, C. (2016). Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy. Crown.',
        annotation:
          'O\'Neil coined the term "weapon of math destruction" for models that are opaque, unaccountable, and operate at scale — creating feedback loops that entrench disadvantage. Her accessible survey covers teacher evaluation, credit scoring, recidivism prediction, and targeted advertising, providing an essential vocabulary for critical data analysis.',
        level: 'introductory',
        connections: {
          chapters: [3],
          papers: [3],
          paths: ['data-justice', 'mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'D\'Ignazio, C., & Klein, L. F. (2020). Data Feminism. MIT Press.',
        annotation:
          'Drawing on feminist theory and data science practice, D\'Ignazio and Klein argue that data work is never value-neutral. The book introduces seven principles — from "examine power" to "make labour visible" — that provide a practical framework for critical data literacy. Particularly relevant for the counting lives strand of this project.',
        level: 'introductory',
        connections: {
          chapters: [1, 3],
          papers: [3],
          paths: ['data-justice', 'mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Benjamin, R. (2019). Race After Technology: Abolitionist Tools for the New Jim Code. Polity Press.',
        annotation:
          'Benjamin\'s "New Jim Code" concept names the way technology encodes racial hierarchy while projecting neutrality. By tracing the design choices behind facial recognition, predictive policing, and health algorithms, she shows that racism is baked into technical artefacts — a structural argument that complements Eubanks\' case-study approach.',
        level: 'introductory',
        connections: {
          chapters: [3],
          papers: [3],
          paths: ['data-justice'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Zuboff, S. (2019). The Age of Surveillance Capitalism: The Fight for a Human Future at the New Frontier of Power. PublicAffairs.',
        annotation:
          'Zuboff develops the concept of "surveillance capitalism" — an economic logic that claims human experience as raw material for behavioural prediction products. While wide-ranging in scope, Part II on the instrumentation of everyday life is most directly relevant to poverty measurement contexts where administrative data collection creates asymmetric power relations.',
        level: 'intermediate',
        connections: {
          chapters: [3],
          papers: [3],
          paths: ['data-justice'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Pasquale, F. (2015). The Black Box Society: The Secret Algorithms That Control Money and Information. Harvard University Press.',
        annotation:
          'Pasquale examines the opacity of financial and search algorithms from a legal perspective, arguing for accountability and transparency requirements. His policy-oriented analysis is a useful complement to the sociological and critical race theory approaches of other entries, and introduces concepts of algorithmic accountability that have shaped subsequent regulation.',
        level: 'intermediate',
        connections: {
          chapters: [3],
          papers: [3],
          paths: ['data-justice'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Milan, S., & Treré, E. (2019). Big data from the South(s): Beyond data universalism. Television & New Media, 20(4), 319–335.',
        annotation:
          'Milan and Treré challenge the assumption that "big data" is a universal phenomenon, arguing that algorithmic systems are experienced differently in the Global South. Their framework of "data universalism" — the imposition of Northern data practices and concepts onto Southern contexts — is essential for situating poverty measurement within global power structures.',
        level: 'intermediate',
        connections: {
          chapters: [3],
          papers: [3],
          paths: ['data-justice'],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. History & Philosophy of Statistics
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'history-philosophy-statistics',
    title: 'History & Philosophy of Statistics',
    topic: 'poverty-measurement',
    description:
      'Histories of how statistical thinking developed and became embedded in government, science, and social life — essential context for understanding what numbers about poverty can and cannot tell us.',
    entries: [
      {
        zoteroKey: 'KZQA9GZ6',
        annotation:
          'Porter argues that the drive to quantify is not simply a response to scientific success but a political and cultural phenomenon: numbers are trusted precisely because they appear to transcend individual judgement. For poverty measurement, this insight is crucial — the poverty line\'s credibility depends on its numerical form, not on its empirical adequacy.',
        level: 'intermediate',
        connections: {
          chapters: [1, 2],
          papers: [1],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Hacking, I. (1990). The Taming of Chance. Cambridge University Press.',
        annotation:
          'Hacking traces the nineteenth-century emergence of statistical reasoning as a way of governing populations, from actuarial tables to crime statistics. His concept of "making up people" through classification — turning statistical categories into social kinds — is directly relevant to how poverty thresholds create the very population they purport to describe.',
        level: 'intermediate',
        connections: {
          chapters: [1, 2],
          papers: [1],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: 'GQNJMTDN',
        annotation:
          'Desrosières offers a comparative history of national statistical systems, showing how different countries\' political cultures produced different statistical traditions. His account of how statistics and the state mutually constituted each other over two centuries is indispensable for understanding why poverty measurement looks so different in the US, UK, and France.',
        level: 'advanced',
        connections: {
          chapters: [1, 2],
          papers: [1],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: 'RA7KXK9V',
        annotation:
          'MacKenzie\'s sociological study of British statistics from 1865–1930 shows how statistical methods were developed in the context of eugenics and class politics. The correlation coefficient, the chi-squared test, and regression analysis were not neutral tools — they were instruments shaped by the social anxieties of their creators. Essential background for any critical use of statistics.',
        level: 'advanced',
        connections: {
          chapters: [1],
          papers: [1],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Gigerenzer, G., Swijtink, Z., Porter, T., Daston, L., Beatty, J., & Krüger, L. (1989). The Empire of Chance: How Probability Changed Science and Everyday Life. Cambridge University Press.',
        annotation:
          'A collaborative history of probability and statistics from the seventeenth century to the present, written by historians and philosophers of science. More accessible than Hacking or Desrosières, it is especially strong on the passage from classical probability to frequentist statistics and on the reception of probabilistic reasoning in different sciences.',
        level: 'intermediate',
        connections: {
          chapters: [1],
          papers: [],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Stigler, S. M. (1986). The History of Statistics: The Measurement of Uncertainty before 1900. Harvard University Press.',
        annotation:
          'Stigler\'s authoritative history of statistics traces the development of least squares, regression, correlation, and Bayesian inference, with detailed attention to the mathematical ideas and their social contexts. Less critical than MacKenzie but more technically thorough; useful as a reference for understanding the mathematical machinery before reading the critical histories.',
        level: 'advanced',
        connections: {
          chapters: [1],
          papers: [],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Espeland, W. N., & Stevens, M. L. (2008). A sociology of quantification. European Journal of Sociology, 49(3), 401–436.',
        annotation:
          'A concise sociological framework for understanding how quantification transforms the things it measures. Espeland and Stevens introduce the concept of "reactivity" — how measures change the behaviour of the people and institutions they track — which is directly applicable to welfare conditionality and poverty line politics.',
        level: 'intermediate',
        connections: {
          chapters: [2],
          papers: [1, 2],
          paths: ['mathematics-of-poverty'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Daston, L. (1987). The domestication of risk: Mathematical probability and insurance 1650–1830. In L. Krüger, L. J. Daston, & M. Heidelberger (Eds.), The Probabilistic Revolution: Vol. 1. Ideas in History (pp. 237–260). MIT Press.',
        annotation:
          'Daston\'s essay on the social history of probability shows how mathematical risk was domesticated for commercial insurance contexts long before it entered scientific practice. This historical grounding helps explain why probabilistic concepts feel natural in welfare contexts and why they carry ideological freight about individual responsibility and actuarial fairness.',
        level: 'advanced',
        connections: {
          chapters: [1],
          papers: [],
          paths: ['mathematics-of-poverty'],
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Applied TDA Methods
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'applied-tda-methods',
    title: 'Applied TDA Methods',
    topic: 'tda-methods',
    description:
      'Statistical and computational methods for applying topological data analysis to real datasets, including software references and probability theory for persistence diagrams.',
    entries: [
      {
        zoteroKey: null,
        fallbackCitation:
          'Chazal, F., & Michel, B. (2021). An introduction to topological data analysis: Fundamental and practical aspects for data scientists. Frontiers in Artificial Intelligence, 4, 667963.',
        annotation:
          'The most comprehensive and up-to-date survey of TDA for data scientists. Chazal and Michel cover persistent homology, mapper, Betti numbers, stability theorems, and statistical inference, with worked examples throughout. This should be the primary reference for practitioners who want to understand what TDA computes and why the results are statistically meaningful.',
        level: 'intermediate',
        connections: {
          chapters: [2, 3, 4, 5],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: 'PVNF8TA9',
        annotation:
          'Turner, Mileyko, Mukherjee, and Harer develop Fréchet means for distributions of persistence diagrams, establishing a rigorous framework for averaging and comparing collections of diagrams. This paper is essential for anyone wanting to do statistics on topological summaries — for example, comparing the persistent homology of poverty maps across regions.',
        level: 'advanced',
        connections: {
          chapters: [4, 5],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Bubenik, P. (2015). Statistical topological data analysis using persistence landscapes. Journal of Machine Learning Research, 16(1), 77–102.',
        annotation:
          'Bubenik introduces the persistence landscape — a functional summary of a persistence diagram that lives in a Hilbert space. This construction enables the application of standard statistical tools (means, variances, hypothesis tests) to topological summaries without the metric complications that affect the Wasserstein or bottleneck distances. A key paper for applied work.',
        level: 'intermediate',
        connections: {
          chapters: [4, 5],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Mileyko, Y., Mukherjee, S., & Harer, J. (2011). Probability measures on the space of persistence diagrams. Inverse Problems, 27(12), 124007.',
        annotation:
          'Establishes the foundational probability theory for persistence diagrams, defining the Fréchet mean, variance, and central limit theorem in the space of diagrams equipped with the Wasserstein metric. This paper provides the theoretical basis for Turner et al. (2014) and Bubenik (2015), and is essential reading for anyone working on statistical inference with TDA.',
        level: 'advanced',
        connections: {
          chapters: [4, 5],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: 'QNZHU5WI',
        annotation:
          'Bauer\'s Ripser is the state-of-the-art software for computing Vietoris–Rips persistence barcodes, orders of magnitude faster than earlier implementations. This paper describes the algorithmic innovations (clearing, cohomology, apparent pairs) that make Ripser fast. For anyone computing persistent homology in practice, this is the primary software reference.',
        level: 'intermediate',
        connections: {
          chapters: [3, 4],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'The GUDHI Project. (2021). GUDHI User and Reference Manual (Version 3.4.0). GUDHI Editorial Board. https://gudhi.inria.fr/doc/3.4.0/',
        annotation:
          'GUDHI is the primary C++/Python library for TDA developed at Inria. It implements Čech, Rips, Alpha, and Čubical complexes alongside persistence homology computation and the mapper algorithm. The reference manual is dense, but the Python interface tutorials are accessible. GUDHI is the recommended library for research-grade TDA work beyond what Ripser covers.',
        level: 'intermediate',
        connections: {
          chapters: [3, 4, 5],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Tausz, A., Vejdemo-Johansson, M., & Adams, H. (2011). JavaPlex: A research software package for persistent (co)homology. In H. Hong & C. Yap (Eds.), Mathematical Software — ICMS 2014 (pp. 129–136). Springer.',
        annotation:
          'JavaPlex was the first widely used research software for TDA and remains valuable for pedagogical use because its code is clearly documented. The associated tutorials (available separately) walk through persistent homology computation step by step in MATLAB, making it an excellent companion for readers working through the Edelsbrunner–Harer textbook.',
        level: 'introductory',
        connections: {
          chapters: [3],
          papers: [],
          paths: ['tda-methods', 'topology-social-scientists'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Otter, N., Porter, M. A., Tillmann, U., Grindrod, P., & Harrington, H. A. (2017). A roadmap for the computation of persistent homology. EPJ Data Science, 6(1), 17.',
        annotation:
          'A practical guide to the computational choices involved in TDA: which filtration to use, which software to choose, how to handle noise and parameter selection. Otter et al. compare filtration types (Rips, Čech, alpha) and software packages (Ripser, Gudhi, Dionysus, JavaPlex) with concrete benchmarks. An invaluable methodological companion for applied work.',
        level: 'intermediate',
        connections: {
          chapters: [3, 4],
          papers: [],
          paths: ['tda-methods'],
        },
      },
      {
        zoteroKey: null,
        fallbackCitation:
          'Hensel, F., Moor, M., & Rieck, B. (2021). A survey of topological machine learning methods. Frontiers in Artificial Intelligence, 4, 681108.',
        annotation:
          'A broad survey of how topological features are integrated into machine learning pipelines, covering persistence images, landscapes, Betti curves, and graph-level TDA. Useful for understanding how the statistical summaries introduced by Bubenik and Turner are deployed in practice, and for identifying appropriate feature representations for downstream modelling tasks.',
        level: 'intermediate',
        connections: {
          chapters: [5],
          papers: [],
          paths: ['tda-methods'],
        },
      },
    ],
  },
];
