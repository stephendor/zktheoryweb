/**
 * PointCloudExplorer.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Interactive Point Cloud & Distance Explorer.
 *
 * Features:
 *   - 2-D scatter plot of a preset point cloud (normalised to [0,1]²).
 *   - Click any point to select it as the ε-ball centre.
 *   - ε slider controls ball radius; ball shape changes with metric:
 *       Euclidean → circle, Manhattan → rotated square (diamond).
 *   - Metric toggle: Euclidean (L₂) vs Manhattan (L₁).
 *   - Collapsed pairwise distance matrix panel (expandable).
 *   - Preset selector: Scattered, Two clusters, Ring.
 *
 * Architecture follows the established pattern (NormalDistExplorer/MapperParameterLab):
 *   - All D3 DOM mutations isolated in a single useEffect writing to svgRef.
 *   - React owns state and controls; D3 owns SVG rendering.
 *   - getVizColorScale for Okabe-Ito colours (6-slot).
 *   - AriaLiveRegion + TextDescriptionToggle from src/lib/viz/a11y/.
 *   - useReducedMotion for animation guard.
 *   - client:visible lazy hydration (set in [slug].astro).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { getVizColorScale } from '@lib/viz/scales';
import {
  createTooltip,
  showTooltip,
  hideTooltip,
  destroyTooltip,
} from '@lib/viz/tooltip';
import type { TooltipHandle } from '@lib/viz/tooltip';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import {
  getEpsBallIndices,
  computeDistanceMatrix,
  getDistance,
  POINT_CLOUD_PRESETS,
  DEFAULT_PRESET_ID,
  DEFAULT_EPS,
  EPS_MIN,
  EPS_MAX,
  EPS_STEP,
} from './PointCloudExplorer.data';
import type { Metric } from './PointCloudExplorer.data';
import './PointCloudExplorer.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN = { top: 20, right: 20, bottom: 44, left: 44 };

// ─── Inner chart component ─────────────────────────────────────────────────────

interface PointCloudChartProps {
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
  selectedIdx: number | null;
  epsilon: number;
  metric: Metric;
  reducedMotion: boolean;
  onSelectPoint: (idx: number | null) => void;
  onHover: (msg: string) => void;
}

function PointCloudChart({
  width,
  height,
  points,
  selectedIdx,
  epsilon,
  metric,
  reducedMotion,
  onSelectPoint,
  onHover,
}: PointCloudChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  // Normalised [0,1] → pixel
  const xScale = useMemo(
    () => d3.scaleLinear().domain([0, 1]).range([0, innerW]),
    [innerW],
  );
  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, 1]).range([innerH, 0]),
    [innerH],
  );

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl || innerW <= 0 || innerH <= 0) return;

    if (!tooltipRef.current) {
      tooltipRef.current = createTooltip(containerEl);
    }

    const colorScale = getVizColorScale();
    const colIn = colorScale('inside');       // viz-1 (orange)
    const colOut = colorScale('outside');     // viz-2 (sky-blue)
    const colSelected = colorScale('selected'); // viz-3 (green)

    const svg = d3.select(svgEl);

    // ── ball indices ──────────────────────────────────────────────────────────
    const ballIndices =
      selectedIdx !== null
        ? new Set(getEpsBallIndices(selectedIdx, points, epsilon, metric))
        : new Set<number>();

    // ── ε-ball shape ──────────────────────────────────────────────────────────
    const ballG = svg.select<SVGGElement>('.pce-ball-group');
    ballG.selectAll('*').remove();

    if (selectedIdx !== null) {
      const cx = xScale(points[selectedIdx].x);
      const cy = yScale(points[selectedIdx].y);
      const rx = Math.abs(xScale(epsilon) - xScale(0));  // x-radius in pixels
      const ry = Math.abs(yScale(0) - yScale(epsilon));   // y-radius in pixels (scale may invert)

      if (metric === 'euclidean') {
        ballG
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', rx)
          .attr('fill', colIn)
          .attr('fill-opacity', 0.12)
          .attr('stroke', colIn)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6 3');
      } else {
        // Manhattan ball: rotated square (diamond).
        // In L₁ metric, the ball { d₁ ≤ ε } is a square rotated 45°.
        // Use separate rx/ry so the diamond is correct when pixel scales differ.
        const pts = [
          [cx, cy - ry],
          [cx + rx, cy],
          [cx, cy + ry],
          [cx - rx, cy],
        ];
        ballG
          .append('polygon')
          .attr('points', pts.map((p) => p.join(',')).join(' '))
          .attr('fill', colIn)
          .attr('fill-opacity', 0.12)
          .attr('stroke', colIn)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6 3');
      }
    }

    // ── Points ────────────────────────────────────────────────────────────────
    const pointsG = svg.select<SVGGElement>('.pce-points-group');
    const circles = pointsG
      .selectAll<SVGCircleElement, (typeof points)[0]>('circle')
      .data(points);

    const enter = circles
      .enter()
      .append('circle')
      .attr('r', 7)
      .attr('cursor', 'pointer');

    const merged = circles.merge(enter);

    merged
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('r', (_, i) => (i === selectedIdx ? 9 : 7))
      .attr('fill', (_, i) => {
        if (i === selectedIdx) return colSelected;
        if (ballIndices.has(i)) return colIn;
        return colOut;
      })
      .attr('fill-opacity', (_, i) => (i === selectedIdx || ballIndices.has(i) ? 1 : 0.65))
      .attr('stroke', (_, i) => (i === selectedIdx ? colSelected : 'var(--color-neutral-surface, #fff)'))
      .attr('stroke-width', (_, i) => (i === selectedIdx ? 2.5 : 1.5));

    circles.exit().remove();

    // ── Index labels ──────────────────────────────────────────────────────────
    const labelsG = svg.select<SVGGElement>('.pce-labels-group');
    const labels = labelsG
      .selectAll<SVGTextElement, (typeof points)[0]>('text')
      .data(points);

    labels
      .enter()
      .append('text')
      .merge(labels)
      .attr('x', (d) => xScale(d.x))
      .attr('y', (d) => yScale(d.y) - 11)
      .attr('text-anchor', 'middle')
      .attr('class', 'pce-point-label')
      .text((_, i) => String(i));

    labels.exit().remove();

    // ── Axes ──────────────────────────────────────────────────────────────────
    const xAxis = d3
      .axisBottom(xScale)
      .tickSize(3)
      .ticks(5)
      .tickFormat(d3.format('.1f'));
    const yAxis = d3
      .axisLeft(yScale)
      .tickSize(3)
      .ticks(5)
      .tickFormat(d3.format('.1f'));

    svg.select<SVGGElement>('.pce-x-axis').call(xAxis);
    svg.select<SVGGElement>('.pce-y-axis').call(yAxis);

    // ── Interaction ───────────────────────────────────────────────────────────
    merged
      .on('click', (_event: MouseEvent, _d, i?: number) => {
        // d3 v7: event, datum, index
      })
      .on('pointerenter', (event: PointerEvent, d, ...rest) => {
        const i = points.indexOf(d);
        const dist =
          selectedIdx !== null && i !== selectedIdx
            ? getDistance(points[selectedIdx], d, metric).toFixed(3)
            : null;
        const distStr = dist ? ` | d = ${dist}` : '';
        const tt = tooltipRef.current;
        if (tt) {
          showTooltip(
            tt,
            event,
            `Point ${i}: (${d.x.toFixed(2)}, ${d.y.toFixed(2)})${distStr}`,
          );
        }
        onHover(
          `Point ${i} at (${d.x.toFixed(2)}, ${d.y.toFixed(2)})${dist ? `. Distance from selected: ${dist}` : ''}.`,
        );
      })
      .on('pointerleave', () => {
        const tt = tooltipRef.current;
        if (tt) hideTooltip(tt);
      });

    // Re-attach click on merged selection using index tracking
    pointsG
      .selectAll<SVGCircleElement, (typeof points)[0]>('circle')
      .on('click', (_event: MouseEvent, d) => {
        const i = points.indexOf(d);
        onSelectPoint(i === selectedIdx ? null : i);
      });

    void reducedMotion;
  }, [
    width,
    height,
    innerW,
    innerH,
    points,
    selectedIdx,
    epsilon,
    metric,
    reducedMotion,
    xScale,
    yScale,
    onSelectPoint,
    onHover,
  ]);

  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        destroyTooltip(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="pce-chart-container">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="pce-svg"
        role="img"
        aria-label="Point cloud scatter plot. Click a point to select it and see its ε-ball."
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <g className="pce-ball-group" />
          <g className="pce-points-group" />
          <g className="pce-labels-group" />
          <g className="pce-x-axis" transform={`translate(0,${innerH})`} />
          <g className="pce-y-axis" />
        </g>
      </svg>
    </div>
  );
}

// ─── Distance matrix panel ────────────────────────────────────────────────────

interface DistanceMatrixPanelProps {
  points: Array<{ x: number; y: number }>;
  metric: Metric;
  selectedIdx: number | null;
}

function DistanceMatrixPanel({ points, metric, selectedIdx }: DistanceMatrixPanelProps) {
  const matrix = useMemo(
    () => computeDistanceMatrix(points, metric),
    [points, metric],
  );

  // Colour cells by distance magnitude
  const maxDist = useMemo(() => {
    let m = 0;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (matrix[i][j] > m) m = matrix[i][j];
      }
    }
    return m;
  }, [matrix, points]);

  return (
    <div className="pce-matrix-wrapper">
      <div className="pce-matrix-scroll" role="region" aria-label="Pairwise distance matrix">
        <table className="pce-matrix-table" aria-label={`Pairwise ${metric} distances`}>
          <caption className="sr-only">
            Pairwise {metric} distance matrix. Lower-left is symmetric.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="pce-matrix-corner" />
              {points.map((_, j) => (
                <th
                  key={j}
                  scope="col"
                  className={`pce-matrix-header${j === selectedIdx ? ' pce-matrix-header--selected' : ''}`}
                >
                  {j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((_, i) => (
              <tr key={i}>
                <th
                  scope="row"
                  className={`pce-matrix-rowheader${i === selectedIdx ? ' pce-matrix-header--selected' : ''}`}
                >
                  {i}
                </th>
                {points.map((_, j) => {
                  const d = matrix[i][j];
                  const alpha = maxDist > 0 ? d / maxDist : 0;
                  const isDiag = i === j;
                  const isSelected = i === selectedIdx || j === selectedIdx;
                  return (
                    <td
                      key={j}
                      className={`pce-matrix-cell${isDiag ? ' pce-matrix-cell--diag' : ''}${isSelected && !isDiag ? ' pce-matrix-cell--selected-row' : ''}`}
                      style={
                        !isDiag
                          ? { '--cell-alpha': String(alpha) } as React.CSSProperties
                          : undefined
                      }
                      title={`d(${i}, ${j}) = ${d.toFixed(3)}`}
                    >
                      {isDiag ? '—' : d.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main exported component ───────────────────────────────────────────────────

export interface PointCloudExplorerProps {
  className?: string;
}

export function PointCloudExplorer({ className }: PointCloudExplorerProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [metric, setMetric] = useState<Metric>('euclidean');
  const [epsilon, setEpsilon] = useState(DEFAULT_EPS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [liveMsg, setLiveMsg] = useState('');

  const reducedMotion = useReducedMotion();

  // ── Derived data ───────────────────────────────────────────────────────────
  const preset = useMemo(
    () => POINT_CLOUD_PRESETS.find((p) => p.id === presetId) ?? POINT_CLOUD_PRESETS[0],
    [presetId],
  );
  const points = preset.points;

  const ballIndices = useMemo(
    () =>
      selectedIdx !== null
        ? getEpsBallIndices(selectedIdx, points, epsilon, metric)
        : [],
    [selectedIdx, points, epsilon, metric],
  );

  // Reset selection when preset or metric changes
  useEffect(() => {
    setSelectedIdx(null);
  }, [presetId, metric]);

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const handleSelectPoint = useCallback(
    (idx: number | null) => {
      setSelectedIdx(idx);
      if (idx === null) {
        setLiveMsg('Selection cleared.');
      } else {
        const inside = getEpsBallIndices(idx, points, epsilon, metric);
        setLiveMsg(
          `Selected point ${idx}. ε-ball contains ${inside.length} other point${inside.length !== 1 ? 's' : ''} (${metric} metric, ε = ${epsilon.toFixed(2)}).`,
        );
      }
    },
    [points, epsilon, metric],
  );

  const handleHover = useCallback((msg: string) => setLiveMsg(msg), []);

  // ── Text description ───────────────────────────────────────────────────────
  const textDescription = [
    `Preset: ${preset.label}. ${points.length} points plotted.`,
    `Metric: ${metric === 'euclidean' ? 'Euclidean (L₂) — ball is a circle' : 'Manhattan (L₁) — ball is a diamond'}.`,
    `ε = ${epsilon.toFixed(2)}.`,
    selectedIdx !== null
      ? `Selected point ${selectedIdx}. ε-ball contains ${ballIndices.length} other point${ballIndices.length !== 1 ? 's' : ''}.`
      : 'No point selected. Click a point to see its ε-ball.',
  ].join(' ');

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`pce-wrapper${className ? ` ${className}` : ''}`}>

        {/* ── Chart ─────────────────────────────────────────────────────── */}
        <ResponsiveContainer className="pce-responsive" minHeight={380}>
          {({ width, height }) => (
            <PointCloudChart
              width={width}
              height={height}
              points={points}
              selectedIdx={selectedIdx}
              epsilon={epsilon}
              metric={metric}
              reducedMotion={reducedMotion}
              onSelectPoint={handleSelectPoint}
              onHover={handleHover}
            />
          )}
        </ResponsiveContainer>

        {/* ── Controls ──────────────────────────────────────────────────── */}
        <div className="pce-controls" role="group" aria-label="Point cloud controls">

          {/* Preset */}
          <div className="pce-control-group">
            <label htmlFor="pce-preset-select" className="pce-label">
              Point cloud
            </label>
            <select
              id="pce-preset-select"
              className="pce-select"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
            >
              {POINT_CLOUD_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <fieldset className="pce-fieldset">
            <legend className="pce-label">Metric</legend>
            <label className="pce-radio-label">
              <input
                type="radio"
                name="pce-metric"
                value="euclidean"
                checked={metric === 'euclidean'}
                onChange={() => setMetric('euclidean')}
                className="pce-radio"
              />
              Euclidean (L₂) — circle
            </label>
            <label className="pce-radio-label">
              <input
                type="radio"
                name="pce-metric"
                value="manhattan"
                checked={metric === 'manhattan'}
                onChange={() => setMetric('manhattan')}
                className="pce-radio"
              />
              Manhattan (L₁) — diamond
            </label>
          </fieldset>

          {/* ε slider */}
          <div className="pce-control-group pce-eps-control">
            <label htmlFor="pce-eps-slider" className="pce-label">
              ε (ball radius):{' '}
              <span className="pce-eps-value">{epsilon.toFixed(2)}</span>
            </label>
            <input
              id="pce-eps-slider"
              type="range"
              min={EPS_MIN}
              max={EPS_MAX}
              step={EPS_STEP}
              value={epsilon}
              onChange={(e) => {
                const newEps = Number(e.target.value);
                setEpsilon(newEps);
                if (selectedIdx !== null) {
                  const inside = getEpsBallIndices(selectedIdx, points, newEps, metric);
                  setLiveMsg(
                    `ε = ${newEps.toFixed(2)}. Ball around point ${selectedIdx} contains ${inside.length} point${inside.length !== 1 ? 's' : ''}.`,
                  );
                }
              }}
              className="pce-slider"
              aria-valuemin={EPS_MIN}
              aria-valuemax={EPS_MAX}
              aria-valuenow={epsilon}
              aria-valuetext={`epsilon ${epsilon.toFixed(2)}`}
            />
            <div className="pce-eps-range-labels" aria-hidden="true">
              <span>{EPS_MIN} (tight)</span>
              <span>{EPS_MAX} (wide)</span>
            </div>
          </div>

          {/* Status — aria-live removed; AriaLiveRegion handles announcements */}
          {selectedIdx !== null && (
            <div className="pce-ball-status">
              Point <strong>{selectedIdx}</strong>: {ballIndices.length} neighbour{ballIndices.length !== 1 ? 's' : ''} in ε-ball
              {ballIndices.length > 0 && (
                <> ({ballIndices.join(', ')})</>
              )}
              <button
                type="button"
                className="pce-clear-btn"
                onClick={() => handleSelectPoint(null)}
                aria-label="Clear point selection"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ── Distance matrix (collapsible) ─────────────────────────────── */}
        <details
          className="pce-matrix-details"
          open={showMatrix}
          onToggle={(e) => setShowMatrix((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className="pce-matrix-summary">
            Pairwise distance matrix ({metric})
          </summary>
          {showMatrix && (
            <DistanceMatrixPanel
              points={points}
              metric={metric}
              selectedIdx={selectedIdx}
            />
          )}
        </details>

        {/* ── ARIA live region ──────────────────────────────────────────── */}
        <AriaLiveRegion message={liveMsg} />
      </div>
    </TextDescriptionToggle>
  );
}
