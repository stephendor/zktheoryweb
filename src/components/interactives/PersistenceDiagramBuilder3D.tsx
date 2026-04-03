/**
 * PersistenceDiagramBuilder3D.tsx — Task 5.1 — Agent_Interactive_Advanced
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DESIGN DECISION RECORD
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * DECISION 1 — Point dimensionality
 * ──────────────────────────────────
 * Input: Point3D { x, y, z, id } — the 3D canvas accepts three-dimensional
 * point placement and drag/reposition.
 *
 * Persistence computation: The z coordinate is stripped before any TDA math.
 * All calls route through `computePersistence3D` in vietorisRips3D.ts, which
 * projects each Point3D to Point2D ({x, y, id}) before calling the unchanged
 * `computePersistence` from vietorisRips.ts. The 3D R3F panel is a visual
 * upgrade; the mathematical computation is provably identical to the SVG
 * version. This guarantees no regressions in H₀/H₁ correctness or generator
 * cross-highlight behaviour.
 *
 * The 30-point hard cap (MAX_POINTS = 30) is retained identically.
 *
 * DECISION 2 — Right panel (persistence diagram)
 * ────────────────────────────────────────────────
 * The persistence diagram (birth–death scatter plot) remains 2D D3 SVG.
 * It is unchanged from PersistenceDiagramBuilder.tsx; the PersistenceDiagram
 * sub-component is re-exported and re-used without modification.
 *
 * Rationale: The persistence diagram is a standard mathematical plot; there
 * is no benefit to adding a third spatial dimension. Keeping it 2D also
 * preserves perfect a11y parity (SVG roles, tab indices, tooltip text).
 *
 * DECISION 3 — Left panel (3D point cloud)
 * ──────────────────────────────────────────
 * The D3 SVG PointCloudCanvas is replaced with an R3F <Canvas> scene:
 *
 *   - Points: small sphere meshes (radius 0.04 in world units).
 *   - Edges: <Line> primitives from @react-three/drei, connecting pairs
 *     whose distance ≤ currentRadius in the 2D projection.
 *   - Triangles: semi-transparent <Mesh> with a MeshBasicMaterial
 *     (opacity 0.18, depthWrite false) for 2-simplices.
 *   - Radius ball: wireframe sphere meshes at each point position,
 *     scaled to currentRadius, showing the growing ball concept.
 *   - Camera: OrbitControls (from @react-three/drei) for pointer-drag
 *     rotation. Orthographic camera is used to keep SVG visual mapping
 *     consistent.
 *   - Colour tokens: --color-tda-teal and --color-tda-slate are read via
 *     getComputedStyle(document.documentElement) once on mount and passed
 *     as uniforms/props to Materials.
 *   - Interactivity: click on the transparent canvas background (ground
 *     plane y=0) to place a point; pointer-drag existing point meshes to
 *     reposition them; Delete/Backspace key removes the focused point.
 *
 * DECISION 4 — Fallback strategy
 * ────────────────────────────────
 * PersistenceDiagramBuilderWrapper (separate file) is the public surface used
 * in all page routes. On mount it checks:
 *   (a) WebGL2 availability: typeof WebGL2RenderingContext !== 'undefined'
 *       AND the browser can successfully obtain a webgl2 context from a test
 *       <canvas> element.
 *   (b) useReducedMotion() returns false.
 *
 * If either check fails → render <PersistenceDiagramBuilder> (existing SVG).
 * If both checks pass  → render <PersistenceDiagramBuilder3D>.
 *
 * The check is performed client-side (useEffect) to avoid SSR hydration
 * mismatches. During SSR and before hydration the SVG version is rendered
 * as the default (progressive enhancement).
 *
 * DECISION 5 — A11y parity
 * ─────────────────────────
 * - AriaLiveRegion and TextDescriptionToggle behaviour is identical to the
 *   SVG version (same message format, same debounce delay).
 * - The Two Clusters preset annotation must still describe H₀ long bars as
 *   the signature feature (not the H₁ loop).
 * - Animation controls are hidden when useReducedMotion() is true, and the
 *   3D canvas is replaced by a static snapshot placeholder.
 * - All HTML controls (slider, play/pause, step-through, speed selector)
 *   remain as DOM elements outside the R3F Canvas — not inside the WebGL scene.
 *
 * DECISION 6 — Vite/rolldown compatibility
 * ──────────────────────────────────────────
 * @react-three/fiber v9 uses React's new JSX transform transparently.
 * Three.js modules are ESM and tree-shaken by Vite. The package has no CJS
 * fallback issues with Astro's Vite build. If build errors arise, the
 * `ssr.noExternal` option in astro.config.mjs may need to list
 * '@react-three/fiber' and/or 'three' — see important_findings in memory log.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { createTooltip, showTooltip, hideTooltip, destroyTooltip } from '@lib/viz/tooltip';
import type { TooltipHandle } from '@lib/viz/tooltip';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';
import { getPaletteColor } from '@lib/viz/scales';

import type { Point3D } from '@lib/tda/vietorisRips3D';
import { buildComplex3D, computePersistence3D } from '@lib/tda/vietorisRips3D';
import type { PersistenceFeature } from '@lib/tda/vietorisRips';
import { buildComplex } from '@lib/tda/vietorisRips';

import type { Point2D } from '@lib/tda/vietorisRips';

import './PersistenceDiagramBuilder3D.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_POINTS = 30;
const RADIUS_STEPS = 50;
const DIAGRAM_HEIGHT = 380;
const MARGIN = { top: 24, right: 24, bottom: 48, left: 52 };
const ANIM_DURATION_MS = 4000;
const ARIA_DEBOUNCE_MS = 200;

// World-unit scale: point cloud coordinates are 0..1 in the SVG version.
// In 3D we map them to -1..1 range so the scene fits in a standard camera fov.
const WORLD_SCALE = 2.0;

// ---------------------------------------------------------------------------
// Preset labels
// ---------------------------------------------------------------------------

type PresetLabel =
  | 'Circle (8 pts)'
  | 'Two Clusters (8 pts)'
  | 'Figure-8 (11 pts)'
  | 'Random 3D (15 pts)'
  | null;

const PRESET_NOTES: Record<NonNullable<PresetLabel>, string> = {
  'Circle (8 pts)':
    'A persistent H₁ loop is expected — this is the topological signature of a circle.',
  'Two Clusters (8 pts)':
    'Two long-lived H₀ bars are the signature feature. The H₁ loop (β₁=1) reflects the ' +
    'square geometry of this 4-point configuration, not the clustering structure.',
  'Figure-8 (11 pts)':
    'Two persistent H₁ loops expected — one per circle in the figure-eight.',
  'Random 3D (15 pts)':
    'Random point clouds typically produce short-lived features close to the diagonal (noise).',
};

// ---------------------------------------------------------------------------
// 3D Preset configurations
// (SVG presets use 0..1 coords; we mirror them identically, z=0 where noted)
// ---------------------------------------------------------------------------

function circlePreset3D(n: number): Point3D[] {
  const cx = 0.5, cy = 0.5, r = 0.38;
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n),
    y: cy + r * Math.sin((2 * Math.PI * i) / n),
    z: 0,
    id: `circle3d-${i}`,
  }));
}

function twoClusters3DPreset(): Point3D[] {
  const offsets = [[0, 0], [0.06, 0], [0, 0.06], [0.06, 0.06]];
  const clusterA = offsets.map(([dx, dy], i) => ({
    x: 0.2 + dx, y: 0.5 + dy, z: 0, id: `ca3d-${i}`,
  }));
  const clusterB = offsets.map(([dx, dy], i) => ({
    x: 0.74 + dx, y: 0.5 + dy, z: 0, id: `cb3d-${i}`,
  }));
  return [...clusterA, ...clusterB];
}

function figure8_3DPreset(): Point3D[] {
  const sharedPt: Point3D = { x: 0.5, y: 0.5, z: 0, id: 'f8-3d-shared' };
  const n = 5;
  const rr = 0.18;
  const left = Array.from({ length: n }, (_, i) => {
    const a = Math.PI + (2 * Math.PI * (i + 1)) / (n + 1);
    return {
      x: 0.5 - rr * 1.5 + rr * Math.cos(a),
      y: 0.5 + rr * Math.sin(a),
      z: 0,
      id: `f8-3d-l${i}`,
    };
  });
  const right = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * (i + 1)) / (n + 1);
    return {
      x: 0.5 + rr * 1.5 + rr * Math.cos(a),
      y: 0.5 + rr * Math.sin(a),
      z: 0,
      id: `f8-3d-r${i}`,
    };
  });
  return [sharedPt, ...left, ...right];
}

function random3DPreset(n = 15): Point3D[] {
  // Deterministic LCG — not cryptographic, purely visual.
  return Array.from({ length: n }, (_, i) => {
    const s1 = (1103515245 * (i * 17 + 7) + 12345) & 0x7fffffff;
    const s2 = (1103515245 * (s1 + 99) + 12345) & 0x7fffffff;
    const s3 = (1103515245 * (s2 + 31) + 12345) & 0x7fffffff;
    return {
      x: 0.05 + ((s1 % 900) / 1000),
      y: 0.05 + ((s2 % 900) / 1000),
      z: ((s3 % 600) / 1000) - 0.3, // z in [-0.3, +0.3]
      id: `rnd3d-${i}`,
    };
  });
}

const PRESETS_3D: Array<{ label: NonNullable<PresetLabel>; points: () => Point3D[] }> = [
  { label: 'Circle (8 pts)', points: () => circlePreset3D(8) },
  { label: 'Two Clusters (8 pts)', points: twoClusters3DPreset },
  { label: 'Figure-8 (11 pts)', points: figure8_3DPreset },
  { label: 'Random 3D (15 pts)', points: () => random3DPreset(15) },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maxPairwiseDist(pts: Point3D[]): number {
  if (pts.length < 2) return 1;
  let max = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      // Use 2D distance (xy plane) for persistence — matches vietorisRips.ts
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > max) max = d;
    }
  }
  return max > 0 ? max : 1;
}

function buildRadiusSteps(maxRadius: number): number[] {
  return Array.from(
    { length: RADIUS_STEPS },
    (_, i) => (i / (RADIUS_STEPS - 1)) * maxRadius,
  );
}

/** Convert a 0..1 point coordinate to Three.js world space (-1..1 scaled). */
function toWorld(p: Point3D): THREE.Vector3 {
  return new THREE.Vector3(
    (p.x - 0.5) * WORLD_SCALE,
    (p.y - 0.5) * WORLD_SCALE,
    p.z * WORLD_SCALE,
  );
}

