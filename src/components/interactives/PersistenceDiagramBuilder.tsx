/**
 * PersistenceDiagramBuilder.tsx — Task 3.7b — Agent_Interactive_Core
 *
 * Dual-panel interactive that synchronises a PointCloudEditor (left) with a
 * Persistence Diagram (right). The Vietoris-Rips filtration is computed live
 * from the current point cloud and displayed as a birth-death scatter plot.
 *
 * Architecture:
 *   PersistenceDiagramBuilder (parent)
 *     ├─ PointCloudEditor  (left panel — editable point cloud)
 *     └─ PersistenceDiagram (right panel — birth/death scatter)
 *
 * Panels are synchronised via shared parent state:
 *   - points        → fed to computePersistence() to derive features
 *   - currentRadius → controls the complex overlay on the left and
 *                     highlights alive/born features on the right
 *   - features      → rendered in the persistence diagram
 *
 * Step 1  delivers: dual panels, complex overlay, synchronisation.
 * Step 2  will add: filtration slider, play/pause, step-through, cross-highlight.
 * Step 3  will add: a11y polish, manifest MDX, Storybook, final tests.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { createTooltip, showTooltip, hideTooltip, destroyTooltip } from '@lib/viz/tooltip';
import type { TooltipHandle } from '@lib/viz/tooltip';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import { PointCloudEditor } from './PointCloudEditor';
import type { ComplexOverlay } from './PointCloudEditor';
import {
  computePersistence,
  buildComplex,
} from '@lib/tda/vietorisRips';
import type { Point2D, PersistenceFeature } from '@lib/tda/vietorisRips';

import './PersistenceDiagramBuilder.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of evenly-spaced radius steps for persistence computation. */
const RADIUS_STEPS = 50;
/** Diagram SVG height (same as the PointCloudEditor canvas for visual alignment). */
const DIAGRAM_HEIGHT = 380;
/** Margin around the birth-death axes (pixels). */
const MARGIN = { top: 24, right: 24, bottom: 48, left: 52 };
/** Animation duration in milliseconds at 1× speed. */
const ANIM_DURATION_MS = 4000;
/** Debounce delay (ms) for AriaLiveRegion announcements to avoid flooding screen readers. */
const ARIA_DEBOUNCE_MS = 200;

// ---------------------------------------------------------------------------
// Preset labels — used for educational annotations in TextDescriptionToggle
// ---------------------------------------------------------------------------

type PresetLabel = 'Circle (8 pts)' | 'Two Clusters (8 pts)' | 'Figure-8 (11 pts)' | 'Random (15 pts)' | null;

const PRESET_NOTES: Record<NonNullable<PresetLabel>, string> = {
  'Circle (8 pts)':
    'A persistent H₁ loop is expected — this is the topological signature of a circle.',
  'Two Clusters (8 pts)':
    'Two long-lived H₀ bars are the signature feature. The H₁ loop (β₁=1) reflects the ' +
    'square geometry of this 4-point configuration, not the clustering structure.',
  'Figure-8 (11 pts)':
    'Two persistent H₁ loops expected — one per circle in the figure-eight.',
  'Random (15 pts)':
    'Random point clouds typically produce short-lived features close to the diagonal (noise).',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute maximum pairwise Euclidean distance for a point set. Returns 1 if < 2 points. */
function maxPairwiseDist(pts: Point2D[]): number {
  if (pts.length < 2) return 1;
  let max = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > max) max = d;
    }
  }
  return max > 0 ? max : 1;
}

/** Build 50 evenly-spaced radius steps from 0 to maxRadius (inclusive). */
function buildRadiusSteps(maxRadius: number): number[] {
  return Array.from({ length: RADIUS_STEPS }, (_, i) => (i / (RADIUS_STEPS - 1)) * maxRadius);
}

// ---------------------------------------------------------------------------
// PersistenceDiagramBuilder (parent component)
// ---------------------------------------------------------------------------

export interface PersistenceDiagramBuilderProps {
  /** Optional CSS class on the outer wrapper. */
  className?: string;
}

