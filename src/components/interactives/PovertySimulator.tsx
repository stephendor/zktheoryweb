/**
 * PovertySimulator.tsx — Task 3.3 — Agent_Interactive_Core
 *
 * Interactive poverty threshold simulator.
 *
 * Renders a D3 log-normal income distribution area chart with a vertical,
 * draggable/keyboard-moveable poverty line. Household composition controls
 * update the threshold in real time. Method toggle buttons (Step 3) and
 * full a11y integration (Step 4) are co-located in this file.
 *
 * Architecture:
 *   - ResponsiveContainer  → measures container width/height
 *   - useD3Chart hook      → all D3 mutations inside a single useEffect,
 *                            re-runs only when data/dimensions change
 *   - React state          → household params, active method, threshold
 *   - AriaLiveRegion       → debounced screen-reader announcements
 *   - TextDescriptionToggle → prose fallback
 *   - useReducedMotion     → skips line animation when requested
 */

import React, { useEffect, useRef, useState, useId } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { getPaletteColor } from '@lib/viz/scales';
import { renderXAxis, renderYAxis } from '@lib/viz/axes';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';
import type { VizDimensions } from '@lib/viz/types';

import {
  calculateThreshold,
  generateDensityCurve,
  populationBelowThreshold,
  oecdEqualisationFactor,
  POPULATION_MEDIAN,
  type HouseholdParams,
  type ThresholdMethod,
  type Region,
} from './PovertySimulator.data';

import './PovertySimulator.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN = { top: 24, right: 32, bottom: 64, left: 56 };
const X_MIN = 0;
const X_MAX = 80_000;
const ANIMATION_DURATION_MS = 450;
const DEBOUNCE_MS = 400;
const LINE_STEP = 100; // £ per arrow-key press

// ─── Method metadata ──────────────────────────────────────────────────────────

const METHODS: { id: ThresholdMethod; label: string }[] = [
  { id: 'absolute', label: 'Absolute (MIS)' },
  { id: 'relative', label: 'Relative 60%' },
  { id: 'dwp', label: 'Official DWP' },
];

const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: 'london', label: 'London' },
  { value: 'rest-of-england', label: 'Rest of England' },
  { value: 'scotland', label: 'Scotland' },
  { value: 'wales', label: 'Wales' },
];

const METHOD_ANNOTATIONS: Record<ThresholdMethod, { heading: string; body: string }> = {
  absolute: {
    heading: 'Absolute poverty — Rowntree / JRF tradition',
    body:
      "Seebohm Rowntree's 1899 York survey established the idea of a physical " +
      "subsistence minimum — the cost of a basket of necessities. The Joseph " +
      "Rowntree Foundation's Minimum Income Standard (MIS) updates this tradition " +
      "annually: focus groups of the public define what counts as 'enough' for a " +
      "socially acceptable life, not mere survival. The threshold rises with " +
      "general living standards, but more slowly than relative measures.",
  },
  relative: {
    heading: 'Relative poverty — Townsend / EU AROPE tradition',
    body:
      "Peter Townsend (1979) argued that poverty is necessarily relative: people " +
      "are poor when excluded from the customary activities of their society. The " +
      "EU's 'at risk of poverty' measure (AROPE) operationalises this as income " +
      "below 60% of the national median, equivalised using the modified OECD " +
      "scale. Critically, the threshold rises automatically as median incomes rise " +
      "— poverty cannot be 'abolished' by growth alone if inequality persists.",
  },
  dwp: {
    heading: 'Official UK poverty — DWP HBAI BHC series',
    body:
      "The UK government's official poverty statistics use the 60%-of-median " +
      "approach but are drawn from the DWP's Households Below Average Income " +
      "(HBAI) survey using Before Housing Costs income. This series is the basis " +
      "for Child Poverty Act targets and parliamentary accountability. The DWP " +
      "median is slightly lower than the ONS Family Resources Survey figure, " +
      "reflecting differences in weighting methodology and population scope.",
  },
};

// ─── Debounce helper ──────────────────────────────────────────────────────────

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Inner chart component (receives measured dimensions) ─────────────────────

interface ChartInnerProps {
  dimensions: VizDimensions;
  method: ThresholdMethod;
  params: HouseholdParams;
  threshold: number;
  rate: number;
  onThresholdChange: (t: number) => void;
  reducedMotion: boolean;
}

