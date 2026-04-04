/**
 * PointCloudEditor.tsx — Task 3.7a — Agent_Interactive_Core
 *
 * Standalone, composable point cloud editor island.
 * Left panel for the Persistence Diagram Builder (Task 3.7b will compose this
 * with the diagram panel). Exports the current Point2D[] via onPointsChange.
 *
 * Interactions:
 *   - Click canvas → place point (max 30)
 *   - Drag point → reposition (D3 drag)
 *   - Double-click point → remove
 *   - Clear button → reset all
 *   - Preset buttons → load known configurations
 *
 * Uses Task 3.1 shared infrastructure:
 *   - ResponsiveContainer for responsive sizing
 *   - getPaletteColor / getVizColorScale from scales.ts (colour tokens)
 *   - createTooltip / showTooltip / hideTooltip / destroyTooltip (point hover)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { createTooltip, showTooltip, hideTooltip, destroyTooltip } from '@lib/viz/tooltip';
import type { TooltipHandle } from '@lib/viz/tooltip';
import type { Point2D } from '@lib/tda/vietorisRips';

import './PointCloudEditor.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_POINTS = 30;
const CANVAS_HEIGHT = 380;
const POINT_RADIUS = 6;
/** Grid line count per axis (divides canvas into GRID_DIVISIONS sections). */
const GRID_DIVISIONS = 8;

// ---------------------------------------------------------------------------
// Preset configurations
// ---------------------------------------------------------------------------

function circlePreset(n: number, cx = 0.5, cy = 0.5, r = 0.38): Point2D[] {
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n),
    y: cy + r * Math.sin((2 * Math.PI * i) / n),
    id: `circle-${i}`,
  }));
}

function twoClustersPreset(): Point2D[] {
  const offsets = [
    [0, 0], [0.06, 0], [0, 0.06], [0.06, 0.06],
  ];
  const clusterA = offsets.map(([dx, dy], i) => ({
    x: 0.2 + dx, y: 0.5 + dy, id: `ca-${i}`,
  }));
  const clusterB = offsets.map(([dx, dy], i) => ({
    x: 0.74 + dx, y: 0.5 + dy, id: `cb-${i}`,
  }));
  return [...clusterA, ...clusterB];
}

function figure8Preset(): Point2D[] {
  const sharedPt: Point2D = { x: 0.5, y: 0.5, id: 'f8-shared' };
  const n = 5;
  const rr = 0.18;

  const left = Array.from({ length: n }, (_, i) => {
    const a = Math.PI + (2 * Math.PI * (i + 1)) / (n + 1);
    return {
      x: 0.5 - rr * 1.5 + rr * Math.cos(a),
      y: 0.5 + rr * Math.sin(a),
      id: `f8-l${i}`,
    };
  });
  const right = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * (i + 1)) / (n + 1);
    return {
      x: 0.5 + rr * 1.5 + rr * Math.cos(a),
      y: 0.5 + rr * Math.sin(a),
      id: `f8-r${i}`,
    };
  });
  return [sharedPt, ...left, ...right];
}

function randomPreset(n = 15): Point2D[] {
  // Deterministic LCG for consistent previews — not cryptographic, just visual.
  return Array.from({ length: n }, (_, i) => {
    const s1 = (1103515245 * (i * 17 + 7) + 12345) & 0x7fffffff;
    const s2 = (1103515245 * (s1 + 99) + 12345) & 0x7fffffff;
    return {
      x: 0.05 + ((s1 % 900) / 1000),
      y: 0.05 + ((s2 % 900) / 1000),
      id: `rnd-${i}`,
    };
  });
}

