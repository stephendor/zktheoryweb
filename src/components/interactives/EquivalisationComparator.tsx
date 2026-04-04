/**
 * EquivalisationComparator.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Interactive Equivalisation Comparator.
 *
 * Displays the three major UK equivalisation scales applied to the same
 * stylised income distribution. Shows how the poverty rate changes purely
 * as a function of the formula chosen — with no underlying data change.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────┐
 *   │  Poverty rate bar chart: 3 bars (one per scale)        │
 *   ├────────────────────────────────────────────────────────┤
 *   │  Equiv-income distribution: 3 overlaid density curves  │
 *   ├────────────────────────────────────────────────────────┤
 *   │  Controls: threshold slider + household-type highlight  │
 *   └────────────────────────────────────────────────────────┘
 *
 * Architecture:
 *   - compareScales() is memoized; updates on threshold or highlight change.
 *   - Bar chart: React-controlled SVG (no D3 axes — simple bars).
 *   - Density chart: D3 areas inside a useEffect (continuous distribution).
 *   - Shared infrastructure: AriaLiveRegion, TextDescriptionToggle,
 *     useReducedMotion, ResponsiveContainer (Task 3.1 canon).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { getVizColorScale } from '@lib/viz/scales';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';

import {
  compareScales,
  UK_HOUSEHOLDS,
  THRESHOLD_DEFAULT,
  THRESHOLD_MIN,
  THRESHOLD_MAX,
  THRESHOLD_STEP,
  TOTAL_HOUSEHOLDS,
} from './EquivalisationComparator.data';
import type { ScaleResult, ScaleId } from './EquivalisationComparator.data';
import './EquivalisationComparator.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const BAR_MARGIN = { top: 16, right: 24, bottom: 44, left: 56 };
const DENSITY_MARGIN = { top: 12, right: 24, bottom: 40, left: 56 };

// Scale metadata for display colours
const SCALE_COLOURS: Record<ScaleId, string> = {
  'oecd-original': 'var(--color-viz-1, #e69f00)',
  'oecd-modified': 'var(--color-viz-3, #009e73)',
  'mcclements':    'var(--color-viz-2, #56b4e9)',
};

// ─── Poverty rate bar chart ───────────────────────────────────────────────────

interface PovertyBarChartProps {
  results: [ScaleResult, ScaleResult, ScaleResult];
  width: number;
  height: number;
}

function PovertyBarChart({ results, width, height }: PovertyBarChartProps) {
  const innerW = width - BAR_MARGIN.left - BAR_MARGIN.right;
  const innerH = height - BAR_MARGIN.top - BAR_MARGIN.bottom;
  const maxRate = Math.max(...results.map((r) => r.povertyRate), 5);

  const xScale = d3.scaleLinear().domain([0, maxRate + 2]).range([0, innerW]);
  const yScale = d3.scaleBand()
    .domain(results.map((r) => r.scale))
    .range([0, innerH])
    .padding(0.35);

  return (
    <svg
      className="ec-bar-svg"
      width={width}
      height={height}
      role="img"
      aria-label="Poverty rates by equivalisation scale"
    >
      <title>Poverty rates by equivalisation scale</title>
      <g transform={`translate(${BAR_MARGIN.left},${BAR_MARGIN.top})`}>
        {/* Grid lines */}
        {xScale.ticks(5).map((tick) => (
          <line
            key={tick}
            x1={xScale(tick)}
            y1={0}
            x2={xScale(tick)}
            y2={innerH}
            className="ec-grid-line"
          />
        ))}

        {/* Bars */}
        {results.map((r) => {
          const barY = yScale(r.scale)!;
          const barH = yScale.bandwidth();
          const barW = xScale(r.povertyRate);
          const colour = SCALE_COLOURS[r.scale];
          return (
            <g key={r.scale}>
              <rect
                x={0}
                y={barY}
                width={barW}
                height={barH}
                fill={colour}
                opacity={0.85}
                rx={2}
                aria-label={`${r.label}: ${r.povertyRate.toFixed(1)}%`}
              />
              {/* Value label */}
              <text
                x={barW + 6}
                y={barY + barH / 2}
                className="ec-bar-label"
                dominantBaseline="central"
              >
                {r.povertyRate.toFixed(1)}%
              </text>
              {/* Scale name (y-axis) */}
              <text
                x={-8}
                y={barY + barH / 2}
                className="ec-bar-scale-name"
                textAnchor="end"
                dominantBaseline="central"
              >
                {r.shortLabel}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        <g transform={`translate(0,${innerH})`}>
          {xScale.ticks(5).map((tick) => (
            <g key={tick} transform={`translate(${xScale(tick)},0)`}>
              <line y2={4} className="ec-axis-tick" />
              <text y={16} className="ec-axis-label" textAnchor="middle">{tick}%</text>
            </g>
          ))}
          <text
            x={innerW / 2}
            y={36}
            className="ec-axis-title"
            textAnchor="middle"
          >
            Poverty rate (% of households)
          </text>
        </g>
      </g>
    </svg>
  );
}

// ─── Equivalised income distribution chart ────────────────────────────────────

interface DistributionChartProps {
  results: [ScaleResult, ScaleResult, ScaleResult];
  width: number;
  height: number;
}

function DistributionChart({
  results,
  width,
  height,
}: DistributionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const innerW = width - DENSITY_MARGIN.left - DENSITY_MARGIN.right;
  const innerH = height - DENSITY_MARGIN.top - DENSITY_MARGIN.bottom;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || innerW <= 0 || innerH <= 0) return;

    const svg = d3.select(svgEl).select<SVGGElement>('.ec-dist-g');

    // Shared x domain across all three scales' equivalised incomes
    const allEquivIncomes = results.flatMap((r) => r.rowResults.map((row) => row.equivalisedIncome));
    const maxVal = d3.max(allEquivIncomes) ?? 0;
    const xDomain: [number, number] = [0, maxVal > 0 ? maxVal * 1.05 : 1];
    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerW]);

    // KDE for each scale
    const kde = (kernel: (v: number) => number, thresholds: number[], data: number[]) =>
      thresholds.map((x) => [x, d3.mean(data, (v) => kernel(v - x))!] as [number, number]);

    const bandwidth = 200;
    const epanechnikovKernel = (v: number) =>
      Math.abs(v /= bandwidth) <= 1 ? 0.75 * (1 - v * v) / bandwidth : 0;

    const ticks = xScale.ticks(80);

    const densities = results.map((r) =>
      kde(epanechnikovKernel, ticks, r.rowResults.map((row) => row.equivalisedIncome)),
    );

    const maxDensity = d3.max(densities.flat(), (d) => d[1]) ?? 1;
    const yScale = d3.scaleLinear().domain([0, maxDensity * 1.1]).range([innerH, 0]);

    const areaGen = d3
      .area<[number, number]>()
      .x((d) => xScale(d[0]))
      .y0(innerH)
      .y1((d) => yScale(d[1]))
      .curve(d3.curveBasis);

    const lineGen = d3
      .line<[number, number]>()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveBasis);

    // Draw areas and lines
    svg.selectAll('.ec-density-area').remove();
    svg.selectAll('.ec-density-line').remove();
    svg.selectAll('.ec-threshold-line').remove();

    results.forEach((r, i) => {
      const colour = SCALE_COLOURS[r.scale];
      svg
        .append('path')
        .datum(densities[i])
        .attr('class', 'ec-density-area')
        .attr('d', areaGen)
        .attr('fill', colour)
        .attr('fill-opacity', 0.12);

      svg
        .append('path')
        .datum(densities[i])
        .attr('class', 'ec-density-line')
        .attr('d', lineGen)
        .attr('stroke', colour)
        .attr('stroke-width', 2)
        .attr('fill', 'none');

      // Poverty threshold vertical line
      svg
        .append('line')
        .attr('class', 'ec-threshold-line')
        .attr('x1', xScale(r.povertyThreshold))
        .attr('x2', xScale(r.povertyThreshold))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', colour)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5 3')
        .attr('opacity', 0.7);
    });

    // X axis
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => `£${Number(d) / 1000}k`).ticks(6);
    svg.select<SVGGElement>('.ec-x-axis').call(xAxis);
    svg.select<SVGGElement>('.ec-y-axis').remove();
  }, [results, innerW, innerH]);

  return (
    <svg
      ref={svgRef}
      className="ec-dist-svg"
      width={width}
      height={height}
      role="img"
      aria-label="Equivalised income distribution by scale. Dashed lines show the poverty threshold for each scale."
    >
      <g
        className="ec-dist-g"
        transform={`translate(${DENSITY_MARGIN.left},${DENSITY_MARGIN.top})`}
      >
        <g className="ec-x-axis" transform={`translate(0,${innerH})`} />
        <text
          x={(width - DENSITY_MARGIN.left - DENSITY_MARGIN.right) / 2}
          y={height - DENSITY_MARGIN.top}
          className="ec-axis-title"
          textAnchor="middle"
        >
          Equivalised monthly income (£)
        </text>
      </g>
    </svg>
  );
}

