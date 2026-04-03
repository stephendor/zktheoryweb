/**
 * types.ts — Shared type definitions for all interactive viz components.
 * Task 3.1 — Agent_Interactive_Core
 *
 * Loading strategy for Astro hydration directives:
 *
 *   client:visible — PREFER for interactives below the fold.
 *                    Hydration is deferred until the component enters the
 *                    viewport, saving main-thread work on initial load.
 *                    Use this for charts, filtration sliders, and any
 *                    visualisation that appears in the article body.
 *
 *   client:idle    — Prefer for above-fold or low-priority interactives.
 *                    Hydration occurs during a browser idle window
 *                    (requestIdleCallback). Avoids blocking TTI on pageload.
 *
 * Convention: all viz components accept VizProps<T> as their base interface,
 * where T is the shape of the data array/object they consume.
 */

/** Optional explicit pixel dimensions for a visualisation canvas. */
export interface VizDimensions {
  width: number;
  height: number;
}

/**
 * VizProps<T> — base props interface for every interactive visualisation.
 *
 * @typeParam T - The shape of the `data` prop (e.g. `DatumType[]`).
 *                Defaults to `unknown` for components that source their
 *                own data via context or hooks.
 */
export interface VizProps<T = unknown> {
  /** The dataset to visualise. */
  data: T;
  /**
   * Optional explicit pixel dimensions.
   * When omitted, the component should use ResponsiveContainer to
   * derive dimensions from its DOM container at runtime.
   */
  dimensions?: VizDimensions;
  /** Optional extra CSS class applied to the outermost wrapper element. */
  className?: string;
}
