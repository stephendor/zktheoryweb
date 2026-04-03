/**
 * ResponsiveContainer.tsx — Task 3.1 — Agent_Interactive_Core
 *
 * Render-prop container that tracks its own pixel dimensions via
 * ResizeObserver and passes `{ width, height }` to its children.
 *
 * SSR safety: ResizeObserver and getBoundingClientRect are browser-only
 * APIs. The measurement effect is guarded inside useEffect so it never
 * executes during Astro's build-time SSR pass. Until the component mounts
 * and measures client-side, `dimensions` is null and no children are
 * rendered (returning a sized-but-empty placeholder div instead).
 *
 * Usage:
 *   <ResponsiveContainer>
 *     {({ width, height }) => (
 *       <MySvgChart width={width} height={height} />
 *     )}
 *   </ResponsiveContainer>
 */

import { useState, useEffect, useRef } from 'react';
import type { VizDimensions } from './types';
import './ResponsiveContainer.css';

export interface ResponsiveContainerProps {
  /**
   * Render-prop child that receives the measured container dimensions.
   * Not called during SSR or before the first client-side measurement.
   */
  children: (dimensions: VizDimensions) => React.ReactNode;
  /** Optional CSS class applied to the outer wrapper div. */
  className?: string;
  /**
   * Minimum height in pixels applied to the wrapper while unmeasured
   * (SSR / first paint).  Prevents layout shift on hydration.
   * Defaults to 300.
   */
  minHeight?: number;
}

export function ResponsiveContainer({
  children,
  className,
  minHeight = 300,
}: ResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // null = not yet measured (SSR or pre-hydration).
  // Rendering children is deferred until we have real pixel values so that
  // D3 scales are never initialised with width=0 or NaN dimensions.
  const [dimensions, setDimensions] = useState<VizDimensions | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Take an immediate synchronous measurement so children render on the
    // first effect flush (no extra layout cycle).
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setDimensions({ width: Math.floor(width), height: Math.floor(height) });
    };

    measure();

    // ResizeObserver watches for subsequent container size changes
    // (e.g. viewport resize, sidebar toggle, font load).
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDimensions({ width: Math.floor(width), height: Math.floor(height) });
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`rc-wrapper${className ? ` ${className}` : ''}`}
      // CSS custom property supplies the dynamic pre-mount min-height.
      // data-measured clears min-height once real dimensions are available.
      style={{ '--rc-min-height': `${minHeight}px` } as React.CSSProperties}
      data-measured={dimensions !== null ? '' : undefined}
    >
      {/*
       * dimensions is null during SSR and before the first client-side
       * measurement — render nothing. The minHeight style above reserves
       * space so the page doesn't reflow when children appear.
       */}
      {dimensions !== null && children(dimensions)}
    </div>
  );
}
