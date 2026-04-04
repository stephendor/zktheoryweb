/**
 * HomologyEditor.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Interactive Simplex / Homology Editor.
 *
 * A fixed simplicial complex rendered as an SVG. Click edges or triangles to
 * toggle them in or out of the complex; β₀ and β₁ update in real time.
 *
 * Architecture:
 *   - React-controlled SVG (no D3 mutations — no axes or continuous data).
 *     onClick handlers sit directly on SVG elements; React re-renders the SVG.
 *   - computeHomology() is called in useMemo on every state change.
 *   - Shared infrastructure: AriaLiveRegion, TextDescriptionToggle,
 *     useReducedMotion (Task 3.1 canon).
 *   - ResponsiveContainer for sizing; SVG scales via a viewBox.
 *
 * Interaction:
 *   - Inactive (possible) edges/triangles: shown faintly, dashed, clickable.
 *   - Active edges/triangles: shown in full colour, clickable to remove.
 *   - Vertices: fixed, not clickable.
 *   - Betti counter bar: β₀ and β₁ with animated digit transition.
 */

import { useState, useMemo, useCallback } from 'react';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import {
  computeHomology,
  HOMOLOGY_PRESETS,
  DEFAULT_HOMOLOGY_PRESET_ID,
} from './HomologyEditor.data';
import type { HomologyPreset } from './HomologyEditor.data';
import './HomologyEditor.css';

// ─── Constants ────────────────────────────────────────────────────────────────

/** SVG viewBox dimensions (internal coordinate space). */
const VB_W = 400;
const VB_H = 380;

/** Point radius in viewBox units. */
const VERTEX_R = 10;

// ─── Betti counter ────────────────────────────────────────────────────────────

function BettiCounter({ beta0, beta1 }: { beta0: number; beta1: number }) {
  return (
    <div className="he-betti-bar" aria-live="polite" aria-atomic="true">
      <div className="he-betti-item">
        <span className="he-betti-symbol">β₀</span>
        <span className="he-betti-value">{beta0}</span>
        <span className="he-betti-label">components</span>
      </div>
      <div className="he-betti-divider" aria-hidden="true" />
      <div className="he-betti-item">
        <span className="he-betti-symbol">β₁</span>
        <span className="he-betti-value">{beta1}</span>
        <span className="he-betti-label">loops</span>
      </div>
    </div>
  );
}

// ─── SVG canvas ───────────────────────────────────────────────────────────────

interface HEditorSVGProps {
  preset: HomologyPreset;
  activeEdgeKeys: Set<string>;
  activeTriangleKeys: Set<string>;
  width: number;
  height: number;
  reducedMotion: boolean;
  onToggleEdge: (key: string) => void;
  onToggleTriangle: (key: string) => void;
}

