/**
 * NormalDistExplorer.tsx — Task 3.2 — Agent_Interactive_Core
 *
 * Interactive Normal Distribution Explorer with:
 *   - D3 SVG area chart rendering the PDF curve
 *   - Draggable handles for μ (mean) and σ (standard deviation)
 *   - Historical overlay system (Step 2)
 *   - Full a11y: keyboard controls, AriaLiveRegion, TextDescriptionToggle,
 *     reduced-motion static fallback (Step 3)
 *
 * Uses Task 3.1 shared infrastructure:
 *   - ResponsiveContainer for responsive sizing
 *   - renderXAxis / renderYAxis from axes.ts
 *   - getVizColorScale / getPaletteColor from scales.ts
 *   - createTooltip / showTooltip / hideTooltip / destroyTooltip from tooltip.ts
 *   - AriaLiveRegion, TextDescriptionToggle, useReducedMotion from a11y/
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { renderXAxis, renderYAxis } from '@lib/viz/axes';
import { getVizColorScale } from '@lib/viz/scales';
import { createTooltip, showTooltip, hideTooltip, destroyTooltip } from '@lib/viz/tooltip';
import type { TooltipHandle } from '@lib/viz/tooltip';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import { OVERLAYS } from './NormalDistExplorer.data';
import type { OverlayDef } from './NormalDistExplorer.data';
import './NormalDistExplorer.css';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Chart margins in pixels. */
const MARGIN = { top: 20, right: 30, bottom: 50, left: 55 };

/** Domain for x-axis: covers ±4σ from the interactive mean range edges. */
const X_DOMAIN: [number, number] = [-5, 5];

/** Clamp μ within this range. */
const MU_MIN = -3;
const MU_MAX = 3;

/** Clamp σ to positive values. */
const SIGMA_MIN = 0.2;
const SIGMA_MAX = 2.5;

/** Keyboard step size for arrow-key parameter adjustment. */
const KEY_STEP = 0.1;

/** Debounce delay (ms) for ARIA live announcements. */
const ANNOUNCE_DEBOUNCE_MS = 300;

/** Number of points in the curve path. */
const CURVE_POINTS = 400;
/** Monotonic counter for generating stable per-instance IDs without Math.random(). */
let _idCounter = 0;
// ─── PDF helper ───────────────────────────────────────────────────────────────

/**
 * Normal distribution probability density function.
 * f(x) = (1 / (σ√2π)) · exp(−(x − μ)² / (2σ²))
 */
export function normalPDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NormalDistExplorerProps {
  /** Initial mean value. Defaults to 0. */
  initialMu?: number;
  /** Initial standard deviation. Defaults to 1. */
  initialSigma?: number;
  /** Optional extra CSS class on the outermost wrapper. */
  className?: string;
}

// ─── Inner chart component (receives measured dimensions) ─────────────────────

interface ChartProps {
  width: number;
  height: number;
  mu: number;
  sigma: number;
  activeOverlays: ReadonlySet<string>;
  reducedMotion: boolean;
  onMuChange: (mu: number) => void;
  onSigmaChange: (sigma: number) => void;
  onHover: (msg: string) => void;
  /** ID of the element that contains keyboard usage instructions for aria-describedby. */
  instructionsId: string;
}

