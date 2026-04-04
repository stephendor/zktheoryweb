/**
 * TDAResultsExplorer.tsx — Task 5.5b — Agent_Interactive_Advanced
 *
 * Interactive TDA Results Explorer: dual-panel display of pre-computed
 * Vietoris-Rips persistence diagrams for four canonical point clouds.
 *
 * Left panel  — point cloud SVG with edges and filled triangles at the
 *               current filtration radius.
 * Right panel — persistence diagram birth-death scatter with live
 *               highlighting of alive/dead/unborn features.
 *
 * Data: static JSON imports from src/data/tda/*.json (pre-computed by
 * scripts/compute-tda.py using native ripser). Zero runtime Python.
 *
 * Pattern: follows NormalDistExplorer.tsx — D3 + React split-effect.
 * A11y: AriaLiveRegion (debounced 200 ms), TextDescriptionToggle,
 *       useReducedMotion static fallback.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { createTooltip, showTooltip, hideTooltip, destroyTooltip } from '@lib/viz/tooltip';
import type { TooltipHandle } from '@lib/viz/tooltip';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import type { TDAPreset, TDAFeature } from '@lib/tda/precomputedTypes';

// Static JSON imports — Vite tree-shakes unused presets at build time.
import circleData from '@data/tda/circle-20pts.json';
import clustersData from '@data/tda/two-clusters-16pts.json';
import figureEightData from '@data/tda/figure-eight-11pts.json';
import randomData from '@data/tda/random-30pts.json';

import './TDAResultsExplorer.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARGIN = { top: 20, right: 24, bottom: 48, left: 52 };
const PANEL_HEIGHT = 340;
const ARIA_DEBOUNCE_MS = 200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PresetId =
  | 'circle-20pts'
  | 'two-clusters-16pts'
  | 'figure-eight-11pts'
  | 'random-30pts';

export interface TDAResultsExplorerProps {
  presetId?: PresetId;
  className?: string;
}

// ---------------------------------------------------------------------------
// Data map
// ---------------------------------------------------------------------------

const PRESET_DATA: Record<PresetId, TDAPreset> = {
  'circle-20pts': circleData as TDAPreset,
  'two-clusters-16pts': clustersData as TDAPreset,
  'figure-eight-11pts': figureEightData as TDAPreset,
  'random-30pts': randomData as TDAPreset,
};

const PRESET_LABELS: Record<PresetId, string> = {
  'circle-20pts': 'Circle (20 pts)',
  'two-clusters-16pts': 'Two Clusters (16 pts)',
  'figure-eight-11pts': 'Figure-Eight (11 pts)',
  'random-30pts': 'Random (30 pts)',
};

const PRESET_DESCRIPTIONS: Record<PresetId, string> = {
  'circle-20pts':
    'Twenty points evenly spaced on the unit circle. At full filtration: 1 connected component, ' +
    '1 persistent loop (H₁) confirming ring structure. The loop persists from radius ≈0.31 to ≈1.78.',
  'two-clusters-16pts':
    'Two Gaussian clusters (8+8 points) centred at (−1.5, 0) and (1.5, 0). ' +
    'The long H₀ bar reflects the large inter-cluster gap — the two components merge only at ' +
    'radius ≈ the inter-cluster distance. Short H₁ features are topological noise from cluster geometry.',
  'figure-eight-11pts':
    'Eleven points arranged as two tangent circles. At full filtration: 1 connected component, ' +
    '2 persistent H₁ loops — one per lobe of the figure-eight. This is the hallmark TDA signature ' +
    'of a wedge sum of two circles.',
  'random-30pts':
    'Thirty randomly placed points. Short-lived H₀ bars record component merging; short-lived H₁ ' +
    'features are topological noise close to the diagonal. No persistent structural loop is expected.',
};

const PRESET_IDS: PresetId[] = [
  'circle-20pts',
  'two-clusters-16pts',
  'figure-eight-11pts',
  'random-30pts',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function euclidean(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function featureState(
  f: TDAFeature,
  radius: number,
): 'unborn' | 'alive' | 'dead' {
  if (f.birth > radius) return 'unborn';
  if (f.death <= radius) return 'dead';
  return 'alive';
}

// ---------------------------------------------------------------------------
// PointCloudPanel — left SVG
// ---------------------------------------------------------------------------

interface PointCloudPanelProps {
  preset: TDAPreset;
  currentRadius: number;
  selectedFeatureIdx: number | null;
  width: number;
}

function PointCloudPanel({
  preset,
  currentRadius,
  selectedFeatureIdx,
  width,
}: PointCloudPanelProps) {
  const { point_cloud, diagrams, metadata } = preset;

  // Compute SVG coordinate extents
  const xs = point_cloud.map((p) => p[0]);
  const ys = point_cloud.map((p) => p[1]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  const MARGIN_PC = { top: 24, right: 24, bottom: 24, left: 24 };
  const innerW = width - MARGIN_PC.left - MARGIN_PC.right;
  const innerH = PANEL_HEIGHT - MARGIN_PC.top - MARGIN_PC.bottom;

  const xPad = (xMax - xMin) * 0.08 || 0.2;
  const yPad = (yMax - yMin) * 0.08 || 0.2;

  const xScale = d3
    .scaleLinear()
    .domain([xMin - xPad, xMax + xPad])
    .range([0, innerW]);
  const yScale = d3
    .scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([innerH, 0]);

  // ── Edges within currentRadius ─────────────────────────────────────────
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < point_cloud.length; i++) {
    for (let j = i + 1; j < point_cloud.length; j++) {
      if (euclidean(point_cloud[i], point_cloud[j]) <= currentRadius) {
        edges.push([i, j]);
      }
    }
  }

  // ── Triangles within currentRadius ─────────────────────────────────────
  // Build adjacency for triangles
  const edgeSet = new Set(edges.map(([i, j]) => `${i}-${j}`));
  const triangles: Array<[number, number, number]> = [];
  for (let i = 0; i < point_cloud.length; i++) {
    for (let j = i + 1; j < point_cloud.length; j++) {
      if (!edgeSet.has(`${i}-${j}`)) continue;
      for (let k = j + 1; k < point_cloud.length; k++) {
        if (
          edgeSet.has(`${i}-${k}`) &&
          edgeSet.has(`${j}-${k}`)
        ) {
          triangles.push([i, j, k]);
        }
      }
    }
  }

  // ── Highlighted edges for selected H₁ feature ──────────────────────────
  // Use birth radius as proxy: edges that appeared at birth radius
  const highlightedEdgeSet = new Set<string>();
  const highlightedPointSet = new Set<number>();
  if (selectedFeatureIdx !== null) {
    const h1Feature = diagrams.H1[selectedFeatureIdx];
    if (h1Feature) {
      const birthR = h1Feature.birth;
      for (let i = 0; i < point_cloud.length; i++) {
        for (let j = i + 1; j < point_cloud.length; j++) {
          const d = euclidean(point_cloud[i], point_cloud[j]);
          if (d <= birthR) {
            highlightedEdgeSet.add(`${i}-${j}`);
            highlightedPointSet.add(i);
            highlightedPointSet.add(j);
          }
        }
      }
    }
  }

  return (
    <svg
      className="tre-svg"
      width={width}
      height={PANEL_HEIGHT}
      role="img"
      aria-label={`Point cloud with ${point_cloud.length} points at filtration radius ${currentRadius.toFixed(2)}`}
    >
      <g transform={`translate(${MARGIN_PC.left},${MARGIN_PC.top})`}>
        {/* Radius circles (dashed, 10% opacity) */}
        {point_cloud.map((pt, i) => (
          <circle
            key={`rc-${i}`}
            className="tre-radius-circle"
            cx={xScale(pt[0])}
            cy={yScale(pt[1])}
            r={Math.max(0, xScale(pt[0] + currentRadius) - xScale(pt[0]))}
            aria-hidden="true"
          />
        ))}

        {/* Filled triangles */}
        {triangles.map(([a, b, c]) => (
          <polygon
            key={`tri-${a}-${b}-${c}`}
            className="tre-triangle"
            points={`${xScale(point_cloud[a][0])},${yScale(point_cloud[a][1])} ${xScale(point_cloud[b][0])},${yScale(point_cloud[b][1])} ${xScale(point_cloud[c][0])},${yScale(point_cloud[c][1])}`}
            aria-hidden="true"
          />
        ))}

        {/* Edges */}
        {edges.map(([i, j]) => {
          const key = `${i}-${j}`;
          const isHighlighted = highlightedEdgeSet.has(key);
          return (
            <line
              key={`edge-${key}`}
              className={isHighlighted ? 'tre-edge--highlighted' : 'tre-edge'}
              x1={xScale(point_cloud[i][0])}
              y1={yScale(point_cloud[i][1])}
              x2={xScale(point_cloud[j][0])}
              y2={yScale(point_cloud[j][1])}
              aria-hidden="true"
            />
          );
        })}

        {/* Points */}
        {point_cloud.map((pt, i) => (
          <circle
            key={`pt-${i}`}
            className={`tre-point${highlightedPointSet.has(i) ? ' tre-point--highlighted' : ''}`}
            cx={xScale(pt[0])}
            cy={yScale(pt[1])}
            r={4}
            aria-hidden="true"
          />
        ))}

        {/* Axis labels */}
        <text
          className="tre-axis-title"
          x={innerW / 2}
          y={innerH + 18}
          textAnchor="middle"
          aria-hidden="true"
        >
          x ε range: {metadata.epsilon_range[0].toFixed(2)} – {metadata.epsilon_range[1].toFixed(2)}
        </text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PersistenceDiagramPanel — right SVG
