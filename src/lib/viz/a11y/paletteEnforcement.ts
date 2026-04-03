/**
 * paletteEnforcement.ts — Task 3.1 — Agent_Interactive_Core
 *
 * Development-only utility that validates colours passed to D3 scales
 * are drawn from the token-defined visualisation palette.
 *
 * In production builds (import.meta.env.DEV === false) every function
 * is a no-op and tree-shaken away by Vite/Rollup, adding zero runtime cost.
 *
 * How it works:
 *   At assertion time the utility reads the eight `--color-viz-*` custom
 *   properties from the document root. This is done on-demand (no cache)
 *   so dark-mode overrides are automatically reflected.
 *
 * Usage:
 *   import { assertPaletteColor } from '@lib/viz/a11y/paletteEnforcement';
 *
 *   // Inside a D3 callback or useEffect:
 *   assertPaletteColor(myColour); // warns if myColour ≠ any --color-viz-*
 *
 *   // Or validate a whole array at once:
 *   assertPaletteColors(['#E69F00', '#FF0000']); // warns for #FF0000
 */

/** Number of viz palette tokens defined in tokens.css. */
const VIZ_PALETTE_SIZE = 8;

/** Read the current live palette values from CSS custom properties. */
function readPaletteValues(): Set<string> {
  const styles = getComputedStyle(document.documentElement);
  const values = new Set<string>();
  for (let i = 1; i <= VIZ_PALETTE_SIZE; i++) {
    const value = styles.getPropertyValue(`--color-viz-${i}`).trim().toLowerCase();
    if (value) values.add(value);
  }
  return values;
}

/**
 * Warn in development when `color` is not a member of the viz token palette.
 *
 * @param color - Any CSS colour string (hex, rgb, etc.) to validate.
 */
export function assertPaletteColor(color: string): void {
  if (!import.meta.env.DEV) return;

  const palette = readPaletteValues();
  const normalised = color.trim().toLowerCase();

  if (!palette.has(normalised)) {
    console.warn(
      `[viz/paletteEnforcement] Colour "${color}" is not in the viz token palette. ` +
        `Use –-color-viz-1 through --color-viz-8 via getPaletteColor() in scales.ts.`,
    );
  }
}

/**
 * Validate an array of colour strings against the palette at once.
 * Emits one warning per invalid colour.
 *
 * @param colors - Array of CSS colour strings to validate.
 */
export function assertPaletteColors(colors: string[]): void {
  if (!import.meta.env.DEV) return;

  const palette = readPaletteValues();

  for (const color of colors) {
    const normalised = color.trim().toLowerCase();
    if (!palette.has(normalised)) {
      console.warn(
        `[viz/paletteEnforcement] Colour "${color}" is not in the viz token palette. ` +
          `Use --color-viz-1 through --color-viz-8 via getPaletteColor() in scales.ts.`,
      );
    }
  }
}