function NormalDistChart({
  width,
  height,
  mu,
  sigma,
  activeOverlays,
  reducedMotion,
  onMuChange,
  onSigmaChange,
  onHover,
  instructionsId,
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  // ── Build scales (memoised so useEffect deps are stable references) ─────────

  const xScale = useMemo(
    () => d3.scaleLinear().domain(X_DOMAIN).range([0, innerW]),
    [innerW],
  );

  // Compute max y across active overlays + primary curve for autoscaling.
  const allSigmas = useMemo(
    () => [sigma, ...Array.from(activeOverlays)
      .map((id) => OVERLAYS.find((o) => o.id === id))
      .filter(Boolean)
      .map((o) => o!.sigma)],
    [sigma, activeOverlays],
  );
  const minSigma = Math.min(...allSigmas);
  const yMax = normalPDF(0, 0, minSigma) * 1.15; // 15% headroom

  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, yMax]).range([innerH, 0]).nice(),
    [yMax, innerH],
  );

  // ── Generate primary PDF data ────────────────────────────────────────────────

  const curveData = d3.range(CURVE_POINTS + 1).map((i: number) => {
    const x = X_DOMAIN[0] + (i / CURVE_POINTS) * (X_DOMAIN[1] - X_DOMAIN[0]);
    return { x, y: normalPDF(x, mu, sigma) };
  });

  // ── D3 area and line generators ──────────────────────────────────────────────

  const area = d3
    .area<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y0(innerH)
    .y1((d) => yScale(d.y))
    .curve(d3.curveBasis);

  const line = d3
    .line<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .curve(d3.curveBasis);

  // ── Tooltip and axes via useEffect (DOM mutation) ────────────────────────────
  //
  // Dependency array includes all values read inside the effect so React can
  // skip re-running when nothing relevant has changed. This prevents re-binding
  // D3 drag and re-calling renderAxis on every unrelated render.

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    // Create tooltip if not existing.
    if (!tooltipRef.current) {
      tooltipRef.current = createTooltip(containerEl);
    }

    const svg = d3.select(svgEl);

    // ── Axes ──────────────────────────────────────────────────────────────────

    const xAxisG = svg.select<SVGGElement>('.nde-x-axis');
    const yAxisG = svg.select<SVGGElement>('.nde-y-axis');

    renderXAxis(xAxisG, xScale as d3.AxisScale<number>, {
      label: 'Standard Deviations from Mean',
      tickCount: 9,
    });
    renderYAxis(yAxisG, yScale as d3.AxisScale<number>, {
      label: 'Probability Density',
    });

    // ── Tooltip hover on curve area ────────────────────────────────────────────

    const hoverRect = svg.select<SVGRectElement>('.nde-hover-rect');
    hoverRect
      .on('pointermove', (event: PointerEvent) => {
        const [mx] = d3.pointer(event, svgEl);
        const xVal = xScale.invert(mx - MARGIN.left);
        const yVal = normalPDF(xVal, mu, sigma);
        const tt = tooltipRef.current;
        if (tt) {
          showTooltip(
            tt,
            event,
            `x = ${xVal.toFixed(2)}, f(x) = ${yVal.toFixed(4)}`,
          );
        }
        onHover(`x equals ${xVal.toFixed(2)}, probability density ${yVal.toFixed(4)}`);
      })
      .on('pointerleave', () => {
        const tt = tooltipRef.current;
        if (tt) hideTooltip(tt);
      });

    // ── D3 drag for μ handle ──────────────────────────────────────────────────
    //
    // INTEGRATION NOTE (important_finding):
    // D3 drag callbacks are invoked outside of React's render cycle — they fire
    // as native DOM events. To update React state from inside a drag handler, we
    // must reference the latest state via a ref or a stable callback (passed as
    // a prop), otherwise the handler closes over stale state from the render in
    // which drag was initialised. Here we use the `onMuChange` / `onSigmaChange`
    // callbacks (stable function references passed from the parent via
    // useCallback) to push new values into React state.
    //
    // Additionally, D3 drag sets `pointer-events: none` on the dragged element
    // during a drag gesture, which is fine, but calling `event.preventDefault()`
    // inside drag handlers is required to prevent text selection on slow drags.

    if (!reducedMotion) {
      const muDrag = d3
        .drag<SVGCircleElement, unknown>()
        .on('drag', (event: d3.D3DragEvent<SVGCircleElement, unknown, unknown>) => {
          event.sourceEvent.preventDefault();
          const newMu = xScale.invert(event.x);
          onMuChange(Math.max(MU_MIN, Math.min(MU_MAX, newMu)));
        });

      svg.select<SVGCircleElement>('.nde-mean-handle-dot').call(muDrag);

      const sigmaDrag = d3
        .drag<SVGCircleElement, unknown>()
        .on('drag', (event: d3.D3DragEvent<SVGCircleElement, unknown, unknown>) => {
          event.sourceEvent.preventDefault();
          // Sigma handle sits at μ + σ on x-axis; dragging changes σ.
          const xValue = xScale.invert(event.x);
          const newSigma = xValue - mu;
          onSigmaChange(Math.max(SIGMA_MIN, Math.min(SIGMA_MAX, newSigma)));
        });

      svg.select<SVGCircleElement>('.nde-sigma-handle-dot').call(sigmaDrag);
    }
  }, [xScale, yScale, width, height, mu, sigma, activeOverlays, reducedMotion, onMuChange, onSigmaChange, onHover]);

  // ── Cleanup tooltip on component unmount ──────────────────────────────────

  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        destroyTooltip(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);

  // ── Build overlay curves ───────────────────────────────────────────────────

  // Pre-seed with all overlay IDs for stable, consistent colour assignment.
  // NormalDistChart only renders client-side (guarded by ResponsiveContainer),
  // so getVizColorScale() can be called directly without an SSR guard.
  // The ordinal scale maps OVERLAYS[0].id → viz-1, [1] → viz-2, etc.
  const colorScale = getVizColorScale().domain(OVERLAYS.map((o) => o.id));

  const activeOverlayDefs = OVERLAYS.filter((o) => activeOverlays.has(o.id));

  // ── Render ─────────────────────────────────────────────────────────────────

  const muX = xScale(mu);
  const sigmaX = xScale(mu + sigma);
  const sigmaMinusX = xScale(mu - sigma);
  const dotY = innerH / 2;

  return (
    <div ref={containerRef} className="nde-chart-container">
      <svg
        ref={svgRef}
        className="nde-svg"
        width={width}
        height={height}
        role="img"
        aria-label={`Interactive normal distribution chart. μ = ${mu.toFixed(2)}, σ = ${sigma.toFixed(2)}.`}
        aria-describedby={instructionsId}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* ── Sigma shaded band ── */}
          <rect
            className="nde-sigma-band"
            x={sigmaMinusX}
            y={0}
            width={sigmaX - sigmaMinusX}
            height={innerH}
          />

          {/* ── Overlay curves ── */}
          {activeOverlayDefs.map((overlay) => {
            const overlayCurveData = d3.range(CURVE_POINTS + 1).map((j: number) => {
              const x = X_DOMAIN[0] + (j / CURVE_POINTS) * (X_DOMAIN[1] - X_DOMAIN[0]);
              return { x, y: normalPDF(x, overlay.mu, overlay.sigma) };
            });
            // colorScale is pre-seeded with all overlay IDs so the colour for
            // each overlay is stable regardless of which overlays are active.
            const overlayColor = colorScale(overlay.id);

            if (overlay.type === 'curve') {
              return (
                <g key={overlay.id}>
                  <path
                    d={area(overlayCurveData) ?? undefined}
                    fill={overlayColor}
                    fillOpacity={0.1}
                  />
                  <path
                    d={line(overlayCurveData) ?? undefined}
                    fill="none"
                    stroke={overlayColor}
                    strokeWidth={2}
                    strokeDasharray="6 3"
                  />
                </g>
              );
            }

            // type === 'threshold' — vertical line at threshold x
            const thresholdX = xScale(overlay.thresholdX ?? (overlay.mu - overlay.sigma));
            return (
              <line
                key={overlay.id}
                x1={thresholdX}
                x2={thresholdX}
                y1={0}
                y2={innerH}
                stroke={overlayColor}
                strokeWidth={2.5}
                strokeDasharray="8 4"
              />
            );
          })}

          {/* ── Primary PDF area ── */}
          <path className="nde-area" d={area(curveData) ?? undefined} />
          <path className="nde-curve" d={line(curveData) ?? undefined} />

          {/* ── σ bracket lines ── */}
          <line
            className="nde-sigma-line"
            x1={sigmaMinusX}
            x2={sigmaMinusX}
            y1={0}
            y2={innerH}
          />
          <line
            className="nde-sigma-line"
            x1={sigmaX}
            x2={sigmaX}
            y1={0}
            y2={innerH}
          />

          {/* ── μ vertical line ── */}
          <line
            className="nde-mean-handle"
            x1={muX}
            x2={muX}
            y1={0}
            y2={innerH}
          />

          {/* ── Axes ── */}
          <g className="nde-x-axis" transform={`translate(0,${innerH})`} />
          <g className="nde-y-axis" />

          {/* ── Transparent hover rect for tooltip ── */}
          {/* Must render BEFORE drag circles so circles sit above it in z-order */}
          <rect
            className="nde-hover-rect"
            x={0}
            y={0}
            width={innerW}
            height={innerH}
            fill="transparent"
          />

          {/* ── Drag handles (hidden in reduced-motion mode) ── */}
          {!reducedMotion && (
            <>
              {/* μ drag dot */}
              <circle
                className="nde-mean-handle-dot"
                cx={muX}
                cy={dotY}
                r={8}
                tabIndex={0}
                role="img"
                aria-label={`Mean μ drag handle, currently ${mu.toFixed(2)}. Use left/right arrow keys on the chart wrapper to adjust.`}
              />
              {/* σ drag dot (at μ + σ) */}
              <circle
                className="nde-sigma-handle-dot"
                cx={sigmaX}
                cy={dotY}
                r={8}
                tabIndex={0}
                role="img"
                aria-label={`Standard deviation σ drag handle, currently ${sigma.toFixed(2)}. Use up/down arrow keys on the chart wrapper to adjust.`}
              />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

// ─── Main export ── ────────────────────────────────────────────────────────────

export function NormalDistExplorer({
  initialMu = 0,
  initialSigma = 1,
  className,
}: NormalDistExplorerProps) {
  const [mu, setMu] = useState(initialMu);
  const [sigma, setSigma] = useState(initialSigma);
  const [activeOverlays, setActiveOverlays] = useState<ReadonlySet<string>>(new Set());
  /** Parameter-change announcements (polite — reads after user pauses). */
  const [paramLiveMsg, setParamLiveMsg] = useState('');
  /** Hover-position announcements (assertive — reads immediately on hover). */
  const [hoverLiveMsg, setHoverLiveMsg] = useState('');
  const paramTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  // ── Stable callbacks to avoid stale-closure problems in D3 drag ─────────────

  const handleMuChange = useCallback((newMu: number) => {
    setMu(newMu);
  }, []);

  const handleSigmaChange = useCallback((newSigma: number) => {
    setSigma(newSigma);
  }, []);

  // ── Debounced ARIA announcements ─────────────────────────────────────────────
  //
  // Two separate live regions prevent hover readings from clobbering parameter
  // change announcements:
  //   paramLiveMsg — polite, debounced 300ms; fires when μ/σ change
  //   hoverLiveMsg — assertive; fires immediately on pointermove (set directly
  //                  from onHover callback, no timer needed)

  const announceParam = useCallback((msg: string) => {
    if (paramTimerRef.current) clearTimeout(paramTimerRef.current);
    paramTimerRef.current = setTimeout(() => setParamLiveMsg(msg), ANNOUNCE_DEBOUNCE_MS);
  }, []);

  const announceHover = useCallback((msg: string) => {
    setHoverLiveMsg(msg);
  }, []);

  // Announce whenever μ or σ changes.
  useEffect(() => {
    announceParam(`Mean is ${mu.toFixed(2)}, standard deviation is ${sigma.toFixed(2)}`);
    return () => {
      if (paramTimerRef.current) clearTimeout(paramTimerRef.current);
    };
  }, [mu, sigma, announceParam]);

  // ── Keyboard handler (attached to the chart wrapper div) ─────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setMu((v) => parseFloat(Math.max(MU_MIN, v - KEY_STEP).toFixed(2)));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setMu((v) => parseFloat(Math.min(MU_MAX, v + KEY_STEP).toFixed(2)));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSigma((v) => parseFloat(Math.min(SIGMA_MAX, v + KEY_STEP).toFixed(2)));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSigma((v) => parseFloat(Math.max(SIGMA_MIN, v - KEY_STEP).toFixed(2)));
          break;
        default:
          break;
      }
    },
    [],
  );

  // ── Overlay colour vars (swatches + annotation borders) ────────────────────
  // Maps each overlay ID to its CSS custom property, mirroring the ordinal
  // scale's assignment: OVERLAYS[0] → --color-viz-1, OVERLAYS[1] → --color-viz-2, etc.
  // Using CSS vars here (not getPaletteColor) keeps NormalDistExplorer SSR-safe.
  const overlayColorVars: Record<string, string> = Object.fromEntries(
    OVERLAYS.map((o, i) => [o.id, `--color-viz-${i + 1}`]),
  );

  // ── Overlay toggle ─────────────────────────────────────────────────────────

  const toggleOverlay = useCallback((id: string) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Text description (for TextDescriptionToggle) ───────────────────────────

  const activeOverlayLabels = OVERLAYS.filter((o) => activeOverlays.has(o.id))
    .map((o) => o.label)
    .join(', ');

  const textDescription =
    `Normal distribution curve with mean μ = ${mu.toFixed(2)} and standard deviation σ = ${sigma.toFixed(2)}. ` +
    `The peak (mode) occurs at x = ${mu.toFixed(2)} with probability density ${normalPDF(mu, mu, sigma).toFixed(4)}. ` +
    `68% of values lie between ${(mu - sigma).toFixed(2)} and ${(mu + sigma).toFixed(2)}.` +
    (activeOverlayLabels
      ? ` Active historical overlays: ${activeOverlayLabels}.`
      : ' No historical overlays active.');

  // ── Active overlay annotation panel ───────────────────────────────────────

  const activeOverlayDefs: OverlayDef[] = OVERLAYS.filter((o) => activeOverlays.has(o.id));

  /** Stable unique ID for the keyboard instructions element (aria-describedby).
   * Uses a module-level counter (not Math.random) to keep the initialiser pure. */
  const instructionsId = useRef(`nde-instructions-${++_idCounter}`).current;

  return (
    <div
      className={`nde-wrapper${className ? ` ${className}` : ''}`}
    >
      {/* ── Parameter readout ── */}
      <div className="nde-readout" aria-live="off">
        <span className="nde-readout__item">
          <span className="nde-readout__label">μ</span>
          <span className="nde-readout__value">{mu.toFixed(2)}</span>
        </span>
        <span className="nde-readout__item">
          <span className="nde-readout__label">σ</span>
          <span className="nde-readout__value">{sigma.toFixed(2)}</span>
        </span>
      </div>

      {/* ── Reduced-motion static inputs ── */}
      {reducedMotion && (
        <div className="nde-static-inputs">
          <label>
            μ (mean)
            <input
              type="number"
              value={mu}
              min={MU_MIN}
              max={MU_MAX}
              step={KEY_STEP}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) setMu(Math.max(MU_MIN, Math.min(MU_MAX, v)));
              }}
            />
          </label>
          <label>
            σ (std dev)
            <input
              type="number"
              value={sigma}
              min={SIGMA_MIN}
              max={SIGMA_MAX}
              step={KEY_STEP}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) setSigma(Math.max(SIGMA_MIN, Math.min(SIGMA_MAX, v)));
              }}
            />
          </label>
        </div>
      )}

      {!reducedMotion && (
        <p className="nde-drag-hint" id={instructionsId}>
          Drag the <strong>blue dot</strong> to shift μ · drag the{' '}
          <strong>green dot</strong> to adjust σ · or focus anywhere in the chart
          area and use <kbd>←</kbd><kbd>→</kbd> for μ,{' '}
          <kbd>↑</kbd><kbd>↓</kbd> for σ
        </p>
      )}
      {reducedMotion && (
        <p className="nde-drag-hint" id={instructionsId}>
          Use the number inputs or{' '}
          <kbd>←</kbd><kbd>→</kbd> keys (μ),{' '}
          <kbd>↑</kbd><kbd>↓</kbd> keys (σ) to adjust the distribution.
        </p>
      )}

      {/* ── Chart wrapped in TextDescriptionToggle ── */}
      {/* The keyboard-handling div uses role="toolbar" which jsx-a11y accepts   */}
      {/* as an interactive role supporting key events. Arrow keys adjust μ/σ.  */}
      <div
        role="toolbar"
        aria-label="Distribution controls — arrow keys adjust μ (left/right) and σ (up/down)"
        aria-describedby={instructionsId}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <TextDescriptionToggle description={textDescription}>
          <ResponsiveContainer minHeight={300}>
            {({ width, height }) => (
              <NormalDistChart
                width={width}
                height={height}
                mu={mu}
                sigma={sigma}
                activeOverlays={activeOverlays}
                reducedMotion={reducedMotion}
                onMuChange={handleMuChange}
                onSigmaChange={handleSigmaChange}
                onHover={announceHover}
                instructionsId={instructionsId}
              />
            )}
          </ResponsiveContainer>
        </TextDescriptionToggle>
      </div>

      {/* ── ARIA live regions ── */}
      {/* polite: parameter changes — waits for idle before reading */}
      <AriaLiveRegion message={paramLiveMsg} />
      {/* assertive: hover position readings — interrupts immediately */}
      <div className="alr-region" aria-live="assertive" aria-atomic="true">
        {hoverLiveMsg}
      </div>

      {/* ── Historical overlay toggles (Step 2 — rendered even now for structure) ── */}
      <div className="nde-overlays" role="group" aria-label="Historical overlay distributions">
        {OVERLAYS.map((overlay) => (
          <label key={overlay.id} className="nde-overlay-toggle">
            <input
              type="checkbox"
              checked={activeOverlays.has(overlay.id)}
              onChange={() => toggleOverlay(overlay.id)}
            />
            <span
              className="nde-overlay-swatch"
              style={{ backgroundColor: `var(${overlayColorVars[overlay.id]})` }}
              aria-hidden="true"
            />
            <span className="nde-overlay-label">{overlay.label}</span>
          </label>
        ))}
      </div>

      {/* ── Active overlay annotation panel ── */}
      {activeOverlayDefs.length > 0 && (
        <div className="nde-annotations" aria-label="Historical context annotations">
          {activeOverlayDefs.map((overlay) => (
            <div
              key={overlay.id}
              className="nde-annotation"
              style={{ borderLeftColor: `var(${overlayColorVars[overlay.id]})` }}
            >
              <strong className="nde-annotation__title">{overlay.label}</strong>
              <p className="nde-annotation__note">{overlay.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