function ChartInner({
  dimensions,
  method,
  params,
  threshold,
  rate,
  onThresholdChange,
  reducedMotion,
}: ChartInnerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<d3.Selection<SVGLineElement, unknown, null, undefined> | null>(null);
  const shadeRef = useRef<d3.Selection<SVGPathElement, unknown, null, undefined> | null>(null);
  const xScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);

  const chartW = dimensions.width - MARGIN.left - MARGIN.right;
  const chartH = dimensions.height - MARGIN.top - MARGIN.bottom;

  // ── Build / update the D3 chart ─────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || chartW <= 0 || chartH <= 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove(); // full redraw on dimension change

    // ── Household-scaled density curve ─────────────────────────────────────
    // The distribution is parameterised by equivalised income (median £35 k).
    // Scaling mu by the OECD factor shifts the entire curve to actual household
    // income space, so the shaded area to the left of the poverty line visually
    // matches the poverty-rate readout for any household composition.
    const oecd = oecdEqualisationFactor(params.adults, params.children);
    const scaledMu = Math.log(POPULATION_MEDIAN * oecd);
    const densityCurve = generateDensityCurve(400, scaledMu);

    // ── Scales ─────────────────────────────────────────────────────────────
    const xScale = d3
      .scaleLinear()
      .domain([X_MIN, X_MAX])
      .range([0, chartW]);
    xScaleRef.current = xScale;

    const maxDensity = d3.max(densityCurve, (d) => d.density) ?? 1;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxDensity * 1.12])
      .range([chartH, 0]);

    // ── Root group ─────────────────────────────────────────────────────────
    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // ── Area generator ─────────────────────────────────────────────────────
    const area = d3
      .area<(typeof densityCurve)[0]>()
      .x((d) => xScale(d.income))
      .y0(chartH)
      .y1((d) => yScale(d.density))
      .curve(d3.curveBasis);

    const line = d3
      .line<(typeof densityCurve)[0]>()
      .x((d) => xScale(d.income))
      .y((d) => yScale(d.density))
      .curve(d3.curveBasis);

    const clRed = getPaletteColor('--color-cl-red');
    const clRedLight = getPaletteColor('--color-cl-red-light');
    const neutralBorder = getPaletteColor('--color-neutral-border');

    // ── Clip paths ─────────────────────────────────────────────────────────
    // belowClip: clip area up to the current threshold x position
    // aboveClip: clip area from threshold to right edge
    const defs = svg.append('defs');

    defs
      .append('clipPath')
      .attr('id', 'ps-below-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', xScale(Math.min(threshold, X_MAX)))
      .attr('height', chartH);

    defs
      .append('clipPath')
      .attr('id', 'ps-above-clip')
      .append('rect')
      .attr('x', xScale(Math.min(threshold, X_MAX)))
      .attr('y', 0)
      .attr('width', chartW)
      .attr('height', chartH);

    // ── Areas ──────────────────────────────────────────────────────────────
    // Above-threshold area (muted fill)
    g.append('path')
      .datum(densityCurve)
      .attr('class', 'ps-area-above')
      .attr('clip-path', 'url(#ps-above-clip)')
      .attr('d', area)
      .attr('fill', 'var(--color-neutral-subtle)')
      .attr('opacity', 0.7);

    // Below-threshold shaded area (Counting Lives red)
    const shadeEl = g
      .append('path')
      .datum(densityCurve)
      .attr('class', 'ps-area-below')
      .attr('clip-path', 'url(#ps-below-clip)')
      .attr('d', area)
      .attr('fill', clRedLight)
      .attr('opacity', 0.55);
    shadeRef.current = shadeEl;

    // Distribution outline
    g.append('path')
      .datum(densityCurve)
      .attr('class', 'ps-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-neutral-muted)')
      .attr('stroke-width', 1.5);

    // ── Poverty line ───────────────────────────────────────────────────────
    const lineX = xScale(Math.min(Math.max(threshold, X_MIN), X_MAX));

    const povertLineEl = g
      .append('line')
      .attr('class', 'ps-poverty-line')
      .attr('x1', lineX)
      .attr('x2', lineX)
      .attr('y1', 0)
      .attr('y2', chartH)
      .attr('stroke', clRed)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '6,3');
    lineRef.current = povertLineEl;

    // ── Method label on the poverty line ─────────────────────────────────
    // Faint text label anchored just above the line; updated in the
    // threshold-move effect (which selects '.ps-method-label').
    g.append('text')
      .attr('class', 'ps-method-label')
      .attr('x', lineX + 6)
      .attr('y', 16)
      .attr('fill', clRed)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-ui)')
      .attr('opacity', 0.85)
      .text(METHODS.find((m) => m.id === method)?.label ?? '');

    // ── Draggable handle circle on the line
    g.append('circle')
      .attr('class', 'ps-line-handle')
      .attr('cx', lineX)
      .attr('cy', chartH / 3)
      .attr('r', 7)
      .attr('fill', clRed)
      .attr('cursor', 'ew-resize')
      .attr('tabindex', '-1')
      .attr('aria-hidden', 'true');

    // ── Axes ───────────────────────────────────────────────────────────────
    const xAxisG = g
      .append('g')
      .attr('class', 'ps-x-axis')
      .attr('transform', `translate(0,${chartH})`) as d3.Selection<
      SVGGElement,
      unknown,
      null,
      undefined
    >;
    renderXAxis(xAxisG, xScale, {
      label: 'Annual household income (£)',
      tickFormat: 'integer',
      tickCount: 6,
    });

    // Format y-axis ticks as density × 10⁴ to keep numbers readable
    const yAxisG = g
      .append('g')
      .attr('class', 'ps-y-axis') as d3.Selection<SVGGElement, unknown, null, undefined>;
    renderYAxis(yAxisG, yScale, { tickCount: 4 });

    // ── Grid lines ─────────────────────────────────────────────────────────
    g.append('g')
      .attr('class', 'ps-grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-chartW)
          .tickFormat(() => ''),
      )
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel
          .selectAll('.tick line')
          .attr('stroke', neutralBorder)
          .attr('stroke-dasharray', '3,3'),
      );

    // ── Drag behaviour ─────────────────────────────────────────────────────
    const drag = d3.drag<SVGSVGElement, unknown>().on(
      'drag',
      (event: d3.D3DragEvent<SVGSVGElement, unknown, unknown>) => {
        const newX = Math.min(Math.max(event.x - MARGIN.left, 0), chartW);
        const newThreshold = Math.round(xScale.invert(newX) / LINE_STEP) * LINE_STEP;
        const clamped = Math.min(Math.max(newThreshold, 1_000), X_MAX - 1_000);
        onThresholdChange(clamped);
      },
    );

    svg.call(drag);
  }, [dimensions, chartW, chartH, params.adults, params.children]);

  // ── Update poverty line position (without full redraw) ──────────────────
  useEffect(() => {
    const xScale = xScaleRef.current;
    const lineEl = lineRef.current;
    if (!xScale || !lineEl) return;

    const newX = xScale(Math.min(Math.max(threshold, X_MIN), X_MAX));
    const duration = reducedMotion ? 0 : ANIMATION_DURATION_MS;

    // Animate the line
    lineEl
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr('x1', newX)
      .attr('x2', newX);

    // Update the method label text on threshold move (text itself is
    // set here so the label stays correct after a full chart redraw).
    d3.select(svgRef.current)
      .select('.ps-method-label')
      .attr('x', newX + 6);

    // Update handle
    d3.select(svgRef.current)
      .select('.ps-line-handle')
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr('cx', newX);

    // Update clip paths
    d3.select(svgRef.current)
      .select('#ps-below-clip rect')
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr('width', newX);

    d3.select(svgRef.current)
      .select('#ps-above-clip rect')
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attr('x', newX)
      .attr('width', Math.max(0, chartW - newX));
  }, [threshold, reducedMotion, chartW]);

  // ── Update method label text when method changes (no full redraw) ────────
  useEffect(() => {
    const label = METHODS.find((m) => m.id === method)?.label ?? '';
    d3.select(svgRef.current).select('.ps-method-label').text(label);
  }, [method]);

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      role="img"
      aria-label={`Income distribution chart. Poverty line at £${threshold.toLocaleString()} per year. ${Math.round(rate * 100)}% of households fall below.`}
      className="ps-svg"
    />
  );
}

