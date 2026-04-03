/**
 * NormalDistExplorer.data.ts — Task 3.2 — Agent_Interactive_Core
 *
 * Historical overlay distributions for the Normal Distribution Explorer.
 *
 * Each entry represents a named historical use of the normal distribution,
 * contextualised within the Counting Lives narrative. Overlay types:
 *   'curve'     — render a full PDF curve
 *   'threshold' — render a single vertical line at thresholdX
 *
 * Colour assignment is handled at render time via getVizColorScale() so
 * dark-mode and token overrides are respected.
 */

export type OverlayType = 'curve' | 'threshold';

export interface OverlayDef {
  /** Unique identifier used as React key and Set membership key. */
  id: string;
  /** Display label shown in the toggle control and annotation panel. */
  label: string;
  /** Render type: full PDF curve or a threshold vertical line. */
  type: OverlayType;
  /** Mean of the overlay distribution (normalised / scaled as noted). */
  mu: number;
  /** Standard deviation of the overlay distribution. */
  sigma: number;
  /**
   * Only used when type === 'threshold'.
   * X-axis position of the vertical threshold line.
   * If omitted, defaults to mu − sigma at render time.
   */
  thresholdX?: number;
  /**
   * 2–3 sentence contextual annotation shown in the panel below the chart
   * when this overlay is active.
   */
  note: string;
}

/**
 * The four canonical historical overlays for the Normal Distribution Explorer.
 *
 * All distributions are expressed on a normalised ±5σ x-axis (standard
 * deviations from the mean) unless otherwise noted.
 */
export const OVERLAYS: OverlayDef[] = [
  {
    id: 'quetelet-1835',
    label: "Quetelet's Average Man (1835)",
    type: 'curve',
    mu: 0,
    sigma: 1,
    note:
      "Adolphe Quetelet proposed that human physical measurements — height, weight, " +
      "chest circumference — cluster around an ideal 'average man' (l'homme moyen) " +
      "following the normal distribution. This statistical fiction became the " +
      "foundation for later normative claims about human populations, and is " +
      "examined critically in Counting Lives, Chapter 1.",
  },
  {
    id: 'galton-1869',
    label: "Galton's Talent Ranking (1869)",
    type: 'curve',
    mu: 0.5,
    sigma: 0.85,
    note:
      "Francis Galton extended Quetelet's framework to heritable 'mental ability', " +
      "arguing that talent and intelligence were normally distributed and justifying " +
      "eugenic interventions at the distribution's tails. The shifted mean here " +
      "reflects Galton's implicit anchoring of 'average' to a privileged reference " +
      "class. See Counting Lives, Chapter 2 for the political consequences of this " +
      "distributional move.",
  },
  {
    id: 'iq-1912',
    label: 'IQ Distribution (1912)',
    type: 'curve',
    // IQ is conventionally μ=100, σ=15. Here we map onto the ±5σ unit axis by
    // converting: (100−100)/15 = 0, σ_unit = 15/15 = 1. The IQ overlay is thus
    // identical in shape to Quetelet's but labelled separately for historical
    // distinction.
    mu: 0,
    sigma: 1,
    note:
      "William Stern's intelligence quotient (1912), later standardised to μ=100 " +
      "and σ=15 by Wechsler, operationalised Galton's distributional logic into a " +
      "bureaucratic sorting mechanism. IQ scores were used throughout the twentieth " +
      "century to gatekeep access to education, employment, and welfare. This " +
      "overlay is explored in Counting Lives, Chapter 2.",
  },
  {
    id: 'benefit-threshold-1960s',
    label: 'Benefit Eligibility Threshold (1960s)',
    type: 'threshold',
    mu: 0,
    sigma: 1,
    // Threshold drawn at one standard deviation below the mean: μ − σ = −1.
    thresholdX: -1,
    note:
      "Post-war welfare systems in the UK and US frequently used statistical " +
      "thresholds — typically one or two standard deviations below the mean — to " +
      "define poverty and eligibility for state support. The vertical line here " +
      "marks the μ−σ boundary, capturing approximately 16% of the population " +
      "below it. Chapter 10 of Counting Lives traces how such statistical cutoffs " +
      "became instruments of exclusion.",
  },
];