// ---------------------------------------------------------------------------

interface PersistenceDiagramPanelProps {
  preset: TDAPreset;
  currentRadius: number;
  selectedFeatureIdx: number | null;
  onFeatureSelect: (dim: 1, idx: number | null) => void;
  width: number;
}

function PersistenceDiagramPanel({
  preset,
  currentRadius,
  selectedFeatureIdx,
  onFeatureSelect,
  width,
}: PersistenceDiagramPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);

  const { diagrams, metadata } = preset;
  const maxR = metadata.epsilon_range[1];

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = PANEL_HEIGHT - MARGIN.top - MARGIN.bottom;

  const xScale = d3.scaleLinear([0, maxR], [0, plotW]);
  const yScale = d3.scaleLinear([0, maxR], [plotH, 0]);

  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  // Tooltip lifecycle
  useEffect(() => {
    const wrapper = svgRef.current?.parentElement;
    if (!wrapper) return;
    tooltipRef.current = createTooltip(wrapper as HTMLElement);
    return () => {
      if (tooltipRef.current) {
        destroyTooltip(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);

  const handleFeatureHover = useCallback(
    (event: React.PointerEvent, dim: 0 | 1, f: TDAFeature) => {
      if (!tooltipRef.current) return;
      const dimLabel = dim === 0 ? 'H₀ component' : 'H₁ loop';
      const persistence = (f.death - f.birth).toFixed(3);
      showTooltip(
        tooltipRef.current,
        event.nativeEvent,
        `${dimLabel}: born r=${f.birth.toFixed(3)}, died r=${f.death.toFixed(3)}, persistence ${persistence}`,
      );
    },
    [],
  );

  const handleFeatureLeave = useCallback(() => {
    if (tooltipRef.current) hideTooltip(tooltipRef.current);
  }, []);

  const allFeatures: Array<{ dim: 0 | 1; f: TDAFeature; origIdx: number }> = [
    ...diagrams.H0.map((f, i) => ({ dim: 0 as const, f, origIdx: i })),
    ...diagrams.H1.map((f, i) => ({ dim: 1 as const, f, origIdx: i })),
  ];

  return (
    <svg
      ref={svgRef}
      className="tre-svg"
      width={width}
      height={PANEL_HEIGHT}
      role="img"
      aria-label={`Persistence diagram: ${diagrams.H0.length} H₀ features, ${diagrams.H1.length} H₁ features`}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Diagonal guide line */}
        <line
          className="tre-diag-line"
          x1={xScale(0)}
          y1={yScale(0)}
          x2={xScale(maxR)}
          y2={yScale(maxR)}
          aria-hidden="true"
        />

        {/* Vertical radius marker */}
        {currentRadius > 0 && (
          <line
            className="tre-radius-line"
            x1={xScale(currentRadius)}
            y1={yScale(0)}
            x2={xScale(currentRadius)}
            y2={yScale(maxR)}
            aria-hidden="true"
          />
        )}

        {/* X axis */}
        <g transform={`translate(0,${plotH})`} aria-hidden="true">
          <line className="tre-axis-line" x1={0} y1={0} x2={plotW} y2={0} />
          {xTicks.map((t) => (
            <g key={`xt-${t}`} transform={`translate(${xScale(t)},0)`}>
              <line className="tre-axis-tick" x1={0} y1={0} x2={0} y2={5} />
              <text className="tre-axis-label" y={16} textAnchor="middle">
                {t.toFixed(2)}
              </text>
            </g>
          ))}
          <text
            className="tre-axis-title"
            x={plotW / 2}
            y={38}
            textAnchor="middle"
          >
            Birth (radius)
          </text>
        </g>

        {/* Y axis */}
        <g aria-hidden="true">
          <line className="tre-axis-line" x1={0} y1={0} x2={0} y2={plotH} />
          {yTicks.map((t) => (
            <g key={`yt-${t}`} transform={`translate(0,${yScale(t)})`}>
              <line className="tre-axis-tick" x1={-5} y1={0} x2={0} y2={0} />
              <text
                className="tre-axis-label"
                x={-8}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {t.toFixed(2)}
              </text>
            </g>
          ))}
          <text
            className="tre-axis-title"
            transform={`translate(-38,${plotH / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            Death (radius)
          </text>
        </g>

        {/* Legend */}
        <rect className="tre-legend-bg" x={plotW - 88} y={4} width={84} height={44} rx={3} />
        <circle cx={plotW - 76} cy={16} r={5} fill="var(--color-tda-teal, #1a5f6a)" />
        <text className="tre-legend-text" x={plotW - 67} y={16}>H₀ component</text>
        <circle cx={plotW - 76} cy={32} r={5} fill="var(--color-viz-6, #d55e00)" />
        <text className="tre-legend-text" x={plotW - 67} y={32}>H₁ loop</text>

        {/* Feature points */}
        {allFeatures.map(({ dim, f, origIdx }) => {
          const state = featureState(f, currentRadius);
          const cx = xScale(f.birth);
          const cy = yScale(f.death);
          const isSelected = dim === 1 && origIdx === selectedFeatureIdx;
          const stateClass =
            state === 'alive'
              ? 'tre-feature--alive'
              : state === 'dead'
                ? 'tre-feature--dead'
                : 'tre-feature--unborn';
          const dimClass = dim === 0 ? 'tre-feature-h0' : 'tre-feature-h1';

          return (
            <circle
              key={`feat-${dim}-${origIdx}`}
              className={`${dimClass} ${stateClass}${isSelected ? ' tre-feature--selected' : ''}`}
              cx={cx}
              cy={cy}
              r={isSelected ? 8 : 5}
              tabIndex={dim === 1 ? 0 : -1}
              role={dim === 1 ? 'button' : undefined}
              aria-label={
                dim === 1
                  ? `H₁ loop: born ${f.birth.toFixed(3)}, died ${f.death.toFixed(3)}, persistence ${(f.death - f.birth).toFixed(3)}`
                  : undefined
              }
              onPointerMove={(e) => handleFeatureHover(e, dim, f)}
              onPointerLeave={handleFeatureLeave}
              onClick={() => {
                if (dim === 1) {
                  onFeatureSelect(1, isSelected ? null : origIdx);
                }
              }}
              onKeyDown={(e) => {
                if (dim === 1 && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onFeatureSelect(1, isSelected ? null : origIdx);
                }
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TDAResultsExplorer — main component
// ---------------------------------------------------------------------------

export function TDAResultsExplorer({
  presetId: initialPresetId = 'circle-20pts',
  className,
}: TDAResultsExplorerProps) {
  const reducedMotion = useReducedMotion();

  const [activePresetId, setActivePresetId] = useState<PresetId>(initialPresetId);
  const preset = PRESET_DATA[activePresetId];
  const maxR = preset.metadata.epsilon_range[1];

  // Static snapshot radius for reduced-motion mode
  const staticRadius = maxR * 0.6;

  const [currentRadius, setCurrentRadius] = useState(() =>
    reducedMotion ? staticRadius : 0,
  );
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState<number | null>(null);

  // ARIA live region — debounced 200 ms
  const [liveMsg, setLiveMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset slider + selection when preset changes
  useEffect(() => {
    const newMax = PRESET_DATA[activePresetId].metadata.epsilon_range[1];
    setCurrentRadius(reducedMotion ? newMax * 0.6 : 0);
    setSelectedFeatureIdx(null);
    setLiveMsg('');
  }, [activePresetId, reducedMotion]);

  // Announce state changes
  const announce = useCallback((radius: number) => {
    const p = PRESET_DATA[activePresetId];
    const aliveH0 = p.diagrams.H0.filter(
      (f) => featureState(f, radius) === 'alive',
    ).length;
    const aliveH1 = p.diagrams.H1.filter(
      (f) => featureState(f, radius) === 'alive',
    ).length;
    const msg = `Filtration radius ${radius.toFixed(2)}. H₀: ${aliveH0} components. H₁: ${aliveH1} features alive.`;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setLiveMsg(msg), ARIA_DEBOUNCE_MS);
  }, [activePresetId]);

  // Clear any pending debounce on unmount to avoid setState after unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleRadiusChange = useCallback(
    (val: number) => {
      setCurrentRadius(val);
      announce(val);
    },
    [announce],
  );

  const handleFeatureSelect = useCallback(
    (_dim: 1, idx: number | null) => {
      setSelectedFeatureIdx(idx);
    },
    [],
  );

  const handleReset = useCallback(() => {
    setCurrentRadius(0);
    setSelectedFeatureIdx(null);
    setLiveMsg('Filtration radius reset to 0.');
  }, []);

  const aliveH0 = useMemo(
    () => preset.diagrams.H0.filter((f) => featureState(f, currentRadius) === 'alive').length,
    [preset, currentRadius],
  );
  const aliveH1 = useMemo(
    () => preset.diagrams.H1.filter((f) => featureState(f, currentRadius) === 'alive').length,
    [preset, currentRadius],
  );

  return (
    <TextDescriptionToggle description={PRESET_DESCRIPTIONS[activePresetId]}>
      <div className={`tre-wrapper${className ? ` ${className}` : ''}`}>
        {/* Dual panels */}
        <div className="tre-panels">
          {/* Left — point cloud */}
          <div className="tre-panel">
            <p className="tre-panel-label" aria-hidden="true">
              Point Cloud
            </p>
            <div className="tre-svg-wrapper">
              <ResponsiveContainer minHeight={PANEL_HEIGHT}>
                {({ width }) => (
                  <PointCloudPanel
                    preset={preset}
                    currentRadius={currentRadius}
                    selectedFeatureIdx={selectedFeatureIdx}
                    width={width}
                  />
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right — persistence diagram */}
          <div className="tre-panel">
            <p className="tre-panel-label" aria-hidden="true">
              Persistence Diagram
              {selectedFeatureIdx !== null
                ? ` — H₁ loop ${selectedFeatureIdx + 1} selected`
                : ''}
            </p>
            <div className="tre-svg-wrapper">
              <ResponsiveContainer minHeight={PANEL_HEIGHT}>
                {({ width }) => (
                  <PersistenceDiagramPanel
                    preset={preset}
                    currentRadius={currentRadius}
                    selectedFeatureIdx={selectedFeatureIdx}
                    onFeatureSelect={handleFeatureSelect}
                    width={width}
                  />
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Controls strip */}
        <div className="tre-controls">
          {/* Radius slider — hidden in reduced-motion mode */}
          {!reducedMotion && (
            <div className="tre-slider-row">
              <label className="tre-slider-label" htmlFor="tre-radius-slider">
                Filtration radius: {currentRadius.toFixed(2)} / {maxR.toFixed(2)}
              </label>
              <input
                id="tre-radius-slider"
                className="tre-slider"
                type="range"
                min={0}
                max={maxR}
                step={0.01}
                value={currentRadius}
                aria-label={`Filtration radius: ${currentRadius.toFixed(2)} of ${maxR.toFixed(2)}`}
                aria-valuemin={0}
                aria-valuemax={maxR}
                aria-valuenow={currentRadius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
              />
            </div>
          )}
          {reducedMotion && (
            <p className="tre-slider-label">
              Filtration radius: {currentRadius.toFixed(2)} / {maxR.toFixed(2)}{' '}
              (static view — reduced motion active)
            </p>
          )}

          {/* Status readout */}
          <div className="tre-slider-row" aria-live="off">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-muted)' }}>
              Active: H₀ {aliveH0} / {preset.diagrams.H0.length} &nbsp;·&nbsp;
              H₁ {aliveH1} / {preset.diagrams.H1.length}
              {selectedFeatureIdx !== null && (
                <> &nbsp;·&nbsp; H₁ loop {selectedFeatureIdx + 1} highlighted</>
              )}
            </span>
          </div>

          {/* Buttons + preset selector */}
          <div className="tre-button-row">
            <button
              className="tre-btn-reset"
              type="button"
              onClick={handleReset}
              aria-label="Reset filtration radius to zero"
            >
              Reset
            </button>
            <label className="tre-preset-label" htmlFor="tre-preset-select">
              Preset:
            </label>
            <select
              id="tre-preset-select"
              className="tre-preset-select"
              value={activePresetId}
              aria-label="Select point cloud preset"
              onChange={(e) => setActivePresetId(e.target.value as PresetId)}
            >
              {PRESET_IDS.map((id) => (
                <option key={id} value={id}>
                  {PRESET_LABELS[id]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ARIA live region */}
        <AriaLiveRegion message={liveMsg} />
      </div>
    </TextDescriptionToggle>
  );
}
