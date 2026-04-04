/**
 * BarcodeComparator.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Interactive Barcode Comparator.
 *
 * Displays two persistence barcodes side by side:
 *   Left:  Official deprivation indices (income, employment, housing…)
 *   Right: Community-defined dimensions (safety, trust, green space…)
 *
 * The same 30 households, two measurement systems, different topological
 * structure — the mathematical signature of the difference between
 * being measured and being heard.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────┐
 *   │  H₀ bottleneck distance  │  H₁ bottleneck distance    │
 *   ├──────────────────────────┬─────────────────────────────┤
 *   │  Official barcode (D3 SVG) │ Community barcode (D3 SVG)│
 *   │  + scatter plot           │  + scatter plot            │
 *   ├──────────────────────────┴─────────────────────────────┤
 *   │  Dataset selector toggle                               │
 *   └────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import {
  OFFICIAL_DATASET,
  COMMUNITY_DATASET,
  H0_BOTTLENECK,
  H1_BOTTLENECK,
} from './BarcodeComparator.data';
import type { DatasetResult } from './BarcodeComparator.data';
import type { PersistenceFeature } from '@lib/tda/vietorisRips';
import './BarcodeComparator.css';

// ─── Bottleneck distance tile ─────────────────────────────────────────────────

function BottleneckTile({
  dimension,
  value,
}: {
  dimension: 0 | 1;
  value: number;
}) {
  const dimSymbol = dimension === 0 ? 'H₀' : 'H₁';
  return (
    <div className="bc-bn-tile">
      <span className="bc-bn-dim">{dimSymbol} bottleneck distance</span>
      <span className="bc-bn-value">{value.toFixed(4)}</span>
      <span className="bc-bn-note">
        {value === 0
          ? 'identical diagrams'
          : `diagrams differ by δ_B = ${value.toFixed(4)}`}
      </span>
    </div>
  );
}

// ─── Barcode SVG (D3) ─────────────────────────────────────────────────────────

const BARCODE_MARGIN = { top: 14, right: 24, bottom: 40, left: 24 };

function BarcodeSvg({
  dataset,
  width,
  height,
  dimension,
  colour,
  title,
  reducedMotion,
}: {
  dataset: DatasetResult;
  width: number;
  height: number;
  dimension: 0 | 1;
  colour: string;
  title: string;
  reducedMotion: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const innerW = width - BARCODE_MARGIN.left - BARCODE_MARGIN.right;
  const innerH = height - BARCODE_MARGIN.top - BARCODE_MARGIN.bottom;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || innerW <= 0 || innerH <= 0) return;

    const g = d3.select(svgEl).select<SVGGElement>('.bc-barcode-g');
    g.selectAll('*').remove();

    const features = dataset.features.filter((f) => f.dimension === dimension);
    if (features.length === 0) {
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11)
        .attr('fill', 'var(--color-neutral-muted, #888)')
        .text(`No H${dimension} features`);
      return;
    }

    // Find max radius (use max death, or second-largest if last is null)
    const finite = features.filter((f) => f.death !== null);
    const maxRadius = finite.length > 0
      ? d3.max(finite, (f) => f.death as number)!
      : d3.max(features, (f) => f.birth)! * 2;

    const xScale = d3.scaleLinear().domain([0, maxRadius * 1.05]).range([0, innerW]);

    // Sort by persistence (longer = more prominent)
    const sorted = [...features].sort((a, b) => {
      const pa = a.death !== null ? a.death - a.birth : Infinity;
      const pb = b.death !== null ? b.death - b.birth : Infinity;
      return pb - pa;
    });

    const barH = Math.max(3, Math.min(10, (innerH / sorted.length) - 2));
    const barGap = 2;
    const totalH = sorted.length * (barH + barGap);
    const startY = (innerH - totalH) / 2;

    sorted.forEach((f, i) => {
      const y = startY + i * (barH + barGap);
      const x1 = xScale(f.birth);
      const x2 = f.death !== null ? xScale(f.death) : innerW;
      const bw = Math.max(1, x2 - x1);
      const isInfinite = f.death === null;

      g.append('rect')
        .attr('x', x1)
        .attr('y', y)
        .attr('width', bw)
        .attr('height', barH)
        .attr('fill', isInfinite ? `${colour}` : colour)
        .attr('opacity', isInfinite ? 1.0 : 0.75)
        .attr('stroke', isInfinite ? colour : 'none')
        .attr('stroke-width', 1)
        .attr('rx', 1);

      // Arrowhead for infinite bars
      if (isInfinite) {
        g.append('polygon')
          .attr('points', `${innerW},${y + barH / 2 - 4} ${innerW + 7},${y + barH / 2} ${innerW},${y + barH / 2 + 4}`)
          .attr('fill', colour);
      }
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .attr('class', 'bc-xaxis')
      .call(
        d3.axisBottom(xScale)
          .ticks(4)
          .tickFormat(d3.format('.2f')),
      );

    // H label
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 34)
      .attr('text-anchor', 'middle')
      .attr('class', 'bc-axis-title')
      .text('Filtration radius ε');

    void reducedMotion;
  }, [innerW, innerH, dataset, dimension, colour, reducedMotion]);

  const features = dataset.features.filter((f) => f.dimension === dimension);

  return (
    <svg
      ref={svgRef}
      className="bc-barcode-svg"
      width={width}
      height={height}
      role="img"
      aria-label={`${title}: H${dimension} barcode with ${features.length} intervals`}
    >
      <g
        className="bc-barcode-g"
        transform={`translate(${BARCODE_MARGIN.left},${BARCODE_MARGIN.top})`}
      />
    </svg>
  );
}

// ─── Scatter plot ─────────────────────────────────────────────────────────────

const SCATTER_MARGIN = { top: 14, right: 14, bottom: 40, left: 40 };

function ScatterSvg({
  dataset,
  width,
  height,
  colour,
  reducedMotion,
}: {
  dataset: DatasetResult;
  width: number;
  height: number;
  colour: string;
  reducedMotion: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const innerW = width - SCATTER_MARGIN.left - SCATTER_MARGIN.right;
  const innerH = height - SCATTER_MARGIN.top - SCATTER_MARGIN.bottom;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || innerW <= 0 || innerH <= 0) return;

    const g = d3.select(svgEl).select<SVGGElement>('.bc-scatter-g');
    g.selectAll('*').remove();

    const xExt = d3.extent(dataset.points, (p) => p.x) as [number, number];
    const yExt = d3.extent(dataset.points, (p) => p.y) as [number, number];

    const xPad = (xExt[1] - xExt[0]) * 0.1 || 0.05;
    const yPad = (yExt[1] - yExt[0]) * 0.1 || 0.05;

    const xScale = d3.scaleLinear().domain([xExt[0] - xPad, xExt[1] + xPad]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([innerH, 0]);

    g.selectAll('.bc-dot')
      .data(dataset.points)
      .join('circle')
      .attr('class', 'bc-dot')
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('r', 3.5)
      .attr('fill', colour)
      .attr('opacity', 0.65);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .attr('class', 'bc-xaxis')
      .call(d3.axisBottom(xScale).ticks(3).tickFormat(d3.format('.1f')));

    g.append('g')
      .attr('class', 'bc-yaxis')
      .call(d3.axisLeft(yScale).ticks(3).tickFormat(d3.format('.1f')));

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 34)
      .attr('text-anchor', 'middle')
      .attr('class', 'bc-axis-title')
      .text('Axis 1');

    g.append('text')
      .attr('transform', `translate(-28,${innerH / 2})rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('class', 'bc-axis-title')
      .text('Axis 2');

    void reducedMotion;
  }, [innerW, innerH, dataset, colour, reducedMotion]);

  return (
    <svg
      ref={svgRef}
      className="bc-scatter-svg"
      width={width}
      height={height}
      role="img"
      aria-label={`${dataset.label}: 2D projection of ${dataset.points.length} households`}
    >
      <g
        className="bc-scatter-g"
        transform={`translate(${SCATTER_MARGIN.left},${SCATTER_MARGIN.top})`}
      />
    </svg>
  );
}

// ─── Dataset panel ────────────────────────────────────────────────────────────

type BarcodeView = 'H0' | 'H1';

function DatasetPanel({
  dataset,
  colour,
  barcodeView,
  reducedMotion,
}: {
  dataset: DatasetResult;
  colour: string;
  barcodeView: BarcodeView;
  reducedMotion: boolean;
}) {
  const dim: 0 | 1 = barcodeView === 'H0' ? 0 : 1;
  const features = dataset.features.filter((f) => f.dimension === dim);
  return (
    <div className="bc-panel" style={{ borderTopColor: colour }}>
      <div className="bc-panel-header">
        <h3 className="bc-panel-title" style={{ color: colour }}>
          {dataset.label}
        </h3>
        <p className="bc-panel-desc">{dataset.description}</p>
        <div className="bc-panel-counts">
          <span>H₀: {dataset.h0Count}</span>
          <span>H₁: {dataset.h1Count}</span>
          <span>Showing: {features.length} {barcodeView} intervals</span>
        </div>
      </div>

      <div className="bc-chart-stack">
        <div className="bc-chart-label">Barcode</div>
        <ResponsiveContainer className="bc-chart-box" minHeight={120}>
          {({ width, height }) => (
            <BarcodeSvg
              dataset={dataset}
              width={width}
              height={height}
              dimension={dim}
              colour={colour}
              title={dataset.label}
              reducedMotion={reducedMotion}
            />
          )}
        </ResponsiveContainer>

        <div className="bc-chart-label">Point cloud</div>
        <ResponsiveContainer className="bc-chart-box" minHeight={140}>
          {({ width, height }) => (
            <ScatterSvg
              dataset={dataset}
              width={width}
              height={height}
              colour={colour}
              reducedMotion={reducedMotion}
            />
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface BarcodeComparatorProps {
  className?: string;
}

export function BarcodeComparator({ className }: BarcodeComparatorProps) {
  const [barcodeView, setBarcodeView] = useState<BarcodeView>('H0');
  const [liveMsg, setLiveMsg] = useState('');
  const reducedMotion = useReducedMotion();

  const handleViewChange = (view: BarcodeView) => {
    setBarcodeView(view);
    setLiveMsg(
      `Showing ${view} barcodes. Official: ${OFFICIAL_DATASET.features.filter((f) => f.dimension === (view === 'H0' ? 0 : 1)).length} intervals. ` +
      `Community: ${COMMUNITY_DATASET.features.filter((f) => f.dimension === (view === 'H0' ? 0 : 1)).length} intervals.`,
    );
  };

  const textDescription = [
    `Barcode comparator: official vs community deprivation dimensions, 30 households.`,
    `Showing ${barcodeView} barcodes.`,
    `Official dataset: H₀ count ${OFFICIAL_DATASET.h0Count}, H₁ count ${OFFICIAL_DATASET.h1Count}.`,
    `Community dataset: H₀ count ${COMMUNITY_DATASET.h0Count}, H₁ count ${COMMUNITY_DATASET.h1Count}.`,
    `Bottleneck distances: H₀ = ${H0_BOTTLENECK.toFixed(4)}, H₁ = ${H1_BOTTLENECK.toFixed(4)}.`,
    `The divergence is the topological signature of the difference between official and community measurement.`,
  ].join(' ');

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`bc-wrapper${className ? ` ${className}` : ''}`}>

        {/* ── Bottleneck distance tiles ────────────────────────────────── */}
        <div className="bc-bn-row" aria-label="Bottleneck distances">
          <BottleneckTile dimension={0} value={H0_BOTTLENECK} />
          <BottleneckTile dimension={1} value={H1_BOTTLENECK} />
          <div className="bc-bn-tile bc-bn-tile--note">
            <span className="bc-bn-dim">Interpretation</span>
            <span className="bc-bn-note-long">
              Bottleneck distance quantifies how different two persistence diagrams
              are. A value near 0 means the topological features are nearly
              identical. A positive value means the two measurement systems
              record structurally different patterns of deprivation in the
              same population.
            </span>
          </div>
        </div>

        {/* ── View toggle ──────────────────────────────────────────────── */}
        <div
          className="bc-toggle-row"
          role="group"
          aria-label="Select homology dimension to display"
        >
          <button
            type="button"
            className={`bc-toggle-btn${barcodeView === 'H0' ? ' bc-toggle-btn--active' : ''}`}
            onClick={() => handleViewChange('H0')}
            aria-pressed={barcodeView === 'H0'}
          >
            H₀ — connected components
          </button>
          <button
            type="button"
            className={`bc-toggle-btn${barcodeView === 'H1' ? ' bc-toggle-btn--active' : ''}`}
            onClick={() => handleViewChange('H1')}
            aria-pressed={barcodeView === 'H1'}
          >
            H₁ — loops
          </button>
        </div>

        {/* ── Side-by-side panels ──────────────────────────────────────── */}
        <div className="bc-panels-row">
          <DatasetPanel
            dataset={OFFICIAL_DATASET}
            colour="var(--color-viz-2, #56b4e9)"
            barcodeView={barcodeView}
            reducedMotion={reducedMotion}
          />
          <DatasetPanel
            dataset={COMMUNITY_DATASET}
            colour="var(--color-viz-3, #009e73)"
            barcodeView={barcodeView}
            reducedMotion={reducedMotion}
          />
        </div>

        <AriaLiveRegion message={liveMsg} />
      </div>
    </TextDescriptionToggle>
  );
}
