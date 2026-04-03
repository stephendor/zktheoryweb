/**
 * FiltrationPlayground.tsx — Task 5.3 — Agent_Interactive_Advanced
 *
 * Step-through Vietoris-Rips filtration playground.
 * Shows balls growing, edges forming, and triangles filling — with live
 * Betti number annotations at each radius step.
 *
 * Architecture:
 *   FiltrationPlayground (parent)
 *     ├─ FiltrationPointCloudEditor  (left panel — PointCloudEditor maxPoints=50)
 *     └─ annotation panel            (right panel — Betti numbers + event log)
 *
 * Animation uses a ref-driven RAF loop (timestamp-based step advancement) so
 * the animation state never goes stale regardless of React render batching.
 *
 * A11y: AriaLiveRegion for step announcements; TextDescriptionToggle for prose.
 * Reduced-motion: animation controls are hidden; component locks to step mode.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

import { PointCloudEditor } from './PointCloudEditor';
import type { PointCloudEditorProps, ComplexOverlay } from './PointCloudEditor';
import { computeBettiNumbers } from '@lib/tda/bettiNumbers';
import { buildComplexFP, maxPairwiseDist, buildRadiusSteps } from '@lib/tda/filtrationUtils';
import type { Point2D } from '@lib/tda/vietorisRips';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import './FiltrationPlayground.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of evenly-spaced radius steps in the filtration sweep. */
const FILTRATION_STEPS = 60;

/** Milliseconds per step at 1× speed. 80ms × 60 steps ≈ 4.8 s total sweep. */
const STEP_DURATION_MS = 80;

/** Debounce delay for AriaLiveRegion announcements (ms). */
const ARIA_DEBOUNCE_MS = 200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopologicalEvent {
  id: number;
  message: string;
}

// ---------------------------------------------------------------------------
// FiltrationPointCloudEditor — thin wrapper providing the 50-point cap
// ---------------------------------------------------------------------------