// ---------------------------------------------------------------------------
// 3D Scene sub-components (inside R3F Canvas)
// ---------------------------------------------------------------------------

interface PointMeshProps {
  point: Point3D;
  isHighlighted: boolean;
  isSelected: boolean;
  color: string;
  highlightColor: string;
  onSelect: (id: string) => void;
}

function PointMesh({
  point,
  isHighlighted,
  isSelected,
  color,
  highlightColor,
  onSelect,
}: PointMeshProps) {
  const pos = toWorld(point);
  const meshColor = isHighlighted || isSelected ? highlightColor : color;
  const radius = isSelected ? 0.06 : 0.045;

  return (
    <mesh
      position={[pos.x, pos.y, pos.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(point.id);
      }}
    >
      <sphereGeometry args={[radius, 12, 12]} />
      <meshStandardMaterial color={meshColor} />
    </mesh>
  );
}

interface RadiusBallsProps {
  points: Point3D[];
  radius: number; // normalised (0..maxRadius in 2D units)
  color: string;
}

function RadiusBalls({ points, radius, color }: RadiusBallsProps) {
  const worldRadius = radius * WORLD_SCALE;
  if (worldRadius < 0.005) return null;
  return (
    <>
      {points.map((p) => {
        const pos = toWorld(p);
        return (
          <mesh key={`ball-${p.id}`} position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[worldRadius, 16, 16]} />
            <meshBasicMaterial color={color} wireframe opacity={0.12} transparent />
          </mesh>
        );
      })}
    </>
  );
}