// ─── Main exported component ───────────────────────────────────────────────────

export interface EquivalisationComparatorProps {
  className?: string;
}

export function EquivalisationComparator({ className }: EquivalisationComparatorProps) {
  const [threshold, setThreshold] = useState(THRESHOLD_DEFAULT);
  const [liveMsg, setLiveMsg] = useState('');

  const results = useMemo(
    () => compareScales(UK_HOUSEHOLDS, threshold),
    [threshold],
  );

  const handleThresholdChange = useCallback((val: number) => {
    setThreshold(val);
    const [orig, mod, mcC] = compareScales(UK_HOUSEHOLDS, val);
    setLiveMsg(
      `Threshold at ${(val * 100).toFixed(0)}% of median. Poverty rates: ` +
      `${orig.label} ${orig.povertyRate.toFixed(1)}%, ` +
      `${mod.label} ${mod.povertyRate.toFixed(1)}%, ` +
      `${mcC.label} ${mcC.povertyRate.toFixed(1)}%.`,
    );
  }, []);

  // Text description
  const textDescription = [
    `Poverty threshold: ${(threshold * 100).toFixed(0)}% of median equivalised income.`,
    `${TOTAL_HOUSEHOLDS} stylised UK households.`,
    results.map((r) => `${r.label}: ${r.povertyRate.toFixed(1)}% poverty rate (${Math.round(r.povertyRate * TOTAL_HOUSEHOLDS / 100)} households).`).join(' '),
    'All three scales use the same raw income data. Differences in poverty rate arise entirely from the formula.',
  ].join(' ');

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`ec-wrapper${className ? ` ${className}` : ''}`}>

        {/* ── Summary row ───────────────────────────────────────────────── */}
        <div className="ec-summary-row">
          {results.map((r) => (
            <div key={r.scale} className="ec-summary-card">
              <span
                className="ec-summary-swatch"
                style={{ background: SCALE_COLOURS[r.scale] }}
                aria-hidden="true"
              />
              <div className="ec-summary-content">
                <span className="ec-summary-label">{r.label}</span>
                <span
                  className="ec-summary-rate"
                  style={{ color: SCALE_COLOURS[r.scale] }}
                >
                  {r.povertyRate.toFixed(1)}%
                </span>
                <span className="ec-summary-sub">
                  {Math.round(r.povertyRate * TOTAL_HOUSEHOLDS / 100)} / {TOTAL_HOUSEHOLDS} households
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Poverty rate bar chart ─────────────────────────────────────── */}
        <section className="ec-section" aria-labelledby="ec-bar-heading">
          <h3 id="ec-bar-heading" className="ec-section-heading">
            Poverty rate by scale
          </h3>
          <ResponsiveContainer className="ec-chart-container" minHeight={160}>
            {({ width, height }) => (
              <PovertyBarChart results={results} width={width} height={height} />
            )}
          </ResponsiveContainer>
        </section>

        {/* ── Distribution chart ─────────────────────────────────────────── */}
        <section className="ec-section" aria-labelledby="ec-dist-heading">
          <h3 id="ec-dist-heading" className="ec-section-heading">
            Equivalised income distribution
            <span className="ec-section-note">
              {' '}— dashed vertical lines show each scale's poverty threshold
            </span>
          </h3>
          <ResponsiveContainer className="ec-chart-container" minHeight={200}>
            {({ width, height }) => (
              <DistributionChart
                results={results}
                width={width}
                height={height}
              />
            )}
          </ResponsiveContainer>
        </section>

        {/* ── Legend ────────────────────────────────────────────────────── */}
        <div className="ec-legend" aria-label="Scale colour legend">
          {results.map((r) => (
            <div key={r.scale} className="ec-legend-item">
              <span
                className="ec-legend-swatch"
                style={{ background: SCALE_COLOURS[r.scale] }}
                aria-hidden="true"
              />
              <span className="ec-legend-text">{r.label}</span>
            </div>
          ))}
        </div>

        {/* ── Controls ──────────────────────────────────────────────────── */}
        <div className="ec-controls" role="group" aria-label="Comparator controls">
          <div className="ec-control-group">
            <label htmlFor="ec-threshold-slider" className="ec-label">
              Poverty threshold:{' '}
              <span className="ec-threshold-value">
                {(threshold * 100).toFixed(0)}% of median
              </span>
            </label>
            <input
              id="ec-threshold-slider"
              type="range"
              min={THRESHOLD_MIN}
              max={THRESHOLD_MAX}
              step={THRESHOLD_STEP}
              value={threshold}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="ec-slider"
              aria-valuemin={THRESHOLD_MIN * 100}
              aria-valuemax={THRESHOLD_MAX * 100}
              aria-valuenow={threshold * 100}
              aria-valuetext={`${(threshold * 100).toFixed(0)}% of median`}
            />
            <div className="ec-range-labels" aria-hidden="true">
              <span>{THRESHOLD_MIN * 100}% (low)</span>
              <span>60% (current UK)</span>
              <span>{THRESHOLD_MAX * 100}% (high)</span>
            </div>
          </div>
        </div>

        {/* ── Key insight note ──────────────────────────────────────────── */}
        <p className="ec-insight">
          The raw income data and household composition are identical across all
          three calculations. Differences in poverty rate arise entirely from the
          choice of equivalisation formula — not from any change in household circumstances.
        </p>

        <AriaLiveRegion message={liveMsg} />
      </div>
    </TextDescriptionToggle>
  );
}