function FiltrationPointCloudEditor(
  props: Omit<PointCloudEditorProps, 'maxPoints'>,
) {
  return <PointCloudEditor {...props} maxPoints={50} />;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FiltrationPlaygroundProps {
  /** Optional extra CSS class on the outer wrapper. */
  className?: string;
}

// ---------------------------------------------------------------------------
// FiltrationPlayground — main component
// ---------------------------------------------------------------------------

export function FiltrationPlayground({ className }: FiltrationPlaygroundProps) {
  // ── State ────────────────────────────────────────────────────────────────
  const [points, setPoints] = useState<Point2D[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<0.5 | 1 | 2>(1);
  /** 'step' = manual; 'continuous' = RAF animation active. */
  const [mode, setMode] = useState<'step' | 'continuous'>('step');
  const [liveMessage, setLiveMessage] = useState('');
  const [displayBetti, setDisplayBetti] = useState({ beta0: 0, beta1: 0, beta2: 0 });
  const [eventLog, setEventLog] = useState<TopologicalEvent[]>([]);

  const reducedMotion = useReducedMotion();

  // ── Derived values (useMemo) ──────────────────────────────────────────────
  const maxRadius = useMemo(() => maxPairwiseDist(points), [points]);

  const radiusSteps = useMemo(
    () => buildRadiusSteps(maxRadius, FILTRATION_STEPS),
    [maxRadius],
  );

  const currentRadius = useMemo(
    () => radiusSteps[currentStepIdx] ?? 0,
    [radiusSteps, currentStepIdx],
  );

  const currentComplex = useMemo(
    () => buildComplexFP(points, currentRadius),
    [points, currentRadius],
  );

  const bettiNumbers = useMemo(
    () => computeBettiNumbers(currentComplex),
    [currentComplex],
  );

  /** Complex overlay for the left-panel PointCloudEditor. */
  const complexOverlay = useMemo((): ComplexOverlay | undefined => {
    if (points.length === 0) return undefined;
    const edges = currentComplex
      .filter((s) => s.dimension === 1)
      .map((s) => [s.vertices[0], s.vertices[1]] as [string, string]);
    const triangles = currentComplex
      .filter((s) => s.dimension === 2)
      .map((s) => [s.vertices[0], s.vertices[1], s.vertices[2]] as [string, string, string]);
    return { edges, triangles, radius: currentRadius };
  }, [currentComplex, currentRadius, points.length]);

  // ── Animation refs ────────────────────────────────────────────────────────
  /** Ref mirrors currentStepIdx for synchronous access in RAF callbacks. */
  const currentStepIdxRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const lastStepTimeRef = useRef<number | null>(null);
  const speedMultiplierRef = useRef(speedMultiplier);

  // Keep speedMultiplierRef in sync without adding it as animate dep.
  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const ariaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Betti counter animation ref
  const bettiAnimRef = useRef<number | null>(null);

  // Event log detection refs
  const prevBettiRef = useRef({ beta0: 0, beta1: 0, beta2: 0 });
  const prevTriangleCountRef = useRef(0);
  const prevPointsRef = useRef<Point2D[]>([]);
  const eventIdRef = useRef(0);

  // ── Animation callbacks ───────────────────────────────────────────────────

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isPlayingRef.current = false;
    lastStepTimeRef.current = null;
    setIsPlaying(false);
    setMode('step');
  }, []);

  /**
   * Core RAF callback. All mutable state is accessed via refs to avoid
   * stale-closure issues. The function is created once (empty deps) and
   * remains stable for the component's lifetime.
   */
  const animate = useCallback((ts: number) => {
    if (!isPlayingRef.current) return;

    if (lastStepTimeRef.current === null) lastStepTimeRef.current = ts;

    const msPerStep = STEP_DURATION_MS / speedMultiplierRef.current;

    if (ts - lastStepTimeRef.current >= msPerStep) {
      lastStepTimeRef.current = ts;
      const nextIdx = currentStepIdxRef.current + 1;

      if (nextIdx >= FILTRATION_STEPS - 1) {
        // Reached last step — stop and settle.
        currentStepIdxRef.current = FILTRATION_STEPS - 1;
        setCurrentStepIdx(FILTRATION_STEPS - 1);
        isPlayingRef.current = false;
        setIsPlaying(false);
        setMode('step');
        return;
      }

      currentStepIdxRef.current = nextIdx;
      setCurrentStepIdx(nextIdx);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []); // intentionally empty: all mutable state via refs

  const startAnimation = useCallback(() => {
    if (reducedMotion || isPlayingRef.current) return;
    lastStepTimeRef.current = null;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setMode('continuous');
    animFrameRef.current = requestAnimationFrame(animate);
  }, [reducedMotion, animate]);

  // Lock to step mode if OS reduced-motion preference is active.
  useEffect(() => {
    if (reducedMotion && isPlayingRef.current) stopAnimation();
  }, [reducedMotion, stopAnimation]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      if (bettiAnimRef.current !== null) cancelAnimationFrame(bettiAnimRef.current);
      if (ariaDebounceRef.current) clearTimeout(ariaDebounceRef.current);
    };
  }, []);

  // Reset step index whenever the point cloud changes.
  useEffect(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isPlayingRef.current = false;
    lastStepTimeRef.current = null;
    setIsPlaying(false);
    setMode('step');
    currentStepIdxRef.current = 0;
    setCurrentStepIdx(0);
    setEventLog([]);
  }, [points]);

  // AriaLiveRegion announcements — debounced to avoid flooding screen readers.
  useEffect(() => {
    if (ariaDebounceRef.current) clearTimeout(ariaDebounceRef.current);
    ariaDebounceRef.current = setTimeout(() => {
      if (points.length > 0) {
        setLiveMessage(
          `Step ${currentStepIdx + 1} of ${FILTRATION_STEPS}. ` +
            `Radius ${currentRadius.toFixed(2)}. ` +
            `β₀\u202f=\u202f${bettiNumbers.beta0} component${bettiNumbers.beta0 !== 1 ? 's' : ''}, ` +
            `β₁\u202f=\u202f${bettiNumbers.beta1} loop${bettiNumbers.beta1 !== 1 ? 's' : ''}.`,
        );
      }
    }, ARIA_DEBOUNCE_MS);
    return () => {
      if (ariaDebounceRef.current) clearTimeout(ariaDebounceRef.current);
    };
  }, [currentStepIdx, currentRadius, bettiNumbers, points.length]);

  // ── Control handlers ──────────────────────────────────────────────────────

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      stopAnimation();
      const val = parseInt(e.target.value, 10);
      currentStepIdxRef.current = val;
      setCurrentStepIdx(val);
    },
    [stopAnimation],
  );

  const handleStepBack = useCallback(() => {
    stopAnimation();
    setCurrentStepIdx((prev) => {
      const next = Math.max(0, prev - 1);
      currentStepIdxRef.current = next;
      return next;
    });
  }, [stopAnimation]);

  const handleStepForward = useCallback(() => {
    stopAnimation();
    setCurrentStepIdx((prev) => {
      const next = Math.min(FILTRATION_STEPS - 1, prev + 1);
      currentStepIdxRef.current = next;
      return next;
    });
  }, [stopAnimation]);

  const handleReset = useCallback(() => {
    stopAnimation();
    currentStepIdxRef.current = 0;
    setCurrentStepIdx(0);
  }, [stopAnimation]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopAnimation();
    } else {
      // If already at the last step, restart from 0.
      if (currentStepIdx >= FILTRATION_STEPS - 1) {
        currentStepIdxRef.current = 0;
        setCurrentStepIdx(0);
      }
      startAnimation();
    }
  }, [isPlaying, stopAnimation, startAnimation, currentStepIdx]);

  // ── Prose description for TextDescriptionToggle ───────────────────────────

  const textDescription = useMemo(() => {
    const V = currentComplex.filter((s) => s.dimension === 0).length;
    const E = currentComplex.filter((s) => s.dimension === 1).length;
    const T = currentComplex.filter((s) => s.dimension === 2).length;
    return (
      `${points.length} point${points.length !== 1 ? 's' : ''} in the cloud. ` +
      `Step ${currentStepIdx + 1} of ${FILTRATION_STEPS}. ` +
      `Current filtration radius: ${currentRadius.toFixed(3)} (maximum ${maxRadius.toFixed(3)}). ` +
      `Simplicial complex: ${V} vertices, ${E} edges, ${T} triangles. ` +
      `\u03b2\u2080 = ${bettiNumbers.beta0} connected component${bettiNumbers.beta0 !== 1 ? 's' : ''}, ` +
      `\u03b2\u2081 = ${bettiNumbers.beta1} loop${bettiNumbers.beta1 !== 1 ? 's' : ''}, ` +
      `\u03b2\u2082 = ${bettiNumbers.beta2} void${bettiNumbers.beta2 !== 1 ? 's' : ''}.`
    );
  }, [
    points.length,
    currentStepIdx,
    currentRadius,
    maxRadius,
    currentComplex,
    bettiNumbers,
  ]);

  // ── Animated Betti counters ───────────────────────────────────────────────
  useEffect(() => {
    if (bettiAnimRef.current !== null) {
      cancelAnimationFrame(bettiAnimRef.current);
      bettiAnimRef.current = null;
    }

    if (!reducedMotion) {
      const target = bettiNumbers;

      const step = () => {
        setDisplayBetti((prev) => {
          const next = {
            beta0:
              prev.beta0 < target.beta0
                ? prev.beta0 + 1
                : prev.beta0 > target.beta0
                ? prev.beta0 - 1
                : prev.beta0,
            beta1:
              prev.beta1 < target.beta1
                ? prev.beta1 + 1
                : prev.beta1 > target.beta1
                ? prev.beta1 - 1
                : prev.beta1,
            beta2: 0,
          };
          const done = next.beta0 === target.beta0 && next.beta1 === target.beta1;
          if (!done) {
            bettiAnimRef.current = requestAnimationFrame(step);
          } else {
            bettiAnimRef.current = null;
          }
          return next;
        });
      };

      bettiAnimRef.current = requestAnimationFrame(step);
    } else {
      setDisplayBetti(bettiNumbers);
    }

    return () => {
      if (bettiAnimRef.current !== null) {
        cancelAnimationFrame(bettiAnimRef.current);
        bettiAnimRef.current = null;
      }
    };
  }, [bettiNumbers, reducedMotion]);

  // ── Topological event detection ───────────────────────────────────────────
  useEffect(() => {
    const currTriangles = currentComplex.filter((s) => s.dimension === 2).length;

    // On reset (step 0) or after a point-cloud change, sync prev refs without adding events.
    if (currentStepIdx === 0 || prevPointsRef.current !== points) {
      prevPointsRef.current = points;
      prevBettiRef.current = { ...bettiNumbers };
      prevTriangleCountRef.current = currTriangles;
      return;
    }

    const prev = prevBettiRef.current;
    const prevTriangles = prevTriangleCountRef.current;
    const newEvents: TopologicalEvent[] = [];

    if (bettiNumbers.beta0 < prev.beta0) {
      newEvents.push({
        id: ++eventIdRef.current,
        message: `Component merged at r\u202f=\u202f${currentRadius.toFixed(2)}`,
      });
    }
    if (bettiNumbers.beta1 > prev.beta1) {
      newEvents.push({
        id: ++eventIdRef.current,
        message: `Loop born at r\u202f=\u202f${currentRadius.toFixed(2)}`,
      });
    }
    if (bettiNumbers.beta1 < prev.beta1) {
      newEvents.push({
        id: ++eventIdRef.current,
        message: `Loop filled at r\u202f=\u202f${currentRadius.toFixed(2)}`,
      });
    }
    if (currTriangles > prevTriangles) {
      newEvents.push({
        id: ++eventIdRef.current,
        message: `Triangle (2-simplex) filled at r\u202f=\u202f${currentRadius.toFixed(2)}`,
      });
    }

    if (newEvents.length > 0) {
      setEventLog((prev) => [...newEvents, ...prev].slice(0, 5));
    }

    prevPointsRef.current = points;
    prevBettiRef.current = { ...bettiNumbers };
    prevTriangleCountRef.current = currTriangles;
  }, [currentStepIdx, bettiNumbers, currentRadius, currentComplex, points]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`fp-wrapper${className ? ` ${className}` : ''}`}>
      <TextDescriptionToggle description={textDescription}>
        <div className="fp-panels">
          {/* Left panel: editable point cloud with live complex overlay */}
          <div className="fp-panel fp-panel--left">
            <h3 className="fp-panel-label">Point Cloud</h3>
            <FiltrationPointCloudEditor
              onPointsChange={setPoints}
              complexOverlay={complexOverlay}
            />
          </div>

          {/* Right panel: Betti numbers + event log + module links */}
          <div className="fp-panel fp-panel--right">
            <h3 className="fp-panel-label">Topological Features</h3>

            {/* Betti number display — animated counters */}
            <div className="fp-betti-display">
              <div className="fp-betti-item">
                <span
                  className="fp-betti-value"
                  aria-label={`Beta zero: ${bettiNumbers.beta0}`}
                >
                  {displayBetti.beta0}
                </span>
                <span className="fp-betti-label">Connected components (β₀)</span>
              </div>
              <div className="fp-betti-item">
                <span
                  className="fp-betti-value"
                  aria-label={`Beta one: ${bettiNumbers.beta1}`}
                >
                  {displayBetti.beta1}
                </span>
                <span className="fp-betti-label">Loops (β₁)</span>
              </div>
              <div className="fp-betti-item">
                <span
                  className="fp-betti-value"
                  aria-label={`Beta two: ${bettiNumbers.beta2}`}
                >
                  {displayBetti.beta2}
                </span>
                <span className="fp-betti-label">Voids (β₂)</span>
              </div>
            </div>

            {/* Feature event log */}
            <div
              className="fp-event-log"
              role="log"
              aria-label="Topological event log"
              aria-live="off"
            >
              <p className="fp-event-log__heading">Recent events</p>
              {eventLog.length === 0 ? (
                <p className="fp-event-log__empty">
                  Events will appear as the filtration grows.
                </p>
              ) : (
                <ul className="fp-event-log__list">
                  {eventLog.map((evt, i) => (
                    <li
                      key={evt.id}
                      className={`fp-event-item${i === 0 ? ' fp-event-item--recent' : ' fp-event-item--muted'}`}
                    >
                      {evt.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Module links */}
            <div className="fp-module-links">
              <p className="fp-module-links__label">Learn more:</p>
              <ul className="fp-module-links__list">
                <li>
                  <a
                    href="/learn/topology-social-scientists#module-3"
                    className="fp-module-link"
                  >
                    Path 1: Module 3 — Simplicial Complexes
                  </a>
                </li>
                <li>
                  <a
                    href="/learn/topology-social-scientists#module-4"
                    className="fp-module-link"
                  >
                    Path 1: Module 4 — Homology: Counting Holes
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="fp-controls" aria-label="Filtration controls">

          {/* Radius slider */}
          <div className="fp-slider-row">
            <label htmlFor="fp-slider" className="fp-control-label">
              Step
            </label>
            <input
              id="fp-slider"
              type="range"
              className="fp-slider"
              min={0}
              max={FILTRATION_STEPS - 1}
              step={1}
              value={currentStepIdx}
              onChange={handleSliderChange}
              aria-label="Filtration radius step"
              aria-valuetext={`Step ${currentStepIdx + 1} of ${FILTRATION_STEPS}. Radius ${currentRadius.toFixed(3)} of ${maxRadius.toFixed(3)}`}
            />
            <span className="fp-radius-value" aria-hidden="true">
              r&thinsp;=&thinsp;{currentRadius.toFixed(3)}
            </span>
          </div>

          {/* Animation controls — hidden when prefers-reduced-motion is active */}
          {!reducedMotion && (
            <div className="fp-anim-row">
              <button
                className="fp-btn"
                type="button"
                onClick={handleReset}
                disabled={currentStepIdx === 0}
                aria-label="Reset filtration to step 0"
              >
                ↺&thinsp;Reset
              </button>

              <button
                className="fp-btn"
                type="button"
                onClick={handleStepBack}
                disabled={currentStepIdx === 0 || isPlaying}
                aria-label="Step back one filtration step"
              >
                ◀&thinsp;Back
              </button>

              <button
                className="fp-btn fp-btn--play"
                type="button"
                onClick={handlePlayPause}
                disabled={points.length === 0}
                aria-label={isPlaying ? 'Pause filtration animation' : 'Play filtration animation'}
              >
                {isPlaying ? '⏸\u2009Pause' : '▶\u2009Play'}
              </button>

              <button
                className="fp-btn"
                type="button"
                onClick={handleStepForward}
                disabled={currentStepIdx >= FILTRATION_STEPS - 1 || isPlaying}
                aria-label="Step forward one filtration step"
              >
                Forward&thinsp;▶
              </button>

              <label className="fp-control-label" htmlFor="fp-speed">
                Speed
              </label>
              <select
                id="fp-speed"
                className="fp-select"
                value={speedMultiplier}
                onChange={(e) =>
                  setSpeedMultiplier(parseFloat(e.target.value) as 0.5 | 1 | 2)
                }
                aria-label="Animation speed multiplier"
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </div>
          )}

          {reducedMotion && (
            <p className="fp-reduced-motion-note">
              Animation controls hidden. Use the step slider to explore the filtration.
            </p>
          )}
        </div>
      </TextDescriptionToggle>

      <AriaLiveRegion message={liveMessage} />
    </div>
  );
}
