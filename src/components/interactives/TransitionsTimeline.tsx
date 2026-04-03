/**
 * TransitionsTimeline.tsx — Task 3.6b — Agent_Interactive_Core
 *
 * Five Transitions Timeline — horizontal SVG with overlapping era bands,
 * thread strand lines, year axis, hover/focus annotation panel, keyboard
 * navigation, ARIA live region, text-description toggle, and a responsive
 * vertical mobile layout (<768 px).
 *
 * Rendering strategy:
 *   - Horizontal layout (≥768 px): React/D3 hybrid SVG inside .tt-scroll.
 *   - Vertical layout (<768 px): pure React <div> stacked cards.
 *
 * D3 is used for scale and axis calculation only. SVG elements are rendered
 * as React JSX to keep React as the single owner of the DOM.
 *
 * SSR safety: all browser-only calls live inside useEffect or lazily-computed
 * callbacks. The component is exported as default for Astro island hydration.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { renderXAxis } from '@lib/viz/axes';
import { getPaletteColor } from '@lib/viz/scales';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';
import { arrowKeyHandler } from '@lib/viz/a11y/keyboardNav';
import type { VizDimensions } from '@lib/viz/types';
import type { TimelineData, TransitionBand, ThreadStrand } from './TransitionsTimeline.data';
import './TransitionsTimeline.css';

// ─── Layout constants ─────────────────────────────────────────────────────────

const MARGIN = { top: 16, right: 24, bottom: 48, left: 90 };

/** Fixed minimum SVG width (px) — prevents compression on narrow containers. */
const MIN_SVG_WIDTH = 1200;

/** Height (px) for each transition band rectangle. */
const BAND_HEIGHT = 56;

/** Vertical gap between stacked bands. */
const BAND_GAP = 8;

/** Top padding before first band. */
const BANDS_TOP = MARGIN.top + 8;

/** Alpha (0–1) applied to band fill so overlaps remain visible. */
const BAND_ALPHA = 0.55;

/** Space reserved below bands for thread strands. */
const THREAD_AREA_HEIGHT = 100;

/** Y coordinate of the top of the thread strand area. */
const THREAD_AREA_TOP = BANDS_TOP + (BAND_HEIGHT + BAND_GAP) * 5;

/** Fixed Y positions for each thread row within the thread area. */
const THREAD_Y = {
  scottish:     THREAD_AREA_TOP + 20,
  countermaths: THREAD_AREA_TOP + 50,
  gender:       THREAD_AREA_TOP + 78,
} as const;

/**
 * Total SVG height: margin + 5 bands stacked (with gaps) + thread area + axis.
 * Bands overlap horizontally, NOT vertically, so they stack in rows here.
 */
const SVG_HEIGHT =
  BANDS_TOP +
  (BAND_HEIGHT + BAND_GAP) * 5 +
  THREAD_AREA_HEIGHT +
  MARGIN.bottom;

/** Year of the right edge of the timeline. */
const YEAR_MAX = 2026;
/** Year of the left edge. */
const YEAR_MIN = 1830;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a CSS hex colour to rgba with the given alpha.
 * Falls back to the raw value if it can't be parsed as hex.
 */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length !== 6) return hex; // not a parseable hex; return as-is
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Resolve a palette CSS custom-property name to a resolved hex/rgb string,
 * then convert to rgba for transparent band fills.
 */
