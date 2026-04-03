/**
 * TransitionsTimeline.data.ts — Task 3.6a — Agent_Interactive_Core
 *
 * Data types and transformation utilities for the Five Transitions Timeline.
 *
 * This module has NO Astro, D3, or browser dependencies — it is safe to
 * import in Astro build-time frontmatter, React components, and Vitest tests.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal chapter reference stored inside a TransitionBand. */
export interface ChapterRef {
  number: number;
  title: string;
  threads: string[];
}

/**
 * A historical era band spanning dateStart → dateEnd on the horizontal timeline.
 * dateEnd is undefined for the open-ended final transition (Transition 5 / present).
 */
export interface TransitionBand {
  /** Slug-format identifier, e.g. "transition-01". */
  id: string;
  number: number;
  title: string;
  dateStart: number;
  /** Undefined for open-ended transitions; renderer uses currentYear as fallback. */
  dateEnd: number | undefined;
  chapters: ChapterRef[];
  /**
   * CSS custom-property name for the band colour, e.g. "--color-cl-red".
   * Resolved at render time via getPaletteColor() so dark-mode overrides apply.
   */
  colour: string;
}

/** A thematic thread that runs across multiple chapters. */
export interface ThreadStrand {
  slug: string;
  label: string;
  /** CSS custom-property name for the strand line colour. */
  colour: string;
  /** Chapter numbers (sorted ascending) that carry this thread. */
  chapterNumbers: number[];
}

/** The full serialisable dataset consumed by <TransitionsTimeline>. */
export interface TimelineData {
  transitions: TransitionBand[];
  threads: ThreadStrand[];
  /** Minimum year visible on the x-axis (left edge). */
  yearMin: number;
  /** Maximum year visible on the x-axis (right edge). */
  yearMax: number;
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

/** Archival/viz palette CSS custom-property names, keyed by transition number. */
const TRANSITION_COLOURS: Record<number, string> = {
  1: '--color-cl-red',
  2: '--color-cl-ochre',
  3: '--color-viz-3',   /* bluish green  */
  4: '--color-viz-5',   /* blue          */
  5: '--color-viz-6',   /* vermillion    */
};

/** Thread colour assignments. */
const THREAD_DEFS: Array<{ slug: string; label: string; colour: string }> = [
  { slug: 'scottish-thread', label: 'Scottish Thread', colour: '--color-viz-2' },
  { slug: 'gender-thread',   label: 'Gender Thread',   colour: '--color-viz-7' },
];

// ─── Input interfaces (decouple from astro:content) ───────────────────────────

/**
 * Shape of a raw transition collection entry's `.data` field.
 * Mirrors the Zod schema in src/content.config.ts without importing it.
 */
export interface TransitionInput {
  transition_number: number;
  title:             string;
  date_start:        number;
  date_end?:         number;
}

/**
 * Shape of a raw chapter collection entry's `.data` field.
 * Mirrors the Zod schema in src/content.config.ts without importing it.
 */
export interface ChapterInput {
  chapter_number: number;
  title:          string;
  /** Transition number this chapter belongs to. May be absent for unnumbered chapters. */
  transition?:    number;
  threads:        string[];
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Transform raw Astro content collection data into a typed TimelineData object
 * suitable for passing as serialisable React props.
 *
 * @param transitionsRaw - Array of transition entry `.data` objects.
 * @param chaptersRaw    - Array of chapter entry `.data` objects.
 * @param currentYear    - Upper-bound year for open-ended transitions.
 *                         Defaults to the current calendar year. Pass an
 *                         explicit value in tests to keep snapshots stable.
 */
export function buildTimelineData(
  transitionsRaw: TransitionInput[],
  chaptersRaw: ChapterInput[],
  currentYear: number = new Date().getFullYear(),
): TimelineData {
  // Sort transitions by number so the array is always ordered 1 → 5.
  const sorted = [...transitionsRaw].sort(
    (a, b) => a.transition_number - b.transition_number,
  );

  // Group chapters by parent transition number.
  const chaptersByTransition = new Map<number, ChapterRef[]>();
  for (const ch of chaptersRaw) {
    if (ch.transition === undefined) continue;
    const list = chaptersByTransition.get(ch.transition) ?? [];
    list.push({ number: ch.chapter_number, title: ch.title, threads: ch.threads });
    chaptersByTransition.set(ch.transition, list);
  }

  const transitions: TransitionBand[] = sorted.map((t) => ({
    id:        `transition-${String(t.transition_number).padStart(2, '0')}`,
    number:    t.transition_number,
    title:     t.title,
    dateStart: t.date_start,
    dateEnd:   t.date_end,
    chapters:  (chaptersByTransition.get(t.transition_number) ?? []).sort(
      (a, b) => a.number - b.number,
    ),
    colour:    TRANSITION_COLOURS[t.transition_number] ?? '--color-viz-1',
  }));

  // Derive overall year range: start from earliest `dateStart`, end at latest
  // `dateEnd` (or currentYear for open-ended transitions).
  const allStarts = transitions.map((t) => t.dateStart);
  const allEnds   = transitions.map((t) => t.dateEnd ?? currentYear);
  const yearMin   = Math.min(...allStarts);
  const yearMax   = Math.max(...allEnds);

  // Build thread strands by collecting every chapter that carries each slug.
  const threads: ThreadStrand[] = THREAD_DEFS.map(({ slug, label, colour }) => ({
    slug,
    label,
    colour,
    chapterNumbers: chaptersRaw
      .filter((ch) => ch.threads.includes(slug))
      .map((ch) => ch.chapter_number)
      .sort((a, b) => a - b),
  }));

  return { transitions, threads, yearMin, yearMax };
}