function HEditorSVG({
  preset,
  activeEdgeKeys,
  activeTriangleKeys,
  width,
  height,
  reducedMotion,
  onToggleEdge,
  onToggleTriangle,
}: HEditorSVGProps) {
  // Map normalised [0,1] vertex coords to viewBox pixel coords
  function vx(x: number) { return x * VB_W; }
  function vy(y: number) { return y * VB_H; }

  void reducedMotion; // reserved for future transition opt-out

  return (
    <svg
      className="he-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={height}
      role="img"
      aria-label="Simplicial complex editor. Click edges and triangles to toggle them."
    >
      {/* ── Triangles (below edges) ──────────────────────────────────────── */}
      {preset.possibleTriangles.map((tri) => {
        const isActive = activeTriangleKeys.has(tri.key);
        const v0 = preset.vertices[tri.v0];
        const v1 = preset.vertices[tri.v1];
        const v2 = preset.vertices[tri.v2];
        const pts = [
          `${vx(v0.x)},${vy(v0.y)}`,
          `${vx(v1.x)},${vy(v1.y)}`,
          `${vx(v2.x)},${vy(v2.y)}`,
        ].join(' ');

        return (
          <polygon
            key={tri.key}
            points={pts}
            className={`he-triangle${isActive ? ' he-triangle--active' : ' he-triangle--ghost'}`}
            onClick={() => onToggleTriangle(tri.key)}
            role="button"
            tabIndex={0}
            aria-label={`Triangle ${tri.v0}–${tri.v1}–${tri.v2}: ${isActive ? 'active, click to remove' : 'inactive, click to add'}`}
            aria-pressed={isActive}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleTriangle(tri.key);
              }
            }}
          />
        );
      })}

      {/* ── Edges (above triangles, below vertices) ──────────────────────── */}
      {preset.possibleEdges.map((edge) => {
        const isActive = activeEdgeKeys.has(edge.key);
        const v0 = preset.vertices[edge.v0];
        const v1 = preset.vertices[edge.v1];

        return (
          <line
            key={edge.key}
            x1={vx(v0.x)}
            y1={vy(v0.y)}
            x2={vx(v1.x)}
            y2={vy(v1.y)}
            className={`he-edge${isActive ? ' he-edge--active' : ' he-edge--ghost'}`}
            onClick={() => onToggleEdge(edge.key)}
            role="button"
            tabIndex={0}
            aria-label={`Edge ${edge.v0}–${edge.v1}: ${isActive ? 'active, click to remove' : 'inactive, click to add'}`}
            aria-pressed={isActive}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleEdge(edge.key);
              }
            }}
          />
        );
      })}

      {/* ── Vertices (on top) ─────────────────────────────────────────────── */}
      {preset.vertices.map((vert) => (
        <g key={vert.id} className="he-vertex-group">
          <circle
            cx={vx(vert.x)}
            cy={vy(vert.y)}
            r={VERTEX_R}
            className="he-vertex"
          />
          <text
            x={vx(vert.x)}
            y={vy(vert.y)}
            className="he-vertex-label"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {vert.label ?? vert.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main exported component ───────────────────────────────────────────────────

export interface HomologyEditorProps {
  className?: string;
}

export function HomologyEditor({ className }: HomologyEditorProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [presetId, setPresetId] = useState(DEFAULT_HOMOLOGY_PRESET_ID);
  const [liveMsg, setLiveMsg] = useState('');

  const reducedMotion = useReducedMotion();

  // Current preset
  const preset = useMemo(
    () => HOMOLOGY_PRESETS.find((p) => p.id === presetId) ?? HOMOLOGY_PRESETS[0],
    [presetId],
  );

  // Edge/triangle toggle state — initialised from preset, reset on preset change
  const [activeEdgeKeys, setActiveEdgeKeys] = useState<Set<string>>(
    () => new Set(preset.initialEdgeKeys),
  );
  const [activeTriangleKeys, setActiveTriangleKeys] = useState<Set<string>>(
    () => new Set(preset.initialTriangleKeys),
  );

  // ── Derived Betti numbers ──────────────────────────────────────────────────
  const betti = useMemo(
    () =>
      computeHomology(
        preset.vertices,
        activeEdgeKeys,
        activeTriangleKeys,
        preset.possibleEdges,
        preset.possibleTriangles,
      ),
    [preset, activeEdgeKeys, activeTriangleKeys],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePresetChange = useCallback((id: string) => {
    setPresetId(id);
    const newPreset = HOMOLOGY_PRESETS.find((p) => p.id === id) ?? HOMOLOGY_PRESETS[0];
    setActiveEdgeKeys(new Set(newPreset.initialEdgeKeys));
    setActiveTriangleKeys(new Set(newPreset.initialTriangleKeys));
    setLiveMsg(`Loaded preset: ${newPreset.label}.`);
  }, []);

  const handleToggleEdge = useCallback(
    (key: string) => {
      setActiveEdgeKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
          setLiveMsg(`Edge removed. β₀ = ${betti.beta0}, β₁ = ${betti.beta1}.`);
        } else {
          next.add(key);
          setLiveMsg(`Edge added. β₀ = ${betti.beta0}, β₁ = ${betti.beta1}.`);
        }
        return next;
      });
    },
    [betti],
  );

  const handleToggleTriangle = useCallback(
    (key: string) => {
      setActiveTriangleKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
          setLiveMsg(`Triangle removed. β₀ = ${betti.beta0}, β₁ = ${betti.beta1}.`);
        } else {
          next.add(key);
          setLiveMsg(`Triangle added. β₀ = ${betti.beta0}, β₁ = ${betti.beta1}.`);
        }
        return next;
      });
    },
    [betti],
  );

  const handleReset = useCallback(() => {
    setActiveEdgeKeys(new Set(preset.initialEdgeKeys));
    setActiveTriangleKeys(new Set(preset.initialTriangleKeys));
    setLiveMsg('Reset to initial state.');
  }, [preset]);

  // ── Text description ───────────────────────────────────────────────────────
  const textDescription = [
    `Preset: ${preset.label}.`,
    `Active edges: ${activeEdgeKeys.size} of ${preset.possibleEdges.length}.`,
    `Active triangles: ${activeTriangleKeys.size} of ${preset.possibleTriangles.length}.`,
    `β₀ = ${betti.beta0} (connected components), β₁ = ${betti.beta1} (independent loops).`,
    `${preset.description}`,
  ].join(' ');

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`he-wrapper${className ? ` ${className}` : ''}`}>

        {/* ── Betti counter ─────────────────────────────────────────────── */}
        <BettiCounter beta0={betti.beta0} beta1={betti.beta1} />

        {/* ── SVG canvas ────────────────────────────────────────────────── */}
        <ResponsiveContainer className="he-responsive" minHeight={340}>
          {({ width, height }) => (
            <HEditorSVG
              preset={preset}
              activeEdgeKeys={activeEdgeKeys}
              activeTriangleKeys={activeTriangleKeys}
              width={width}
              height={height}
              reducedMotion={reducedMotion}
              onToggleEdge={handleToggleEdge}
              onToggleTriangle={handleToggleTriangle}
            />
          )}
        </ResponsiveContainer>

        {/* ── Legend ────────────────────────────────────────────────────── */}
        <div className="he-legend" aria-label="Legend">
          <div className="he-legend-item">
            <div className="he-legend-swatch he-legend-swatch--edge-active" />
            <span>Edge (active — click to remove)</span>
          </div>
          <div className="he-legend-item">
            <div className="he-legend-swatch he-legend-swatch--edge-ghost" />
            <span>Edge (inactive — click to add)</span>
          </div>
          <div className="he-legend-item">
            <div className="he-legend-swatch he-legend-swatch--tri-active" />
            <span>Triangle (active — click to remove)</span>
          </div>
          <div className="he-legend-item">
            <div className="he-legend-swatch he-legend-swatch--tri-ghost" />
            <span>Triangle (inactive — click to add)</span>
          </div>
        </div>

        {/* ── Preset description ────────────────────────────────────────── */}
        <p className="he-preset-desc">{preset.description}</p>

        {/* ── Controls ──────────────────────────────────────────────────── */}
        <div className="he-controls" role="group" aria-label="Editor controls">
          <div className="he-control-group">
            <label htmlFor="he-preset-select" className="he-label">
              Preset
            </label>
            <select
              id="he-preset-select"
              className="he-select"
              value={presetId}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              {HOMOLOGY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="he-reset-btn"
            onClick={handleReset}
          >
            Reset to initial state
          </button>
        </div>

        {/* ── ARIA live region ──────────────────────────────────────────── */}
        <AriaLiveRegion message={liveMsg} />
      </div>
    </TextDescriptionToggle>
  );
}
