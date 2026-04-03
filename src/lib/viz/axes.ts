/**
 * axes.ts — Task 3.1 — Agent_Interactive_Core
 *
 * Reusable D3 axis helpers for SVG charts.
 *
 * Each function appends (or updates) a <g> axis group onto the provided
 * D3 selection, applying consistent tick formatting and a centred axis
 * label. Callers are responsible for grouping / positioning the <g>
 * before passing it here.
 *
 * SSR Note: These functions must be called in browser contexts only
 * (D3 selections require a live DOM).
 */

import { axisBottom, axisLeft } from 'd3-axis';
import type { Selection } from 'd3-selection';
import type { AxisScale } from 'd3-axis';

/** Shared options accepted by both axis helpers. */
export interface AxisOptions {
  /** Human-readable axis label rendered beside the axis line. */
  label?: string;
  /**
   * Tick format hint.
   * - `'integer'`    → no decimal places (e.g. 1 000)
   * - `'percentage'` → multiply by 100 and append "%" (e.g. "42%")
   * - `'year'`       → render as a 4-digit integer year (e.g. "2005")
   * - omitted        → D3 default formatting
   */
  tickFormat?: 'integer' | 'percentage' | 'year';
  /** Number of ticks hint passed to D3. Defaults to `undefined` (auto). */
  tickCount?: number;
}

/** Pixel offset used to position axis labels clear of tick marks. */
const LABEL_OFFSET_X = 40; // px below x-axis
const LABEL_OFFSET_Y = -50; // px left of y-axis

/**
 * Resolve a D3 tick-format function from the AxisOptions shorthand.
 */
function resolveTickFormat(
  tickFormat: AxisOptions['tickFormat'],
): ((d: number | { valueOf(): number }) => string) | null {
  switch (tickFormat) {
    case 'integer':
      return (d) => String(Math.round(Number(d)));
    case 'percentage':
      return (d) => `${Math.round(Number(d) * 100)}%`;
    case 'year':
      return (d) => String(Math.round(Number(d)));
    default:
      return null;
  }
}

/**
 * Render (or update) a bottom x-axis on `selection`.
 *
 * @param selection - A D3 selection of a `<g>` element to receive the axis.
 * @param scale     - Any D3 scale with a `domain` and `range` (continuous or band).
 * @param options   - Label and tick-format options.
 */
export function renderXAxis(
  selection: Selection<SVGGElement, unknown, null, undefined>,
  scale: AxisScale<number | string | Date>,
  options: AxisOptions = {},
): void {
  const { label, tickFormat, tickCount } = options;

  const axis = axisBottom(scale);
  if (tickCount !== undefined) axis.ticks(tickCount);

  const fmt = resolveTickFormat(tickFormat);
  if (fmt) axis.tickFormat(fmt as Parameters<typeof axis.tickFormat>[0]);

  selection.call(axis);

  // Label — centred below the axis line.
  if (label) {
    // Remove any existing label before re-rendering to stay idempotent.
    selection.selectAll('.axis-label').remove();

    const range = scale.range() as number[];
    const midX = (range[0] + range[range.length - 1]) / 2;

    selection
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', midX)
      .attr('y', LABEL_OFFSET_X)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .text(label);
  }
}

/**
 * Render (or update) a left y-axis on `selection`.
 *
 * @param selection - A D3 selection of a `<g>` element to receive the axis.
 * @param scale     - Any D3 scale with a `domain` and `range`.
 * @param options   - Label and tick-format options.
 */
export function renderYAxis(
  selection: Selection<SVGGElement, unknown, null, undefined>,
  scale: AxisScale<number | string | Date>,
  options: AxisOptions = {},
): void {
  const { label, tickFormat, tickCount } = options;

  const axis = axisLeft(scale);
  if (tickCount !== undefined) axis.ticks(tickCount);

  const fmt = resolveTickFormat(tickFormat);
  if (fmt) axis.tickFormat(fmt as Parameters<typeof axis.tickFormat>[0]);

  selection.call(axis);

  // Label — rotated, centred left of the axis line.
  if (label) {
    selection.selectAll('.axis-label').remove();

    const range = scale.range() as number[];
    const midY = (range[0] + range[range.length - 1]) / 2;

    selection
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', `rotate(-90)`)
      .attr('x', -midY)
      .attr('y', LABEL_OFFSET_Y)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .text(label);
  }
}