const PRESETS: Array<{ label: string; points: () => Point2D[] }> = [
  { label: 'Circle (8 pts)', points: () => circlePreset(8) },
  { label: 'Two Clusters (8 pts)', points: twoClustersPreset },
  { label: 'Figure-8 (11 pts)', points: figure8Preset },
  { label: 'Random (15 pts)', points: () => randomPreset(15) },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Complex overlay data for rendering the simplicial complex at a given radius. */
export interface ComplexOverlay {
  /** 1-simplex vertex ID pairs to render as edges. */
  edges: [string, string][];
  /** 2-simplex vertex ID triples to render as filled triangles. */
  triangles: [string, string, string][];
  /** Filtration radius in normalised (0–1) coordinate units. */
  radius: number;
  /** Optional point IDs whose generator edges/cycles should be highlighted (cross-highlighting). */
  highlightIds?: string[];
  /** Called when the user clicks an overlay edge or triangle; receives the vertex IDs of the clicked simplex. */
  onOverlayClick?: (vertexIds: string[]) => void;
}

export interface PointCloudEditorProps {
  /** Called whenever the point array changes. Used by Task 3.7b to feed the algorithm. */
  onPointsChange?: (points: Point2D[]) => void;
  /** Optional initial points to pre-populate the canvas. */
  initialPoints?: Point2D[];
  /** Optional extra CSS class on the wrapper. */
  className?: string;
  /** Simplicial complex overlay at the current filtration radius. */
  complexOverlay?: ComplexOverlay;
  /** Maximum number of points allowed on the canvas. Defaults to 30. */
  maxPoints?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PointCloudEditor({
  onPointsChange,
  initialPoints,
  className,
  complexOverlay,
  maxPoints = MAX_POINTS,
}: PointCloudEditorProps) {
  const [points, setPoints] = useState<Point2D[]>(initialPoints ?? []);

  // Notify parent on every change.
  const onPointsChangeRef = useRef(onPointsChange);
  onPointsChangeRef.current = onPointsChange;

  useEffect(() => {
    onPointsChangeRef.current?.(points);
  }, [points]);

  // Counter string helper.
  const isFull = points.length >= maxPoints;

  const handleClear = useCallback(() => {
    setPoints([]);
  }, []);

  const handlePreset = useCallback((presetFn: () => Point2D[]) => {
    setPoints(presetFn());
  }, []);

  return (
    <div className={`pce-wrapper${className ? ` ${className}` : ''}`}>
      {/* ── Toolbar ── */}
      <div className="pce-toolbar" role="toolbar" aria-label="Point cloud controls">
        <span className="pce-toolbar__label">Presets:</span>

        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="pce-preset-btn"
            onClick={() => handlePreset(preset.points)}
            type="button"
          >
            {preset.label}
          </button>
        ))}

        <span className="pce-toolbar__spacer" />

        <span
          className={`pce-counter${isFull ? ' pce-counter--full' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {points.length}/{maxPoints} points
        </span>

        <button
          className="pce-clear-btn"
          onClick={handleClear}
          disabled={points.length === 0}
          type="button"
          aria-label="Clear all points"
        >
          Clear
        </button>
      </div>

      {/* ── Canvas ── */}
      <div
        className="pce-canvas-wrapper"
        style={{ height: CANVAS_HEIGHT }}
        aria-label="Point cloud canvas. Click to add points, drag to move, double-click to remove."
      >
        <ResponsiveContainer minHeight={CANVAS_HEIGHT}>
          {({ width, height }) => (
            <PointCloudCanvas
              width={width}
              height={height}
              points={points}
              setPoints={setPoints}
              complexOverlay={complexOverlay}
              onOverlayClick={complexOverlay?.onOverlayClick}
              maxPoints={maxPoints}
            />
          )}
        </ResponsiveContainer>
      </div>

      {/* ── Hint ── */}
      <p className="pce-hint" aria-hidden="true">
        Click to add · Drag to move · Double-click to remove
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner SVG canvas — receives measured dimensions from ResponsiveContainer
// ---------------------------------------------------------------------------

interface CanvasProps {
  width: number;
  height: number;
  points: Point2D[];
  setPoints: React.Dispatch<React.SetStateAction<Point2D[]>>;
  complexOverlay?: ComplexOverlay;
  /** Propagated from complexOverlay.onOverlayClick — hoisted to avoid stale-closure issues. */
  onOverlayClick?: (vertexIds: string[]) => void;
  /** Maximum number of points allowed. */
  maxPoints: number;
}

function PointCloudCanvas({ width, height, points, setPoints, complexOverlay, onOverlayClick, maxPoints }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);
  // Track which point is currently being dragged (by id).
  const draggingId = useRef<string | null>(null);

  // Normalised (0–1) coordinates → pixel coordinates.
  const toPixel = useCallback(
    (nx: number, ny: number) => ({
      px: nx * width,
      py: ny * height,
    }),
    [width, height],
  );

  // Pixel → normalised.
  const toNorm = useCallback(
    (px: number, py: number) => ({
      nx: Math.max(0, Math.min(1, px / width)),
      ny: Math.max(0, Math.min(1, py / height)),
    }),
    [width, height],
  );

  // ── Tooltip lifecycle ──
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

  // ── D3 drag behaviour (attached once; reads/writes via refs to avoid stale closures) ──
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const drag = d3
      .drag<SVGCircleElement, unknown>()
      .on('start', function () {
        const el = d3.select(this);
        const id = el.attr('data-id');
        draggingId.current = id;
        el.classed('pce-point--dragging', true);
        if (tooltipRef.current) hideTooltip(tooltipRef.current);
      })
      .on('drag', function (event: d3.D3DragEvent<SVGCircleElement, unknown, unknown>) {
        const id = draggingId.current;
        if (!id) return;
        const { nx, ny } = toNorm(event.x, event.y);
        setPoints((prev) =>
          prev.map((p) => (p.id === id ? { ...p, x: nx, y: ny } : p)),
        );
      })
      .on('end', function () {
        d3.select(this).classed('pce-point--dragging', false);
        draggingId.current = null;
      });

    // Apply drag to all existing point circles.
    d3.select(svg).selectAll<SVGCircleElement, unknown>('circle.pce-point').call(drag);

    // Cleanup: remove drag listeners when effect re-runs.
    return () => {
      d3.select(svg)
        .selectAll<SVGCircleElement, unknown>('circle.pce-point')
        .on('.drag', null);
    };
  }, [points, toNorm, setPoints]);

  // ── Click handler on SVG background (place new point) ──
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Ignore if the click target is a point circle (drag/dblclick handles those).
      if ((e.target as SVGElement).tagName === 'circle') return;
      if (pointsRef.current.length >= maxPoints) return;

      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const { nx, ny } = toNorm(px, py);

      setPoints((prev) => [
        ...prev,
        { x: nx, y: ny, id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ]);
    },
    [toNorm, setPoints, maxPoints],
  );
  const handlePointDblClick = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, id: string) => {
      e.stopPropagation();
      setPoints((prev) => prev.filter((p) => p.id !== id));
    },
    [setPoints],
  );

  // ── Pointer enter/leave for tooltip ──
  const handlePointEnter = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, p: Point2D) => {
      if (!tooltipRef.current) return;
      showTooltip(
        tooltipRef.current,
        e.nativeEvent,
        `(${p.x.toFixed(3)}, ${p.y.toFixed(3)})`,
      );
    },
    [],
  );

  const handlePointLeave = useCallback(() => {
    if (tooltipRef.current) hideTooltip(tooltipRef.current);
  }, []);

  // ── Grid lines ──
  const gridLines: React.ReactNode[] = [];
  for (let i = 1; i < GRID_DIVISIONS; i++) {
    const xPos = (i / GRID_DIVISIONS) * width;
    const yPos = (i / GRID_DIVISIONS) * height;
    gridLines.push(
      <line
        key={`gx-${i}`}
        className="pce-grid-line"
        x1={xPos}
        y1={0}
        x2={xPos}
        y2={height}
      />,
      <line
        key={`gy-${i}`}
        className="pce-grid-line"
        x1={0}
        y1={yPos}
        x2={width}
        y2={yPos}
      />,
    );
  }

  // ── Complex overlay rendering helpers ──
  const overlayNodes: React.ReactNode = complexOverlay ? (() => {
    const idToPoint = new Map(points.map((p) => [p.id, p]));
    const highlightSet = new Set(complexOverlay.highlightIds ?? []);

    const triangleEls = complexOverlay.triangles.map(([a, b, c], i) => {
      const pa = idToPoint.get(a);
      const pb = idToPoint.get(b);
      const pc = idToPoint.get(c);
      if (!pa || !pb || !pc) return null;
      const isHighlighted =
        highlightSet.has(a) || highlightSet.has(b) || highlightSet.has(c);
      return (
        <polygon
          key={`tri-${i}`}
          className={`pce-overlay-triangle${isHighlighted ? ' pce-overlay-triangle--hl' : ''}${onOverlayClick ? ' pce-overlay-clickable' : ''}`}
          points={`${pa.x * width},${pa.y * height} ${pb.x * width},${pb.y * height} ${pc.x * width},${pc.y * height}`}
          onClick={onOverlayClick ? (e) => { e.stopPropagation(); onOverlayClick([a, b, c]); } : undefined}
        />
      );
    });

    const edgeEls = complexOverlay.edges.map(([a, b], i) => {
      const pa = idToPoint.get(a);
      const pb = idToPoint.get(b);
      if (!pa || !pb) return null;
      const isHighlighted = highlightSet.has(a) || highlightSet.has(b);
      return (
        <line
          key={`edge-${i}`}
          className={`pce-overlay-edge${isHighlighted ? ' pce-overlay-edge--hl' : ''}${onOverlayClick ? ' pce-overlay-clickable' : ''}`}
          x1={pa.x * width}
          y1={pa.y * height}
          x2={pb.x * width}
          y2={pb.y * height}
          onClick={onOverlayClick ? (e) => { e.stopPropagation(); onOverlayClick([a, b]); } : undefined}
        />
      );
    });

    const ballEls = points.map((p) => (
      <ellipse
        key={`ball-${p.id}`}
        className="pce-overlay-ball"
        cx={p.x * width}
        cy={p.y * height}
        rx={complexOverlay.radius * width}
        ry={complexOverlay.radius * height}
      />
    ));

    return (
      <g className="pce-overlay" aria-hidden="true">
        {triangleEls}
        {edgeEls}
        {ballEls}
      </g>
    );
  })() : null;

  return (
    <svg
      ref={svgRef}
      className="pce-svg"
      width={width}
      height={height}
      onClick={handleSvgClick}
      role="img"
      aria-label={`Point cloud canvas with ${points.length} points`}
    >
      {/* Grid */}
      <g aria-hidden="true">{gridLines}</g>

      {/* Complex overlay (behind points) */}
      {overlayNodes}

      {/* Points */}
      <g>
        {points.map((p) => {
          const { px, py } = toPixel(p.x, p.y);
          return (
            <circle
              key={p.id}
              data-id={p.id}
              className="pce-point"
              cx={px}
              cy={py}
              r={POINT_RADIUS}
              onDoubleClick={(e) => handlePointDblClick(e, p.id)}
              onPointerEnter={(e) => handlePointEnter(e, p)}
              onPointerLeave={handlePointLeave}
              role="button"
              aria-label={`Point at ${p.x.toFixed(2)}, ${p.y.toFixed(2)}. Double-click to remove.`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  setPoints((prev) => prev.filter((pt) => pt.id !== p.id));
                }
              }}
            />
          );
        })}
      </g>

      {/* Empty state hint */}
      {points.length === 0 && (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-neutral-muted, #9ca3af)"
          fontFamily="var(--font-ui, system-ui, sans-serif)"
          fontSize={14}
          aria-hidden="true"
        >
          Click to place points
        </text>
      )}
    </svg>
  );
}