export function PersistenceDiagramBuilder({ className }: PersistenceDiagramBuilderProps) {
  const [points, setPoints] = useState<Point2D[]>([]);
  const [features, setFeatures] = useState<PersistenceFeature[]>([]);
  const [maxRadius, setMaxRadius] = useState<number>(1);
  const [currentRadius, setCurrentRadius] = useState<number>(0);
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState<number | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>('');
  const [activePreset, setActivePreset] = useState<PresetLabel>(null);

  // Animation refs (Step 2 — wired here so state is available)
  const animFrameRef = useRef<number | null>(null);
  const animStartRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animSpeed, setAnimSpeed] = useState<0.5 | 1 | 2>(1);
  const reducedMotion = useReducedMotion();

  // Debounce ref for AriaLiveRegion
  const ariaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Sync: recompute persistence whenever points change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (points.length < 2) {
      setFeatures([]);
      const mr = 1;
      setMaxRadius(mr);
      setCurrentRadius(0);
      setSelectedFeatureIdx(null);
      return;
    }

    const mr = maxPairwiseDist(points);
    const steps = buildRadiusSteps(mr);
    const computed = computePersistence(points, steps);

    setMaxRadius(mr);
    setFeatures(computed);
    setCurrentRadius(0);
    setSelectedFeatureIdx(null);
  }, [points]);

  // ---------------------------------------------------------------------------
  // Reverse cross-highlight: overlay click (left panel) → select feature (right panel)
  // ---------------------------------------------------------------------------
  const handleOverlayClick = useCallback(
    (vertexIds: string[]) => {
      if (features.length === 0) return;
      const clickedSet = new Set(vertexIds);
      // Find the first born+alive feature whose generator overlaps with the clicked IDs.
      // Prefer an alive feature; fall back to any feature with a matching generator.
      let bestIdx: number | null = null;
      for (let i = 0; i < features.length; i++) {
        const f = features[i];
        if (!f.generator || f.generator.length === 0) continue;
        const overlap = f.generator.some((id) => clickedSet.has(id));
        if (!overlap) continue;
        const alive =
          f.birth <= currentRadius &&
          (f.death === null || f.death > currentRadius);
        if (alive) {
          bestIdx = i;
          break;
        }
        if (bestIdx === null) bestIdx = i;
      }
      setSelectedFeatureIdx((prev) => (prev === bestIdx ? null : bestIdx));
    },
    [features, currentRadius],
  );

  // ---------------------------------------------------------------------------
  // Sync: build complex overlay whenever currentRadius or points change
  // ---------------------------------------------------------------------------
  const complexOverlay: ComplexOverlay | undefined = useMemo(() => {
    if (points.length === 0) return undefined;

    const simplices = buildComplex(points, currentRadius);
    const edges = simplices
      .filter((s) => s.dimension === 1)
      .map((s) => [s.vertices[0], s.vertices[1]] as [string, string]);
    const triangles = simplices
      .filter((s) => s.dimension === 2)
      .map((s) => [s.vertices[0], s.vertices[1], s.vertices[2]] as [string, string, string]);

    // Populate highlightIds from selectedFeature's generator for cross-highlight
    const highlightIds: string[] =
      selectedFeatureIdx !== null && features[selectedFeatureIdx]?.generator
        ? (features[selectedFeatureIdx].generator ?? [])
        : [];

    return { edges, triangles, radius: currentRadius, highlightIds, onOverlayClick: handleOverlayClick };
  }, [points, currentRadius, selectedFeatureIdx, features, handleOverlayClick]);

  // ---------------------------------------------------------------------------
  // Announce filtration state to screen readers (debounced)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (ariaDebounceRef.current) clearTimeout(ariaDebounceRef.current);
    ariaDebounceRef.current = setTimeout(() => {
      const h0Alive = features.filter(
        (f) => f.dimension === 0 && f.birth <= currentRadius && (f.death === null || f.death > currentRadius),
      ).length;
      const h1Alive = features.filter(
        (f) => f.dimension === 1 && f.birth <= currentRadius && (f.death === null || f.death > currentRadius),
      ).length;
      if (features.length > 0 || points.length > 0) {
        setLiveMessage(
          `Radius ${currentRadius.toFixed(2)}: ${h0Alive} component${h0Alive !== 1 ? 's' : ''}, ${h1Alive} loop${h1Alive !== 1 ? 's' : ''}`,
        );
      }
    }, ARIA_DEBOUNCE_MS);

    return () => {
      if (ariaDebounceRef.current) clearTimeout(ariaDebounceRef.current);
    };
  }, [currentRadius, features, points.length]);

  // ---------------------------------------------------------------------------
  // Animation (Step 2 — play/pause sweep from 0 → maxRadius)
  // ---------------------------------------------------------------------------
  const stopAnimation = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    animStartRef.current = null;
    setIsPlaying(false);
  }, []);

  const startAnimation = useCallback(() => {
    if (reducedMotion) return;
    stopAnimation();
    const duration = ANIM_DURATION_MS / animSpeed;

    const animate = (timestamp: number) => {
      if (animStartRef.current === null) animStartRef.current = timestamp;
      const elapsed = timestamp - animStartRef.current;
      const t = Math.min(elapsed / duration, 1);
      setCurrentRadius(t * maxRadius);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        animFrameRef.current = null;
        animStartRef.current = null;
      }
    };

    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(animate);
  }, [reducedMotion, stopAnimation, animSpeed, maxRadius]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  // ---------------------------------------------------------------------------
  // Step-through (Step 2 — advance to next event radius)
  // ---------------------------------------------------------------------------
  const eventRadii: number[] = useMemo(() => {
    const radii = new Set<number>();
    radii.add(0);
    for (const f of features) {
      radii.add(f.birth);
      if (f.death !== null) radii.add(f.death);
    }
    radii.add(maxRadius);
    return Array.from(radii).sort((a, b) => a - b);
  }, [features, maxRadius]);

  const stepTo = useCallback(
    (direction: 'prev' | 'next') => {
      const sorted = eventRadii;
      if (direction === 'next') {
        const next = sorted.find((r) => r > currentRadius + 1e-9);
        if (next !== undefined) setCurrentRadius(next);
      } else {
        const prev = [...sorted].reverse().find((r) => r < currentRadius - 1e-9);
        if (prev !== undefined) setCurrentRadius(prev);
      }
    },
    [eventRadii, currentRadius],
  );

  // ---------------------------------------------------------------------------
  // TextDescriptionToggle description (Step 3 — built dynamically here for wiring)
  // ---------------------------------------------------------------------------
  const textDescription = useMemo(() => {
    const h0Count = features.filter(
      (f) => f.dimension === 0 && f.birth <= currentRadius && (f.death === null || f.death > currentRadius),
    ).length;
    const h1Count = features.filter(
      (f) => f.dimension === 1 && f.birth <= currentRadius && (f.death === null || f.death > currentRadius),
    ).length;
    const totalBorn = features.filter((f) => f.birth <= currentRadius).length;

    let desc =
      `${points.length} point${points.length !== 1 ? 's' : ''} in the cloud. ` +
      `Current filtration radius: ${currentRadius.toFixed(3)}. ` +
      `${totalBorn} feature${totalBorn !== 1 ? 's' : ''} born; ` +
      `${h0Count} active H\u2080 component${h0Count !== 1 ? 's' : ''}, ` +
      `${h1Count} active H\u2081 loop${h1Count !== 1 ? 's' : ''}.`;

    if (activePreset && PRESET_NOTES[activePreset]) {
      desc += ` Educational note: ${PRESET_NOTES[activePreset]}`;
    }
    return desc;
  }, [points.length, currentRadius, features, activePreset]);

  // ---------------------------------------------------------------------------
  // Track active preset key for educational annotations
  // ---------------------------------------------------------------------------
  // We intercept preset selection by listening to the points — a simpler
  // approach is to provide an onPresetSelect callback to PointCloudEditor.
  // For now we detect known preset sizes/patterns by listening via a wrapper.
  // The activePreset state is set by PDBPointCloudEditorWrapper below.

  const handlePresetSelect = useCallback((label: PresetLabel) => {
    setActivePreset(label);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={`pdb-wrapper${className ? ` ${className}` : ''}`}>
      <TextDescriptionToggle description={textDescription}>
        <div className="pdb-panels">
          {/* Left panel: editable point cloud */}
          <div className="pdb-panel pdb-panel--left">
            <h3 className="pdb-panel-label">Point Cloud</h3>
            <PDBPointCloudEditorWrapper
              onPointsChange={setPoints}
              complexOverlay={complexOverlay}
              onPresetSelect={handlePresetSelect}
            />
          </div>

          {/* Right panel: persistence diagram */}
          <div className="pdb-panel pdb-panel--right">
            <h3 className="pdb-panel-label">Persistence Diagram</h3>
            <div className="pdb-diagram-wrapper" style={{ height: DIAGRAM_HEIGHT }}>
              <ResponsiveContainer minHeight={DIAGRAM_HEIGHT}>
                {({ width, height }) => (
                  <PersistenceDiagram
                    features={features}
                    maxRadius={maxRadius}
                    currentRadius={currentRadius}
                    selectedFeatureIdx={selectedFeatureIdx}
                    onFeatureSelect={setSelectedFeatureIdx}
                    activePreset={activePreset}
                    width={width}
                    height={height}
                  />
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="pdb-controls" aria-label="Filtration controls">
          {/* Filtration slider */}
          <div className="pdb-slider-row">
            <label htmlFor="pdb-slider" className="pdb-control-label">
              Radius
            </label>
            <input
              id="pdb-slider"
              type="range"
              className="pdb-slider"
              min={0}
              max={maxRadius}
              step={maxRadius / (RADIUS_STEPS - 1)}
              value={currentRadius}
              onChange={(e) => {
                stopAnimation();
                setCurrentRadius(parseFloat(e.target.value));
              }}
              aria-label="Filtration radius"
              aria-valuetext={`Radius ${currentRadius.toFixed(3)} of ${maxRadius.toFixed(3)}`}
            />
            <span className="pdb-radius-value" aria-hidden="true">
              {currentRadius.toFixed(3)}
            </span>
          </div>

          {/* Animation controls — hidden when reducedMotion */}
          {!reducedMotion && (
            <div className="pdb-anim-row">
              <button
                className="pdb-btn"
                type="button"
                onClick={isPlaying ? stopAnimation : startAnimation}
                disabled={points.length < 2}
                aria-label={isPlaying ? 'Pause filtration animation' : 'Play filtration animation'}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <button
                className="pdb-btn"
                type="button"
                onClick={() => stepTo('prev')}
                disabled={points.length < 2 || currentRadius <= 0}
                aria-label="Step to previous event radius"
              >
                ◀ Prev
              </button>

              <button
                className="pdb-btn"
                type="button"
                onClick={() => stepTo('next')}
                disabled={points.length < 2 || currentRadius >= maxRadius}
                aria-label="Step to next event radius"
              >
                Next ▶
              </button>

              <label className="pdb-control-label" htmlFor="pdb-speed">
                Speed
              </label>
              <select
                id="pdb-speed"
                className="pdb-select"
                value={animSpeed}
                onChange={(e) => setAnimSpeed(parseFloat(e.target.value) as 0.5 | 1 | 2)}
                aria-label="Animation speed"
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </div>
          )}
        </div>
      </TextDescriptionToggle>

      <AriaLiveRegion message={liveMessage} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDBPointCloudEditorWrapper
// Intercepts preset button clicks to track the active preset label.
// ---------------------------------------------------------------------------

interface PDBPCEWrapperProps {
  onPointsChange: (pts: Point2D[]) => void;
  complexOverlay: ComplexOverlay | undefined;
  onPresetSelect: (label: PresetLabel) => void;
}

// Preset labels used in PDBPointCloudEditorWrapper intercept logic.
// Declared at module scope so the ESLint exhaustive-deps rule does not flag it
// as a missing useEffect dependency (module-level constants are non-reactive).
const WRAPPER_PRESET_LABELS: PresetLabel[] = [
  'Circle (8 pts)',
  'Two Clusters (8 pts)',
  'Figure-8 (11 pts)',
  'Random (15 pts)',
];

function PDBPointCloudEditorWrapper({
  onPointsChange,
  complexOverlay,
  onPresetSelect,
}: PDBPCEWrapperProps) {
  // PointCloudEditor doesn't expose a preset change callback, so we wrap it
  // and intercept clicks via a capture listener on the toolbar buttons.
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('pce-preset-btn')) {
        const label = target.textContent?.trim() as PresetLabel;
        if (WRAPPER_PRESET_LABELS.includes(label)) {
          onPresetSelect(label);
        }
      }
      // Clear button resets preset
      if (target.classList.contains('pce-clear-btn')) {
        onPresetSelect(null);
      }
    };

    el.addEventListener('click', handleClick, true);
    return () => el.removeEventListener('click', handleClick, true);
  }, [onPresetSelect]);

  return (
    <div ref={wrapperRef}>
      <PointCloudEditor
        onPointsChange={onPointsChange}
        complexOverlay={complexOverlay}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PersistenceDiagram — right panel SVG
// ---------------------------------------------------------------------------

interface PersistenceDiagramProps {
  features: PersistenceFeature[];
  maxRadius: number;
  currentRadius: number;
  selectedFeatureIdx: number | null;
  onFeatureSelect: (idx: number | null) => void;
  activePreset: PresetLabel;
  width: number;
  height: number;
}

const H0_COLOR = 'var(--color-tda-teal, #2a7d8f)';
const H1_COLOR = 'var(--color-tda-slate, #3a5a8c)';

function PersistenceDiagram({
  features,
  maxRadius,
  currentRadius,
  selectedFeatureIdx,
  onFeatureSelect,
  activePreset,
  width,
  height,
}: PersistenceDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);

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

  // D3 scales
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const xScale = d3.scaleLinear([0, maxRadius], [0, plotWidth]);
  const yScale = d3.scaleLinear([0, maxRadius], [plotHeight, 0]); // inverted Y

  // Axis ticks
  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  // Map death=null to maxRadius (top of chart)
  const plotDeath = (f: PersistenceFeature) => (f.death === null ? maxRadius : f.death);

  // Feature visibility relative to currentRadius
  const featureState = (f: PersistenceFeature) => {
    const dv = plotDeath(f);
    if (f.birth > currentRadius) return 'unborn';
    if (dv !== null && dv <= currentRadius) return 'dead';
    return 'alive';
  };

  // Two Clusters annotation — shown when activePreset is 'Two Clusters (8 pts)'
  const showTwoClustersNote = activePreset === 'Two Clusters (8 pts)';

  return (
    <svg
      ref={svgRef}
      className="pdb-diagram-svg"
      width={width}
      height={height}
      role="img"
      aria-label={`Persistence diagram with ${features.length} features`}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* ── Diagonal reference line (birth = death — "noise" line) ── */}
        <line
          className="pdb-diag-line"
          x1={xScale(0)}
          y1={yScale(0)}
          x2={xScale(maxRadius)}
          y2={yScale(maxRadius)}
          aria-hidden="true"
        />

        {/* ── Current radius horizontal guideline ── */}
        {currentRadius > 0 && (
          <line
            className="pdb-radius-line"
            x1={xScale(currentRadius)}
            y1={yScale(0)}
            x2={xScale(currentRadius)}
            y2={yScale(maxRadius)}
            aria-hidden="true"
          />
        )}

        {/* ── X axis ── */}
        <g transform={`translate(0,${plotHeight})`} aria-hidden="true">
          <line className="pdb-axis-line" x1={0} y1={0} x2={plotWidth} y2={0} />
          {xTicks.map((t) => (
            <g key={`xt-${t}`} transform={`translate(${xScale(t)},0)`}>
              <line className="pdb-axis-tick" x1={0} y1={0} x2={0} y2={5} />
              <text className="pdb-axis-label" y={16} textAnchor="middle">
                {t.toFixed(2)}
              </text>
            </g>
          ))}
          <text
            className="pdb-axis-title"
            x={plotWidth / 2}
            y={38}
            textAnchor="middle"
          >
            Birth (radius)
          </text>
        </g>

        {/* ── Y axis ── */}
        <g aria-hidden="true">
          <line className="pdb-axis-line" x1={0} y1={0} x2={0} y2={plotHeight} />
          {yTicks.map((t) => (
            <g key={`yt-${t}`} transform={`translate(0,${yScale(t)})`}>
              <line className="pdb-axis-tick" x1={-5} y1={0} x2={0} y2={0} />
              <text className="pdb-axis-label" x={-8} textAnchor="end" dominantBaseline="middle">
                {t.toFixed(2)}
              </text>
            </g>
          ))}
          <text
            className="pdb-axis-title"
            transform={`translate(-38,${plotHeight / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            Death (radius)
          </text>
        </g>

        {/* ── "immortal" label at top edge ── */}
        <text
          className="pdb-immortal-label"
          x={plotWidth - 4}
          y={4}
          textAnchor="end"
          aria-hidden="true"
        >
          ∞
        </text>

        {/* ── Feature points ── */}
        {features.map((f, idx) => {
          const state = featureState(f);
          const cx = xScale(f.birth);
          const cy = yScale(plotDeath(f));
          const fill = f.dimension === 0 ? H0_COLOR : H1_COLOR;
          const isSelected = idx === selectedFeatureIdx;

          const stateClass =
            state === 'alive'
              ? 'pdb-feature--alive'
              : state === 'dead'
                ? 'pdb-feature--dead'
                : 'pdb-feature--unborn';

          return (
            <circle
              key={`feat-${idx}`}
              className={`pdb-feature ${stateClass}${isSelected ? ' pdb-feature--selected' : ''}${f.death === null ? ' pdb-feature--immortal' : ''}`}
              cx={cx}
              cy={cy}
              r={isSelected ? 8 : 6}
              fill={fill}
              role="button"
              tabIndex={0}
              aria-label={`H${f.dimension} feature: birth ${f.birth.toFixed(3)}, death ${f.death === null ? '∞' : f.death.toFixed(3)}. ${state}.`}
              onClick={() => onFeatureSelect(idx === selectedFeatureIdx ? null : idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onFeatureSelect(idx === selectedFeatureIdx ? null : idx);
                }
              }}
              onPointerEnter={(e) => {
                if (!tooltipRef.current) return;
                const dimLabel = `H${f.dimension}`;
                const deathLabel = f.death === null ? '∞' : f.death.toFixed(3);
                const genLabel =
                  f.generator && f.generator.length > 0
                    ? ` · generator: [${f.generator.join(', ')}]`
                    : '';
                const persistence =
                  f.death === null
                    ? '∞'
                    : (f.death - f.birth).toFixed(3);
                showTooltip(
                  tooltipRef.current,
                  e.nativeEvent,
                  `${dimLabel} · birth ${f.birth.toFixed(3)} · death ${deathLabel} · persistence ${persistence}${genLabel}`,
                );
              }}
              onPointerLeave={() => {
                if (tooltipRef.current) hideTooltip(tooltipRef.current);
              }}
            />
          );
        })}

        {/* ── Legend ── */}
        <g
          transform={`translate(${plotWidth - 110},${plotHeight - 46})`}
          aria-hidden="true"
        >
          <rect
            className="pdb-legend-bg"
            x={-6}
            y={-6}
            width={116}
            height={56}
            rx={4}
          />
          <circle cx={8} cy={8} r={5} fill={H0_COLOR} />
          <text className="pdb-legend-text" x={18} y={12}>
            H₀ (components)
          </text>
          <circle cx={8} cy={28} r={5} fill={H1_COLOR} />
          <text className="pdb-legend-text" x={18} y={32}>
            H₁ (loops)
          </text>
          <circle cx={8} cy={46} r={5} fill={H0_COLOR} className="pdb-feature--immortal" />
          <text className="pdb-legend-text" x={18} y={50}>
            ∞ = immortal
          </text>
        </g>

        {/* ── Two Clusters educational note ── */}
        {showTwoClustersNote && (
          <g
            className="pdb-annotation"
            transform={`translate(4,${plotHeight - 14})`}
            aria-hidden="true"
          >
            <text className="pdb-annotation-text" x={0} y={0}>
              H₀ long bars = two-cluster signature · H₁ loop reflects 4-pt square geometry
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