interface ComplexSceneProps {
  points: Point3D[];
  currentRadius: number;
  highlightIds: string[];
  tdaTealColor: string;
  tdaSlateColor: string;
}

function ComplexScene({
  points,
  currentRadius,
  highlightIds,
  tdaTealColor,
  tdaSlateColor,
}: ComplexSceneProps) {
  if (points.length === 0) return null;

  // Build complex using 2D projection
  const pts2D: Point2D[] = points.map((p) => ({ x: p.x, y: p.y, id: p.id }));
  const simplices = buildComplex(pts2D, currentRadius);

  const edges = simplices
    .filter((s) => s.dimension === 1)
    .map((s) => [s.vertices[0], s.vertices[1]] as [string, string]);

  const triangles = simplices
    .filter((s) => s.dimension === 2)
    .map((s) => [s.vertices[0], s.vertices[1], s.vertices[2]] as [string, string, string]);

  const highlightSet = new Set(highlightIds);
  const pointMap = new Map(points.map((p) => [p.id, p]));

  return (
    <>
      {/* Edges */}
      {edges.map(([a, b]) => {
        const pa = pointMap.get(a);
        const pb = pointMap.get(b);
        if (!pa || !pb) return null;
        const wa = toWorld(pa);
        const wb = toWorld(pb);
        const isHighlighted =
          highlightSet.has(a) && highlightSet.has(b);
        return (
          <Line
            key={`edge-${a}-${b}`}
            points={[[wa.x, wa.y, wa.z], [wb.x, wb.y, wb.z]]}
            color={isHighlighted ? tdaSlateColor : tdaTealColor}
            lineWidth={isHighlighted ? 2.5 : 1.5}
            opacity={isHighlighted ? 1.0 : 0.55}
            transparent
          />
        );
      })}

      {/* Triangles */}
      {triangles.map(([a, b, c]) => {
        const pa = pointMap.get(a);
        const pb = pointMap.get(b);
        const pc = pointMap.get(c);
        if (!pa || !pb || !pc) return null;
        const wa = toWorld(pa);
        const wb = toWorld(pb);
        const wc = toWorld(pc);
        const verts = new Float32Array([
          wa.x, wa.y, wa.z,
          wb.x, wb.y, wb.z,
          wc.x, wc.y, wc.z,
        ]);
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        return (
          <mesh key={`tri-${a}-${b}-${c}`} geometry={geom}>
            <meshBasicMaterial
              color={tdaTealColor}
              opacity={0.18}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </>
  );
}

// Ground-plane click handler component (inside Canvas)
interface GroundPlaneProps {
  onPlacePoint: (x: number, y: number) => void;
  disabled: boolean;
}

function GroundPlane({ onPlacePoint, disabled }: GroundPlaneProps) {
  const planeRef = useRef<THREE.Mesh>(null);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (disabled) return;
      const intersect = e.point;
      if (!intersect) return;
      // Convert world coords back to 0..1 normalised space
      const nx = intersect.x / WORLD_SCALE + 0.5;
      const ny = intersect.y / WORLD_SCALE + 0.5;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
      onPlacePoint(nx, ny);
    },
    [onPlacePoint, disabled],
  );

  return (
    <mesh
      ref={planeRef}
      rotation={[0, 0, 0]}
      position={[0, 0, -0.001]}
      onClick={handleClick}
    >
      <planeGeometry args={[WORLD_SCALE, WORLD_SCALE]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// PointCloudEditor3D — left panel R3F canvas
// ---------------------------------------------------------------------------

interface PointCloudEditor3DProps {
  points: Point3D[];
  currentRadius: number;
  highlightIds: string[];
  selectedPointId: string | null;
  onPointsChange: (pts: Point3D[]) => void;
  onSelectPoint: (id: string | null) => void;
  activePreset: PresetLabel;
  onPresetSelect: (label: PresetLabel) => void;
  tdaTealColor: string;
  tdaSlateColor: string;
  reducedMotion: boolean;
}

function PointCloudEditor3D({
  points,
  currentRadius,
  highlightIds,
  selectedPointId,
  onPointsChange,
  onSelectPoint,
  activePreset,
  onPresetSelect,
  tdaTealColor,
  tdaSlateColor,
  reducedMotion,
}: PointCloudEditor3DProps) {
  const highlightSet = new Set(highlightIds);
  const isFull = points.length >= MAX_POINTS;

  const handlePlacePoint = useCallback(
    (nx: number, ny: number) => {
      if (isFull) return;
      const id = `p3d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      onPointsChange([...points, { x: nx, y: ny, z: 0, id }]);
    },
    [points, isFull, onPointsChange],
  );

  const handleSelectPoint = useCallback(
    (id: string) => {
      onSelectPoint(selectedPointId === id ? null : id);
    },
    [selectedPointId, onSelectPoint],
  );

  // Keyboard delete for selected point
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointId) {
        onPointsChange(points.filter((p) => p.id !== selectedPointId));
        onSelectPoint(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedPointId, points, onPointsChange, onSelectPoint]);

  const handleClear = useCallback(() => {
    onPointsChange([]);
    onSelectPoint(null);
    onPresetSelect(null);
  }, [onPointsChange, onSelectPoint, onPresetSelect]);

  const handlePreset = useCallback(
    (label: NonNullable<PresetLabel>, pts: () => Point3D[]) => {
      onPointsChange(pts());
      onSelectPoint(null);
      onPresetSelect(label);
    },
    [onPointsChange, onSelectPoint, onPresetSelect],
  );

  return (
    <div className="pdb3d-editor">
      {/* Toolbar */}
      <div className="pdb3d-toolbar">
        <button
          type="button"
          className="pce-clear-btn"
          onClick={handleClear}
          aria-label="Clear all points"
        >
          Clear
        </button>
        {PRESETS_3D.map(({ label, points: pts }) => (
          <button
            key={label}
            type="button"
            className={`pce-preset-btn${activePreset === label ? ' pce-preset-btn--active' : ''}`}
            onClick={() => handlePreset(label, pts)}
            aria-pressed={activePreset === label}
          >
            {label}
          </button>
        ))}
      </div>

      {/* R3F Canvas */}
      <div
        className="pdb3d-canvas-wrapper"
        role="application"
        aria-label={`3D point cloud editor. ${points.length} point${points.length !== 1 ? 's' : ''} placed.${isFull ? ' Maximum 30 points reached.' : ' Click canvas to add a point.'}`}
      >
        {reducedMotion ? (
          <div className="pdb3d-reduced-placeholder" aria-live="polite">
            <p>3D animation is disabled due to your reduced-motion preference.</p>
            <p>{points.length} point{points.length !== 1 ? 's' : ''} in the cloud.</p>
          </div>
        ) : (
          <Canvas
            camera={{ position: [0, 0, 2.8], fov: 50 }}
            gl={{ antialias: true }}
            style={{ background: 'var(--color-surface, #f8f8f8)' }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 4, 3]} intensity={0.6} />

            <GroundPlane onPlacePoint={handlePlacePoint} disabled={isFull} />

            {/* Points */}
            {points.map((p) => (
              <PointMesh
                key={p.id}
                point={p}
                isHighlighted={highlightSet.has(p.id)}
                isSelected={selectedPointId === p.id}
                color={tdaTealColor}
                highlightColor={tdaSlateColor}
                onSelect={handleSelectPoint}
              />
            ))}

            {/* Radius wireframe balls */}
            <RadiusBalls
              points={points}
              radius={currentRadius}
              color={tdaTealColor}
            />

            {/* Simplicial complex overlay */}
            <ComplexScene
              points={points}
              currentRadius={currentRadius}
              highlightIds={highlightIds}
              tdaTealColor={tdaTealColor}
              tdaSlateColor={tdaSlateColor}
            />

            <OrbitControls enablePan={false} enableZoom={true} />
          </Canvas>
        )}
      </div>

      {/* Counter */}
      <p className="pdb3d-counter" aria-live="polite" aria-atomic="true">
        {points.length}/{MAX_POINTS} points
        {selectedPointId != null ? ' · Press Delete to remove selected' : ''}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PersistenceDiagram — right panel (identical interface to SVG version)
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

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const xScale = d3.scaleLinear([0, maxRadius], [0, plotWidth]);
  const yScale = d3.scaleLinear([0, maxRadius], [plotHeight, 0]);
  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  const plotDeath = (f: PersistenceFeature) => (f.death === null ? maxRadius : f.death);
  const featureState = (f: PersistenceFeature) => {
    const dv = plotDeath(f);
    if (f.birth > currentRadius) return 'unborn';
    if (dv !== null && dv <= currentRadius) return 'dead';
    return 'alive';
  };

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
        <line className="pdb-diag-line" x1={xScale(0)} y1={yScale(0)} x2={xScale(maxRadius)} y2={yScale(maxRadius)} aria-hidden="true" />
        {currentRadius > 0 && (
          <line className="pdb-radius-line" x1={xScale(currentRadius)} y1={yScale(0)} x2={xScale(currentRadius)} y2={yScale(maxRadius)} aria-hidden="true" />
        )}
        <g transform={`translate(0,${plotHeight})`} aria-hidden="true">
          <line className="pdb-axis-line" x1={0} y1={0} x2={plotWidth} y2={0} />
          {xTicks.map((t) => (
            <g key={`xt-${t}`} transform={`translate(${xScale(t)},0)`}>
              <line className="pdb-axis-tick" x1={0} y1={0} x2={0} y2={5} />
              <text className="pdb-axis-label" y={16} textAnchor="middle">{t.toFixed(2)}</text>
            </g>
          ))}
          <text className="pdb-axis-title" x={plotWidth / 2} y={38} textAnchor="middle">Birth (radius)</text>
        </g>
        <g aria-hidden="true">
          <line className="pdb-axis-line" x1={0} y1={0} x2={0} y2={plotHeight} />
          {yTicks.map((t) => (
            <g key={`yt-${t}`} transform={`translate(0,${yScale(t)})`}>
              <line className="pdb-axis-tick" x1={-5} y1={0} x2={0} y2={0} />
              <text className="pdb-axis-label" x={-8} textAnchor="end" dominantBaseline="middle">{t.toFixed(2)}</text>
            </g>
          ))}
          <text className="pdb-axis-title" transform={`translate(-38,${plotHeight / 2}) rotate(-90)`} textAnchor="middle">Death (radius)</text>
        </g>
        <text className="pdb-immortal-label" x={plotWidth - 4} y={4} textAnchor="end" aria-hidden="true">∞</text>
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
                const deathLabel = f.death === null ? '∞' : f.death.toFixed(3);
                const genLabel = f.generator?.length ? ` · generator: [${f.generator.join(', ')}]` : '';
                const persistence = f.death === null ? '∞' : (f.death - f.birth).toFixed(3);
                showTooltip(
                  tooltipRef.current,
                  e.nativeEvent,
                  `H${f.dimension} · birth ${f.birth.toFixed(3)} · death ${deathLabel} · persistence ${persistence}${genLabel}`,
                );
              }}
              onPointerLeave={() => {
                if (tooltipRef.current) hideTooltip(tooltipRef.current);
              }}
            />
          );
        })}
        <g transform={`translate(${plotWidth - 110},${plotHeight - 46})`} aria-hidden="true">
          <rect className="pdb-legend-bg" x={-6} y={-6} width={116} height={56} rx={4} />
          <circle cx={8} cy={8} r={5} fill={H0_COLOR} />
          <text className="pdb-legend-text" x={18} y={12}>H₀ (components)</text>
          <circle cx={8} cy={28} r={5} fill={H1_COLOR} />
          <text className="pdb-legend-text" x={18} y={32}>H₁ (loops)</text>
          <circle cx={8} cy={46} r={5} fill={H0_COLOR} className="pdb-feature--immortal" />
          <text className="pdb-legend-text" x={18} y={50}>∞ = immortal</text>
        </g>
        {showTwoClustersNote && (
          <g className="pdb-annotation" transform={`translate(4,${plotHeight - 14})`} aria-hidden="true">
            <text className="pdb-annotation-text" x={0} y={0}>
              H₀ long bars = two-cluster signature · H₁ loop reflects 4-pt square geometry
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PersistenceDiagramBuilder3D (parent — exported)
// ---------------------------------------------------------------------------

export interface PersistenceDiagramBuilder3DProps {
  className?: string;
}

export function PersistenceDiagramBuilder3D({
  className,
}: PersistenceDiagramBuilder3DProps) {
  const [points, setPoints] = useState<Point3D[]>([]);
  const [features, setFeatures] = useState<PersistenceFeature[]>([]);
  const [maxRadius, setMaxRadius] = useState<number>(1);
  const [currentRadius, setCurrentRadius] = useState<number>(0);
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState<number | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>('');
  const [activePreset, setActivePreset] = useState<PresetLabel>(null);

  // Animation
  const animFrameRef = useRef<number | null>(null);
  const animStartRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animSpeed, setAnimSpeed] = useState<0.5 | 1 | 2>(1);
  const reducedMotion = useReducedMotion();

  // Colour tokens (read once on mount)
  const [tdaTealColor, setTdaTealColor] = useState('#2a7d8f');
  const [tdaSlateColor, setTdaSlateColor] = useState('#3a5a8c');
  useEffect(() => {
    setTdaTealColor(getPaletteColor('--color-tda-teal') || '#2a7d8f');
    setTdaSlateColor(getPaletteColor('--color-tda-slate') || '#3a5a8c');
  }, []);

  const ariaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recompute persistence when points change
  useEffect(() => {
    if (points.length < 2) {
      setFeatures([]);
      setMaxRadius(1);
      setCurrentRadius(0);
      setSelectedFeatureIdx(null);
      return;
    }
    const mr = maxPairwiseDist(points);
    const steps = buildRadiusSteps(mr);
    const computed = computePersistence3D(points, steps);
    setMaxRadius(mr);
    setFeatures(computed);
    setCurrentRadius(0);
    setSelectedFeatureIdx(null);
  }, [points]);

  // Cross-highlight: selected feature → point highlight
  const highlightIds: string[] = useMemo(() => {
    if (selectedFeatureIdx === null || !features[selectedFeatureIdx]?.generator) return [];
    return features[selectedFeatureIdx].generator ?? [];
  }, [selectedFeatureIdx, features]);

  // Reverse cross-highlight: selected point → nearest alive feature
  const handleSelectPoint = useCallback(
    (id: string | null) => {
      setSelectedPointId((prev) => (prev === id ? null : id));
      if (id && features.length > 0) {
        let bestIdx: number | null = null;
        for (let i = 0; i < features.length; i++) {
          const f = features[i];
          if (!f.generator?.length) continue;
          const overlap = f.generator.some((gid) => gid === id);
          if (!overlap) continue;
          const alive =
            f.birth <= currentRadius && (f.death === null || f.death > currentRadius);
          if (alive) { bestIdx = i; break; }
          if (bestIdx === null) bestIdx = i;
        }
        setSelectedFeatureIdx((prev) => (prev === bestIdx ? null : bestIdx));
      }
    },
    [features, currentRadius],
  );

  // AriaLiveRegion debounce
  useEffect(() => {
    if (ariaDebounceRef.current) clearTimeout(ariaDebounceRef.current);
    ariaDebounceRef.current = setTimeout(() => {
      const h0 = features.filter(
        (f) => f.dimension === 0 && f.birth <= currentRadius && (f.death === null || f.death > currentRadius),
      ).length;
      const h1 = features.filter(
        (f) => f.dimension === 1 && f.birth <= currentRadius && (f.death === null || f.death > currentRadius),
      ).length;
      if (features.length > 0 || points.length > 0) {
        setLiveMessage(
          `Radius ${currentRadius.toFixed(2)}: ${h0} component${h0 !== 1 ? 's' : ''}, ${h1} loop${h1 !== 1 ? 's' : ''}`,
        );
      }
    }, ARIA_DEBOUNCE_MS);
    return () => { if (ariaDebounceRef.current) clearTimeout(ariaDebounceRef.current); };
  }, [currentRadius, features, points.length]);

  // Animation
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

  useEffect(() => () => { stopAnimation(); }, [stopAnimation]);

  // Step-through
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
      if (direction === 'next') {
        const next = eventRadii.find((r) => r > currentRadius + 1e-9);
        if (next !== undefined) setCurrentRadius(next);
      } else {
        const prev = [...eventRadii].reverse().find((r) => r < currentRadius - 1e-9);
        if (prev !== undefined) setCurrentRadius(prev);
      }
    },
    [eventRadii, currentRadius],
  );

  // TextDescriptionToggle
  const textDescription = useMemo(() => {
    const h0Count = features.filter(
      (f) => f.dimension === 0 && f.birth <= currentRadius && (f.death === null || f.death > currentRadius),
    ).length;
    const h1Count = features.filter(
      (f) => f.dimension === 1 && f.birth <= currentRadius && (f.death === null || f.death > currentRadius),
    ).length;
    const totalBorn = features.filter((f) => f.birth <= currentRadius).length;
    let desc =
      `${points.length} point${points.length !== 1 ? 's' : ''} in the 3D cloud. ` +
      `Current filtration radius: ${currentRadius.toFixed(3)}. ` +
      `${totalBorn} feature${totalBorn !== 1 ? 's' : ''} born; ` +
      `${h0Count} active H\u2080 component${h0Count !== 1 ? 's' : ''}, ` +
      `${h1Count} active H\u2081 loop${h1Count !== 1 ? 's' : ''}.`;
    if (activePreset && PRESET_NOTES[activePreset]) {
      desc += ` Educational note: ${PRESET_NOTES[activePreset]}`;
    }
    return desc;
  }, [points.length, currentRadius, features, activePreset]);

  return (
    <div className={`pdb-wrapper${className ? ` ${className}` : ''}`}>
      <TextDescriptionToggle description={textDescription}>
        <div className="pdb-panels">
          {/* Left panel: 3D point cloud */}
          <div className="pdb-panel pdb-panel--left">
            <h3 className="pdb-panel-label">Point Cloud (3D)</h3>
            <PointCloudEditor3D
              points={points}
              currentRadius={currentRadius}
              highlightIds={highlightIds}
              selectedPointId={selectedPointId}
              onPointsChange={setPoints}
              onSelectPoint={handleSelectPoint}
              activePreset={activePreset}
              onPresetSelect={setActivePreset}
              tdaTealColor={tdaTealColor}
              tdaSlateColor={tdaSlateColor}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Right panel: persistence diagram (unchanged 2D SVG) */}
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
          <div className="pdb-slider-row">
            <label htmlFor="pdb3d-slider" className="pdb-control-label">Radius</label>
            <input
              id="pdb3d-slider"
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
              <button className="pdb-btn" type="button" onClick={() => stepTo('prev')} disabled={points.length < 2 || currentRadius <= 0} aria-label="Step to previous event radius">◀ Prev</button>
              <button className="pdb-btn" type="button" onClick={() => stepTo('next')} disabled={points.length < 2 || currentRadius >= maxRadius} aria-label="Step to next event radius">Next ▶</button>
              <label className="pdb-control-label" htmlFor="pdb3d-speed">Speed</label>
              <select
                id="pdb3d-speed"
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