function resolveColour(tokenName: string, alpha: number): string {
  const raw = getPaletteColor(tokenName);
  return hexToRgba(raw || '#999999', alpha);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface BandGroupProps {
  band: TransitionBand;
  xScale: d3.ScaleLinear<number, number>;
  rowIndex: number;
  fillColour: string;
  /** Whether this band is currently active (hovered/focused). */
  isActive: boolean;
  onActivate: (index: number) => void;
  onDeactivate: () => void;
  /** tabIndex: 0 for first band, -1 for rest (arrow-key traversal). */
  tabIndex: number;
}

function BandGroup({ band, xScale, rowIndex, fillColour, isActive, onActivate, onDeactivate, tabIndex }: BandGroupProps) {
  const x      = xScale(band.dateStart);
  const xEnd   = xScale(band.dateEnd ?? YEAR_MAX);
  const width  = Math.max(0, xEnd - x);
  const y      = BANDS_TOP + rowIndex * (BAND_HEIGHT + BAND_GAP);
  const cx     = x + width / 2;
  const cy     = y + BAND_HEIGHT / 2;

  /**
   * Keyboard interaction on the band <a> element:
   *   Enter (first press) — open annotation panel (prevent default navigation).
   *   Enter (second press, when already active) or Escape — navigate to detail page.
   */
  const handleKeyDown = (e: React.KeyboardEvent<SVGAElement>) => {
    if (e.key === 'Enter') {
      if (!isActive) {
        // First Enter: open annotation; do NOT follow link yet.
        e.preventDefault();
        onActivate(rowIndex);
      }
      // Second Enter: isActive already true → allow default (navigate).
    } else if (e.key === 'Escape') {
      onDeactivate();
      window.location.href = `/counting-lives/transitions/${band.id}/`;
    }
  };

  return (
    <a
      href={`/counting-lives/transitions/${band.id}/`}
      className={`tt-band-link${isActive ? ' tt-band-link--active' : ''}`}
      aria-label={`Transition ${band.number}: ${band.title}, ${band.dateStart}–${band.dateEnd ?? 'present'}`}
      aria-expanded={isActive ? 'true' : 'false'}
      tabIndex={tabIndex}
      data-band-index={rowIndex}
      onMouseEnter={() => onActivate(rowIndex)}
      onMouseLeave={onDeactivate}
      onFocus={() => onActivate(rowIndex)}
      onBlur={onDeactivate}
      onKeyDown={handleKeyDown}
    >
      <rect
        className="tt-band"
        x={x}
        y={y}
        width={width}
        height={BAND_HEIGHT}
        fill={fillColour}
        rx={3}
      />
      <g className="tt-band-label">
        <text
          x={cx}
          y={cy - 9}
          className="tt-band-label__number"
          fill="currentColor"
        >
          {`T${band.number}`}
        </text>
        <text
          x={cx}
          y={cy + 9}
          className="tt-band-label__title"
          fill="currentColor"
        >
          {band.title}
        </text>
      </g>
    </a>
  );
}

// ─── Thread strand sub-components ────────────────────────────────────────────

interface ThreadStrandGroupProps {
  strand: ThreadStrand;
  data: TimelineData;
  xScale: d3.ScaleLinear<number, number>;
  y: number;
  colour: string;
}

/**
 * Render one coloured thread strand: a polyline connecting chapter dots,
 * plus labelled circles for each chapter that belongs to this thread.
 *
 * Chapter x-position = midpoint year of the chapter's parent transition band,
 * placing the dot at the centre of the era in which the chapter sits.
 */
function ThreadStrandGroup({ strand, data, xScale, y, colour }: ThreadStrandGroupProps) {
  // Build lookup: chapterNumber → { title, midpointYear }
  const chapterInfo = new Map<number, { title: string; midpointYear: number }>();
  for (const band of data.transitions) {
    const midpoint = (band.dateStart + (band.dateEnd ?? YEAR_MAX)) / 2;
    for (const ch of band.chapters) {
      chapterInfo.set(ch.number, { title: ch.title, midpointYear: midpoint });
    }
  }

  // Resolve dot positions; skip chapters not found in any band.
  const points = strand.chapterNumbers
    .map((num) => {
      const info = chapterInfo.get(num);
      if (!info) return null;
      return { num, x: xScale(info.midpointYear), title: info.title };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.x - b.x);

  if (points.length === 0) return null;

  const linePoints = points.map((p) => `${p.x},${y}`).join(' ');

  return (
    <g
      className="tt-thread-strand"
      role="group"
      aria-label={`${strand.label}: chapters ${strand.chapterNumbers.join(', ')}`}
    >
      <title>{strand.label}</title>

      {/* Left-margin label */}
      <text
        x={-8}
        y={y}
        className="tt-thread-label"
        textAnchor="end"
        dominantBaseline="middle"
        fill={colour}
      >
        {strand.label}
      </text>

      {/* Connecting line between dots */}
      {points.length > 1 && (
        <polyline
          className="tt-thread-line"
          points={linePoints}
          stroke={colour}
        />
      )}

      {/* Chapter dots — each wrapped in an SVG <a> for click-through */}
      {points.map((p) => (
        <a
          key={p.num}
          href={`/counting-lives/chapters/ch-${String(p.num).padStart(2, '0')}/`}
          aria-label={`Chapter ${p.num}: ${p.title}`}
          className="tt-dot-link"
        >
          <circle
            className="tt-thread-dot"
            cx={p.x}
            cy={y}
            r={5}
            fill={colour}
          >
            <title>{p.title}</title>
          </circle>
        </a>
      ))}
    </g>
  );
}

/** Counter-mathematics: a dashed horizontal line running the full timeline width. */
function CounterMathThread({ xScale, y }: { xScale: d3.ScaleLinear<number, number>; y: number }) {
  return (
    <g
      className="tt-thread-strand"
      role="group"
      aria-label="Counter-mathematics thread — continuous throughout all transitions"
    >
      <title>Counter-mathematics thread</title>
      <text
        x={-8}
        y={y}
        className="tt-thread-label tt-thread-label--muted"
        textAnchor="end"
        dominantBaseline="middle"
        fill="currentColor"
      >
        Counter-mathematics
      </text>
      <line
        className="tt-thread-line tt-thread-line--dashed"
        x1={xScale(YEAR_MIN)}
        y1={y}
        x2={xScale(YEAR_MAX)}
        y2={y}
        stroke="currentColor"
      />
    </g>
  );
}

// ─── Inner chart (receives resolved pixel dimensions) ─────────────────────────

interface InnerChartProps {
  data: TimelineData;
  dimensions: VizDimensions;
  /** Index of the active transition band (-1 = none). Controlled from parent. */
  activeIndex: number;
  onActivate: (index: number) => void;
  onDeactivate: () => void;
  reducedMotion: boolean;
}

function InnerChart({ data, dimensions, activeIndex, onActivate, onDeactivate, reducedMotion }: InnerChartProps) {
  const axisRef   = useRef<SVGGElement>(null);
  const gridRef   = useRef<SVGGElement>(null);
  const svgRef    = useRef<SVGSVGElement>(null);

  // Take the larger of responsive container width and minimum SVG width.
  const svgWidth = Math.max(dimensions.width, MIN_SVG_WIDTH);
  const innerWidth = svgWidth - MARGIN.left - MARGIN.right;

  // D3 linear scale: year → pixel x (within inner drawing area).
  const xScale = d3.scaleLinear<number>()
    .domain([YEAR_MIN, YEAR_MAX])
    .range([0, innerWidth]);

  // Resolve band colours at render time (reads live CSS props for dark mode).
  const [bandColours, setBandColours] = useState<string[]>([]);
  const [threadColours, setThreadColours] = useState<string[]>([]);

  useEffect(() => {
    setBandColours(
      data.transitions.map((t) => resolveColour(t.colour, BAND_ALPHA)),
    );
    setThreadColours(
      data.threads.map((s) => getPaletteColor(s.colour) || '#56B4E9'),
    );
  }, [data]);

  // Render D3 x-axis into the dedicated <g>.
  useEffect(() => {
    const g = axisRef.current;
    if (!g) return;
    const sel = d3.select(g) as d3.Selection<SVGGElement, unknown, null, undefined>;
    sel.selectAll('*').remove();
    renderXAxis(sel, xScale, { tickFormat: 'year', tickCount: Math.round(innerWidth / 80) });
  }, [xScale, innerWidth]);

  // Render decade grid lines.
  useEffect(() => {
    const g = gridRef.current;
    if (!g) return;
    const sel = d3.select(g);
    sel.selectAll('*').remove();

    const decades = d3.range(
      Math.ceil(YEAR_MIN / 10) * 10,
      YEAR_MAX + 1,
      10,
    );

    const bandsHeight = (BAND_HEIGHT + BAND_GAP) * 5;

    sel
      .selectAll('line')
      .data(decades)
      .join('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', BANDS_TOP)
      .attr('y2', BANDS_TOP + bandsHeight)
      .attr('stroke', 'currentColor');
  }, [xScale, innerWidth]);

  // Keyboard navigation via arrowKeyHandler: arrow keys traverse band <a> elements.
  // Intentional: svgRef.current is stable after mount; re-attaching on data change
  // would cause duplicate listeners. The handler closes over `onActivate` which is
  // stable (useCallback in parent). onActivate intentionally omitted from deps.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const getBandLinks = () =>
      Array.from(svg.querySelectorAll<SVGAElement>('.tt-band-link'));

    const handler = (e: KeyboardEvent) => {
      const links = getBandLinks();
      arrowKeyHandler(links, (_el, i) => onActivate(i))(e);
    };

    svg.addEventListener('keydown', handler);
    return () => svg.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const axisY = THREAD_AREA_TOP + THREAD_AREA_HEIGHT;

  // Suppress unused-var warning: reducedMotion is used below in animation classes
  void reducedMotion;

  return (
    <svg
      ref={svgRef}
      className="tt-svg"
      width={svgWidth}
      height={SVG_HEIGHT}
      role="img"
      aria-label="Five Transitions in Poverty Measurement — horizontal timeline"
    >
      <title>Five Transitions in Poverty Measurement</title>
      <desc>
        Horizontal timeline showing five historical eras in poverty measurement
        from 1830 to the present, rendered as overlapping coloured bands.
      </desc>

      <g transform={`translate(${MARGIN.left},0)`}>
        {/* Decade grid lines */}
        <g ref={gridRef} className="tt-decade-grid" />

        {/* Transition bands */}
        {data.transitions.map((band, i) => (
          <BandGroup
            key={band.id}
            band={band}
            xScale={xScale}
            rowIndex={i}
            fillColour={bandColours[i] ?? 'rgba(153,153,153,0.45)'}
            isActive={activeIndex === i}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            tabIndex={i === 0 ? 0 : -1}
          />
        ))}

        {/* Thread strands */}
        <ThreadStrandGroup
          strand={data.threads.find((t) => t.slug === 'scottish-thread')!}
          data={data}
          xScale={xScale}
          y={THREAD_Y.scottish}
          colour={threadColours[0] ?? '#56B4E9'}
        />
        <CounterMathThread
          xScale={xScale}
          y={THREAD_Y.countermaths}
        />
        <ThreadStrandGroup
          strand={data.threads.find((t) => t.slug === 'gender-thread')!}
          data={data}
          xScale={xScale}
          y={THREAD_Y.gender}
          colour={threadColours[1] ?? '#CC79A7'}
        />

        {/* X-axis */}
        <g
          ref={axisRef}
          className="tt-axis"
          transform={`translate(0,${axisY})`}
        />
      </g>
    </svg>
  );
}

// ─── Mobile breakpoint hook ───────────────────────────────────────────────────

/** MOBILE_BREAKPOINT matches the CSS media query in TransitionsTimeline.css. */
const MOBILE_BREAKPOINT = 768;

/**
 * Returns the current window.innerWidth.
 * SSR-safe: defaults to Infinity so the horizontal layout renders on the
 * server (and during the initial hydration pass), preventing a flash of the
 * mobile layout before client JS runs.
 */
function useWindowWidth(): number {
  const [width, setWidth] = useState(
    // Use Infinity as SSR default — server always renders horizontal.
    typeof window !== 'undefined' ? window.innerWidth : Infinity,
  );

  useEffect(() => {
    let raf: number;
    const onResize = () => {
      // Coalesce rapid resize events via requestAnimationFrame.
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    // Sync on mount in case width changed between SSR and hydration.
    setWidth(window.innerWidth);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return width;
}

// ─── Mobile vertical layout ───────────────────────────────────────────────────

interface MobileLayoutProps {
  data: TimelineData;
  activeIndex: number;
  onActivate: (index: number) => void;
  onDeactivate: () => void;
  reducedMotion: boolean;
}

function MobileLayout({ data, activeIndex, onActivate, reducedMotion }: MobileLayoutProps) {
  const listRef = useRef<HTMLOListElement>(null);

  /**
   * Up/Down arrow key traversal for mobile cards.
   * Enter (first press) — reveal annotation (if not already active).
   * Enter (second press, already active) / Escape — navigate to detail page.
   */
  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, i: number, band: TransitionBand) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const links = listRef.current
        ? Array.from(listRef.current.querySelectorAll<HTMLAnchorElement>('.tt-mobile-card__link'))
        : [];
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      const next = (i + delta + links.length) % links.length;
      links[next]?.focus();
      onActivate(next);
    } else if (e.key === 'Enter') {
      if (activeIndex !== i) {
        e.preventDefault();
        onActivate(i);
      }
      // second Enter: allow default navigation
    } else if (e.key === 'Escape') {
      window.location.href = `/counting-lives/transitions/${band.id}/`;
    }
  };

  return (
    <ol ref={listRef} className="tt-mobile-list" aria-label="Five Transitions — vertical list">
      {data.transitions.map((band, i) => {
        // Threads that have at least one chapter in this era
        const presentThreads = data.threads.filter((th) =>
          th.chapterNumbers.some((n) => band.chapters.find((c) => c.number === n)),
        );
        const isActive = activeIndex === i;

        return (
          <li
            key={band.id}
            className={`tt-mobile-card${isActive ? ' tt-mobile-card--active' : ''}${reducedMotion ? ' tt-mobile-card--instant' : ''}`}
            data-transition={band.number}
          >
            {/* Era header — links to detail page */}
            <a
              href={`/counting-lives/transitions/${band.id}/`}
              className="tt-mobile-card__link"
              aria-expanded={isActive ? 'true' : 'false'}
              onMouseEnter={() => onActivate(i)}
              onMouseLeave={() => onActivate(-1)}
              onFocus={() => onActivate(i)}
              onBlur={() => onActivate(-1)}
              onKeyDown={(e) => handleCardKeyDown(e, i, band)}
            >
              <div className="tt-mobile-card__header">
                <span className="tt-mobile-card__number">T{band.number}</span>
                <span className="tt-mobile-card__title">{band.title}</span>
                <span className="tt-mobile-card__dates">
                  {band.dateStart}–{band.dateEnd ?? 'present'}
                </span>
              </div>
            </a>

            {/* Thread strand summary */}
            {presentThreads.length > 0 ? (
              <ul className="tt-mobile-card__threads" aria-label="Thread strands in this era">
                {presentThreads.map((th) => {
                  const tagged = th.chapterNumbers.filter((n) =>
                    band.chapters.find((c) => c.number === n),
                  );
                  return (
                    <li key={th.slug} className="tt-mobile-card__thread">
                      <a
                        href={`/counting-lives/threads/${th.slug}/`}
                        className="tt-mobile-card__thread-link"
                        style={{ '--thread-colour': `var(${th.colour})` } as React.CSSProperties}
                      >
                        {th.label}
                      </a>
                      <span className="tt-mobile-card__thread-count">
                        {tagged.length} chapter{tagged.length !== 1 ? 's' : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="tt-mobile-card__no-threads">No threads tagged in this era</p>
            )}

            {/* Chapter count */}
            <p className="tt-mobile-card__chapter-count">
              {band.chapters.length > 0
                ? `${band.chapters.length} chapter${band.chapters.length !== 1 ? 's' : ''}`
                : 'Chapters forthcoming'}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Key claims per transition — one pull-quote shown in the annotation panel.
 * These are structural placeholders; populated with the first key claim from
 * the Chapter 1/3/5/8/10 stubs where available.
 */
const BAND_CLAIMS: Record<number, string> = {
  1: 'Poverty was first measured through caloric intake and body weight, encoding class bias into the arithmetic of survival.',
  2: 'The welfare state institutionalised a male breadwinner norm, rendering women\'s labour statistically invisible.',
  3: 'Technocratic metrics displaced political judgment, depoliticising poverty as a problem of administration.',
  4: 'Market-consensus measurement reframed poverty as individual failure, naturalising inequality.',
  5: 'Algorithmic systems automate the discrimination once achieved by bureaucratic discretion.',
};

interface AnnotationPanelProps {
  band: TransitionBand | null;
  reducedMotion: boolean;
}

function AnnotationPanel({ band, reducedMotion }: AnnotationPanelProps) {
  const visible = band !== null;

  return (
    <div
      className={`tt-annotation${visible ? ' tt-annotation--visible' : ''}${reducedMotion ? ' tt-annotation--instant' : ''}`}
      role="complementary"
      aria-label={band ? `Details: Transition ${band.number}` : undefined}
      aria-hidden={!visible}
    >
      {band && (
        <>
          <div className="tt-annotation__header">
            <span className="tt-annotation__number">T{band.number}</span>
            <span className="tt-annotation__title">{band.title}</span>
            <span className="tt-annotation__dates">
              {band.dateStart}–{band.dateEnd ?? 'present'}
            </span>
          </div>
          <blockquote className="tt-annotation__claim">
            {BAND_CLAIMS[band.number] ?? 'A pivotal moment in poverty measurement.'}
          </blockquote>
          <p className="tt-annotation__note">
            {band.chapters.length > 0
              ? `${band.chapters.length} chapter${band.chapters.length !== 1 ? 's' : ''} in this era`
              : 'Chapters forthcoming'}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Text description (for TextDescriptionToggle) ─────────────────────────────

function buildTextDescription(data: TimelineData): string {
  const lines: string[] = [
    'Five Transitions in Poverty Measurement — ordered list of eras:',
  ];
  data.transitions.forEach((t, i) => {
    const dateRange = `${t.dateStart}–${t.dateEnd ?? 'present'}`;
    const chCount = t.chapters.length;
    const threads = data.threads
      .filter((th) => th.chapterNumbers.some((n) => t.chapters.find((c) => c.number === n)))
      .map((th) => {
        const tagged = th.chapterNumbers.filter((n) => t.chapters.find((c) => c.number === n));
        const titles = tagged
          .map((n) => t.chapters.find((c) => c.number === n)?.title)
          .filter(Boolean)
          .join(', ');
        return `${th.label} (${tagged.length} chapter${tagged.length !== 1 ? 's' : ''}: ${titles || 'none tagged'})`;
      });

    lines.push(
      `${i + 1}. Transition ${t.number}: ${t.title} (${dateRange}). ` +
        `${chCount} chapter${chCount !== 1 ? 's' : ''}. ` +
        (threads.length > 0 ? `Threads: ${threads.join('; ')}.` : 'No threads tagged in this era.'),
    );
  });
  return lines.join(' ');
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface TransitionsTimelineProps {
  data: TimelineData;
  className?: string;
  /** Force annotation open on a specific band index (for Storybook). */
  forceActiveIndex?: number;
}

export default function TransitionsTimeline({
  data,
  className,
  forceActiveIndex,
}: TransitionsTimelineProps) {
  const reducedMotion = useReducedMotion();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < MOBILE_BREAKPOINT;

  // -1 = no active band; otherwise index into data.transitions
  const [activeIndex, setActiveIndex] = useState<number>(forceActiveIndex ?? -1);
  const [liveMessage, setLiveMessage] = useState('');

  // Debounce timer ref for live region announcements
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleActivate = useCallback((index: number) => {
    setActiveIndex(index);
    const band = data.transitions[index];
    if (band) {
      if (announceTimer.current) clearTimeout(announceTimer.current);
      announceTimer.current = setTimeout(() => {
        setLiveMessage(
          `Transition ${band.number}: ${band.title}, ${band.dateStart}–${band.dateEnd ?? 'present'}`,
        );
      }, 200);
    }
  }, [data]);

  const handleDeactivate = useCallback(() => {
    if (forceActiveIndex === undefined) {
      setActiveIndex(-1);
    }
    if (announceTimer.current) clearTimeout(announceTimer.current);
  }, [forceActiveIndex]);

  const activeBand = activeIndex >= 0 ? (data.transitions[activeIndex] ?? null) : null;
  const textDescription = buildTextDescription(data);

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`tt-wrapper${className ? ` ${className}` : ''}`}>
        <AriaLiveRegion message={liveMessage} />

        {isMobile ? (
          /* ── Mobile vertical layout (<768 px) ── */
          <MobileLayout
            data={data}
            activeIndex={activeIndex}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            reducedMotion={reducedMotion}
          />
        ) : (
          /* ── Desktop horizontal layout (≥768 px) ── */
          <>
            <div
              className="tt-scroll"
              // touch-action: pan-x allows native horizontal swipe scrolling on touch
              // devices without interfering with vertical page scroll.
              style={{ touchAction: 'pan-x' }}
            >
              <ResponsiveContainer minHeight={SVG_HEIGHT}>
                {(dimensions) => (
                  <InnerChart
                    data={data}
                    dimensions={dimensions}
                    activeIndex={activeIndex}
                    onActivate={handleActivate}
                    onDeactivate={handleDeactivate}
                    reducedMotion={reducedMotion}
                  />
                )}
              </ResponsiveContainer>
            </div>

            {/* Annotation panel — below the scroll container, never overlapping SVG */}
            <AnnotationPanel band={activeBand} reducedMotion={reducedMotion} />

            {/* Legend — rendered outside the SVG so it can wrap freely */}
            <div className="tt-legend" aria-label="Transition colour legend">
              {data.transitions.map((t) => (
                <span key={t.id} className="tt-legend__item">
                  <span
                    className="tt-legend__swatch"
                    data-transition={String(t.number)}
                    aria-hidden="true"
                  />
                  <span>
                    T{t.number}: {t.title}
                  </span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </TextDescriptionToggle>
  );
}
