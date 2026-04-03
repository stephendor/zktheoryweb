/**
 * scales.ts — Task 3.1 — Agent_Interactive_Core
 *
 * Colour-scale utilities that read design tokens from the DOM at runtime.
 * All colours are derived from the CSS custom properties defined in
 * src/styles/tokens.css — never hard-coded hex values.
 *
 * SSR Note: Both functions call getComputedStyle and must only be invoked
 * in a browser context (inside useEffect, event handlers, or D3 callbacks).
 * They will throw if called during Astro's build-time SSR pass.
 */

import { scaleOrdinal } from 'd3-scale';
import type { ScaleOrdinal } from 'd3-scale';

/** The eight viz palette token names, in order. */
const VIZ_TOKENS = [
  '--color-viz-1',
  '--color-viz-2',
  '--color-viz-3',
  '--color-viz-4',
  '--color-viz-5',
  '--color-viz-6',
  '--color-viz-7',
  '--color-viz-8',
] as const;

/**
 * Read a single CSS custom property value from the document root.
 *
 * @param name - Full custom property name, e.g. `--color-viz-1`
 * @returns The trimmed string value, or an empty string if not found.
 */
export function getPaletteColor(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Build a D3 `scaleOrdinal` mapped to the full 8-colour viz palette,
 * reading live values from CSS custom properties so dark-mode overrides
 * are automatically reflected.
 *
 * The returned scale maps string domain keys (e.g. category names) to
 * colour strings (e.g. `"#E69F00"`).
 *
 * @example
 * const colour = getVizColorScale();
 * const fill = colour('poverty'); // → CSS value of --color-viz-1 at runtime
 */
export function getVizColorScale(): ScaleOrdinal<string, string> {
  const colours = VIZ_TOKENS.map(getPaletteColor);
  return scaleOrdinal<string, string>().range(colours);
}