// ─── Method comparison panel ─────────────────────────────────────────────────
// Renders all three method thresholds for the current household side-by-side.
// This makes the central thesis visible: the same household is "poor" or
// "not poor" depending entirely on which political measurement framework is used.

interface MethodComparisonProps {
  activeMethod: ThresholdMethod;
  params: HouseholdParams;
  onSelect: (m: ThresholdMethod) => void;
}

function MethodComparison({ activeMethod, params, onSelect }: MethodComparisonProps) {
  const rows = METHODS.map((m) => {
    const result = calculateThreshold(m.id, params);
    return { ...m, threshold: result.threshold, rate: result.rate };
  });

  const maxThreshold = Math.max(...rows.map((r) => r.threshold));
  const minThreshold = Math.min(...rows.map((r) => r.threshold));

  return (
    <div className="ps-comparison">
      <p className="ps-comparison-caption">
        All three thresholds for this household — the same family is measured differently
        depending on which framework a government or researcher chooses:
      </p>
      <ul className="ps-comparison-list">
        {rows.map((row) => {
          const isActive = row.id === activeMethod;
          const isHighest = row.threshold === maxThreshold;
          const isLowest = row.threshold === minThreshold;
          const barPct = Math.round((row.threshold / 80_000) * 100);
          return (
            <li
              key={row.id}
              className={`ps-comparison-item${isActive ? ' ps-comparison-item--active' : ''}`}
            >
              <button
                type="button"
                className="ps-comparison-btn"
                onClick={() => onSelect(row.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="ps-comparison-label">{row.label}</span>
                <span className="ps-comparison-figures">
                  <strong className="ps-comparison-threshold">
                    £{row.threshold.toLocaleString()}
                  </strong>
                  <span className="ps-comparison-rate">{Math.round(row.rate * 100)}%</span>
                  {isHighest && rows.length > 1 && (
                    <span className="ps-comparison-badge ps-comparison-badge--high">Highest</span>
                  )}
                  {isLowest && rows.length > 1 && (
                    <span className="ps-comparison-badge ps-comparison-badge--low">Lowest</span>
                  )}
                </span>
                <span
                  className="ps-comparison-bar"
                  aria-hidden="true"
                  style={{ '--bar-pct': `${barPct}%` } as React.CSSProperties}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


// Extracted so the eslint-disable can target the JSX element opening line.
// jsx-a11y/aria-proptypes cannot statically evaluate typed variables; the
// runtime value is always a valid ARIA string ('true' | 'false').

interface MethodButtonProps {
  id: ThresholdMethod;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function MethodButton({ id: _id, label, isActive, onClick }: MethodButtonProps) {
  const pressed: 'true' | 'false' = isActive ? 'true' : 'false';
  return (
    <button
      type="button"
      className={`ps-method-btn${isActive ? ' ps-method-btn--active' : ''}`}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {label}
    </button>
  );
}



export function PovertySimulator() {
  const [method, setMethod] = useState<ThresholdMethod>('relative');
  const [params, setParams] = useState<HouseholdParams>({
    adults: 2,
    children: 0,
    region: 'rest-of-england',
  });

  const result = calculateThreshold(method, params);
  const [threshold, setThreshold] = useState(result.threshold);
  const [liveMessage, setLiveMessage] = useState('');

  const reducedMotion = useReducedMotion();
  const chartRegionId = useId();

  // Sync threshold when method or params change
  useEffect(() => {
    const newResult = calculateThreshold(method, params);
    setThreshold(newResult.threshold);
  }, [method, params]);

  // Derive current rate from current threshold (manual drag may differ from method threshold).
  // The population distribution is in equivalised-income space, so divide the actual
  // household threshold by the OECD factor before querying the CDF.
  const currentRate = populationBelowThreshold(
    threshold / oecdEqualisationFactor(params.adults, params.children),
  );

  // Stable debounced announcer — created once on first render, held in a ref.
  // useCallback requires an inline function; useRef avoids that constraint while
  // guaranteeing the debounced wrapper is never recreated across re-renders.
  const debouncedAnnounce = useRef(
    debounce((msg: string) => setLiveMessage(msg), DEBOUNCE_MS),
  ).current;

  useEffect(() => {
    const pct = Math.round(currentRate * 100);
    debouncedAnnounce(
      `Poverty threshold updated. Method: ${METHODS.find((m) => m.id === method)?.label}. ` +
        `Threshold: £${threshold.toLocaleString()} per year. ` +
        `${pct}% of the simulated population fall below this line.`,
    );
  }, [threshold, method, currentRate, debouncedAnnounce]);

  const annotation = METHOD_ANNOTATIONS[method];
  const pct = Math.round(currentRate * 100);

  const textDescription =
    `Income distribution chart showing the UK population. ` +
    `Active method: ${METHODS.find((m) => m.id === method)?.label}. ` +
    `Threshold: £${threshold.toLocaleString()} per year for a household of ` +
    `${params.adults} adult${params.adults !== 1 ? 's' : ''} and ` +
    `${params.children} child${params.children !== 1 ? 'ren' : ''} in ` +
    `${REGION_OPTIONS.find((r) => r.value === params.region)?.label ?? params.region}. ` +
    `Approximately ${pct}% of the simulated population fall below this poverty line.`;

  return (
    <div className="ps-root">
      <header className="ps-header">
        <h2 className="ps-title">Poverty Threshold Simulator</h2>
        <p className="ps-subtitle">
          Drag the red line or adjust the slider below to explore how measurement choices define who
          counts as poor.
        </p>
      </header>

      {/* ── Method toggle buttons (Step 3) ─────────────────────────────────── */}
      <div className="ps-method-bar" role="group" aria-label="Poverty measurement method">
        {METHODS.map((m) => (
          <MethodButton
            key={m.id}
            id={m.id}
            label={m.label}
            isActive={method === m.id}
            onClick={() => setMethod(m.id)}
          />
        ))}
      </div>

      {/* ── Household controls ─────────────────────────────────────────────── */}
      <fieldset className="ps-controls">
        <legend className="ps-controls-legend">Household composition</legend>

        <div className="ps-control-row">
          <label htmlFor="ps-adults" className="ps-label">
            Adults
          </label>
          <input
            id="ps-adults"
            type="number"
            min={1}
            max={5}
            value={params.adults}
            className="ps-number-input"
            onChange={(e) => {
              const v = Math.min(5, Math.max(1, Number(e.target.value)));
              setParams((p) => ({ ...p, adults: v }));
            }}
          />
        </div>

        <div className="ps-control-row">
          <label htmlFor="ps-children" className="ps-label">
            Children
          </label>
          <input
            id="ps-children"
            type="number"
            min={0}
            max={5}
            value={params.children}
            className="ps-number-input"
            onChange={(e) => {
              const v = Math.min(5, Math.max(0, Number(e.target.value)));
              setParams((p) => ({ ...p, children: v }));
            }}
          />
        </div>

        <div className="ps-control-row">
          <label htmlFor="ps-region" className="ps-label">
            Region
          </label>
          <select
            id="ps-region"
            value={params.region}
            className="ps-select"
            onChange={(e) => setParams((p) => ({ ...p, region: e.target.value as Region }))}
          >
            {REGION_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* ── Poverty rate counter ───────────────────────────────────────────── */}
      <div className="ps-rate-display" aria-live="off">
        <span className="ps-rate-number">{pct}%</span>
        <span className="ps-rate-label">
          of this household type falls below the{' '}
          <strong>£{threshold.toLocaleString()}/yr</strong> threshold
        </span>
      </div>

      {/* ── Method comparison (Step 3 core) ──────────────────────────────── */}
      <MethodComparison
        activeMethod={method}
        params={params}
        onSelect={(m) => setMethod(m)}
      />

      {/* -- Chart ----------------------------------------------------------------- */}
      <TextDescriptionToggle description={textDescription}>
        <div id={chartRegionId} className="ps-chart-wrapper">
          <ResponsiveContainer minHeight={320}>
            {(dims) => (
              <ChartInner
                dimensions={dims}
                method={method}
                params={params}
                threshold={threshold}
                rate={currentRate}
                onThresholdChange={setThreshold}
                reducedMotion={reducedMotion}
              />
            )}
          </ResponsiveContainer>
        </div>
      </TextDescriptionToggle>

      {/* -- Accessible range slider (keyboard / AT control for the poverty line) -- */}
      <div className="ps-slider-row">
        <label htmlFor="ps-threshold-slider" className="ps-slider-label">
          Poverty line: <strong>£{threshold.toLocaleString()}/yr</strong>
        </label>
        <input
          id="ps-threshold-slider"
          type="range"
          min={1_000}
          max={79_000}
          step={LINE_STEP}
          value={threshold}
          className="ps-slider"
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
      </div>

      {/* ── Method annotation panel — keyed on method for CSS entry animation ── */}
      <div
        key={method}
        className="ps-annotation"
        aria-live="polite"
        aria-atomic="true"
      >
        <h3 className="ps-annotation-heading">{annotation.heading}</h3>
        <p className="ps-annotation-body">{annotation.body}</p>
      </div>

      {/* ── Aria live region (debounced announcements) ─────────────────────── */}
      <AriaLiveRegion message={liveMessage} />
    </div>
  );
}
