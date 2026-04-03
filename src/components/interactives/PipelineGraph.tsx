/**
 * PipelineGraph.tsx — Task 3.4 — Agent_Interactive_Core
 *
 * D3 force-directed graph of the TDA research pipeline.
 *
 * Step 2: Core force simulation, directed-edge arrowheads, node circles,
 *         labels, and hover tooltips.
 * Step 3 additions: click-navigation, timeline x-axis, compute indicators,
 *         status legend (see // ── STEP 3 markers).
 * Step 4 additions: full a11y, mobile list fallback, Storybook story.
 *
 * Architecture:
 *   PipelineGraph (exported default)
 *     └─ ResponsiveContainer (measures pixel dimensions)
 *         └─ PipelineGraphInner (D3 simulation + React-rendered SVG)
 *
 * D3 is used exclusively for force-simulation position computation.
 * All SVG elements are rendered as React JSX using positions stored in
 * React state that is updated on each simulation tick.  This keeps D3
 * responsible only for physics, while React owns the DOM.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { createTooltip, showTooltipHtml, hideTooltip, destroyTooltip } from '@lib/viz/tooltip';
import type { TooltipHandle } from '@lib/viz/tooltip';
import type { VizProps } from '@lib/viz/types';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';
import { makeFocusable, arrowKeyHandler } from '@lib/viz/a11y/keyboardNav';
import type { PipelineNode, PipelineEdge, PipelineGraphData } from './PipelineGraph.data';
import './PipelineGraph.css';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Chart inner padding (px) — leaves room for labels outside the node area. */
const MARGIN = { top: 32, right: 48, bottom: 80, left: 48 } as const;

/** Number of software stages in the research programme (0–3 inclusive). */
const STAGE_COUNT = 4;

/**
 * Fractional x-position within the inner drawing area per stage.
 * Stage 0 = leftmost (Foundations), Stage 3 = rightmost (Synthesis).
 */
const STAGE_X_FRAC = [0.08, 0.34, 0.64, 0.90] as const;

/**
 * Node circle radius (px) per stage.
 * Stage 0 (the single foundational paper) is largest.
 */
const STAGE_RADIUS = [28, 22, 18, 15] as const;

/** Force simulation strength targeting each node toward its stage column. */
const STAGE_X_STRENGTH = 0.75;

/** D3 many-body repulsion strength (negative = repel). */
const REPULSION_STRENGTH = -300;

/** Target edge rest length for forceLink (px). */
const LINK_DISTANCE = 90;

/** Simulation alpha-decay — higher = faster cool-down. */
const ALPHA_DECAY = 0.03;

/** Height of the stage-band timeline strip rendered below the force area (px). */
const TIMELINE_H = 50;

// Stage labels used in the timeline overlay
export const STAGE_LABELS: Record<number, string> = {
  0: 'Foundations',
  1: 'Core Methods',
  2: 'Applications',
  3: 'Synthesis',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageX(stage: number, innerW: number): number {
  const frac = STAGE_X_FRAC[Math.min(Math.max(stage, 0), STAGE_COUNT - 1)] ?? 0.5;
  return frac * innerW;
}

function stageRadius(stage: number): number {
  return STAGE_RADIUS[Math.min(Math.max(stage, 0), STAGE_COUNT - 1)] ?? 16;
}

/**
 * Abbreviate a title to at most `maxWords` words, appending "…" if truncated.
 * Produces short readable node labels (e.g. "The Markov Memory…").
 */
function abbrevTitle(title: string, maxWords = 3): string {
  const words = title.split(' ');
  if (words.length <= maxWords) return title;
  return words.slice(0, maxWords).join(' ') + '\u2026';
}

/**
 * Compute static fixed positions for all nodes:
 * x is determined by stage column; nodes within a stage are spaced evenly
 * in the vertical range above the timeline band.
 * Used as the initial posMap and as the full static layout when
 * `prefers-reduced-motion` is active.
 */
function computeStaticPositions(
  nodes: PipelineNode[],
  innerW: number,
  innerH: number,
): Map<string, { x: number; y: number }> {
  const byStage = new Map<number, PipelineNode[]>();
  for (const n of nodes) {
    const arr = byStage.get(n.stage) ?? [];
    arr.push(n);
    byStage.set(n.stage, arr);
  }

  const pos = new Map<string, { x: number; y: number }>();
  const availH = innerH - TIMELINE_H - 16;

  for (const [stage, stageNodes] of byStage) {
    const x = stageX(stage, innerW);
    const sorted = [...stageNodes].sort((a, b) => a.paper_number - b.paper_number);
    const count = sorted.length;
    sorted.forEach((n, i) => {
      const y = ((i + 1) / (count + 1)) * availH;
      pos.set(n.id, { x, y });
    });
  }
  return pos;
}

/**
 * Build a prose text description of the graph for the TextDescriptionToggle
 * accessible fallback. Lists all papers in order with their stage, status,
 * and dependency relationships.
 */
function buildTextDescription(data: PipelineGraphData): string {
  const desc = data.nodes.map((node) => {
    const deps = data.edges
      .filter((e) => e.target === node.id)
      .map((e) => {
        const src = data.nodes.find((n) => n.id === e.source);
        return src ? `Paper ${src.paper_number}` : e.source;
      });
    const enables = data.edges
      .filter((e) => e.source === node.id)
      .map((e) => {
        const tgt = data.nodes.find((n) => n.id === e.target);
        return tgt ? `Paper ${tgt.paper_number}` : e.target;
      });
    const stageLabel = STAGE_LABELS[node.stage] ?? `Stage ${node.stage}`;
    let line = `Paper ${node.paper_number}: ${node.title} — ${stageLabel}, ${node.status}`;
    if (deps.length) line += `. Depends on: ${deps.join(', ')}`;
    if (enables.length) line += `. Enables: ${enables.join(', ')}`;
    return line;
  });
  return (
    `TDA research pipeline with ${data.nodes.length} papers across 4 stages. ` +
    desc.join('. ') +
    '.'
  );
}

// ─── Mobile list fallback ─────────────────────────────────────────────────────

/**
 * Simple ordered list of all papers shown on viewports narrower than 768 px.
 * The force-directed graph is inappropriate for small screens.
 */
function MobileListFallback({
  nodes,
  edges,
}: {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}) {
  return (
    <div className="pg-list-fallback" aria-label="Research pipeline — paper list">
      <ol className="pg-list">
        {nodes.map((node) => {
          const deps = edges
            .filter((e) => e.target === node.id)
            .map((e) => {
              const src = nodes.find((n) => n.id === e.source);
              return src ? `Paper ${src.paper_number}` : e.source;
            });
          return (
            <li key={node.id} className="pg-list-item">
              <a
                href={`/tda/papers/${node.id}/`}
                className="pg-list-link"
              >
                <strong>Paper {node.paper_number}</strong>: {node.title}
              </a>
              <span className={`pg-list-status pg-list-status--${node.status}`}>
                {' '}— {node.status}
              </span>
              {deps.length > 0 && (
                <span className="pg-list-deps">
                  {' '}(depends on: {deps.join(', ')})
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** D3 simulation node: extends PipelineNode with SimulationNodeDatum (x, y, vx, vy). */
type SimNode = PipelineNode & d3.SimulationNodeDatum;

/** Resolved screen-space endpoints for a single edge line. */
interface EdgePos {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ─── Exported component ───────────────────────────────────────────────────────

export interface PipelineGraphProps extends VizProps<PipelineGraphData> {}

/**
 * PipelineGraph — responsive wrapper.
 * Wraps the force-directed graph in TextDescriptionToggle for accessibility,
 * and adds a MobileListFallback for narrow viewports.
 */
export default function PipelineGraph({ data, className }: PipelineGraphProps) {
  const description = useMemo(() => buildTextDescription(data), [data]);

  return (
    <div className={`pg-outer${className ? ` ${className}` : ''}`}>
      {/* Mobile fallback (< 768 px) — shown via CSS media query */}
      <MobileListFallback nodes={data.nodes} edges={data.edges} />

      {/* Force graph section — hidden on mobile via .pg-graph-section */}
      <div className="pg-graph-section">
        <TextDescriptionToggle
          description={description}
          toggleLabel="Show text description of pipeline"
        >
          <ResponsiveContainer className="pg-responsive" minHeight={520}>
            {({ width, height }) => (
              <PipelineGraphInner
                nodes={data.nodes}
                edges={data.edges}
                width={width}
                height={height}
              />
            )}
          </ResponsiveContainer>
        </TextDescriptionToggle>
        {/* StatusLegend outside TextDescriptionToggle so it is always visible */}
        <StatusLegend />
      </div>
    </div>
  );
}

// ─── Status legend ────────────────────────────────────────────────────────────

const STATUS_LEGEND: Array<{ status: string; label: string }> = [
  { status: 'planned',     label: 'Planned' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'submitted',   label: 'Submitted' },
  { status: 'in-review',   label: 'In Review' },
  { status: 'revision',    label: 'Under Revision' },
  { status: 'published',   label: 'Published' },
];

function StatusLegend() {
  return (
    <div className="pg-legend" aria-label="Node colour legend by status">
      {STATUS_LEGEND.map(({ status, label }) => (
        <div key={status} className="pg-legend-item">
          <span
            className={`pg-legend-swatch pg-swatch--${status}`}
            aria-hidden="true"
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Inner chart ──────────────────────────────────────────────────────────────

interface InnerProps {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  width: number;
  height: number;
}

function PipelineGraphInner({ nodes, edges, width, height }: InnerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);

  const reducedMotion = useReducedMotion();
  const [liveMsg, setLiveMsg] = useState('');

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  // ── Node positions (updated each simulation tick) ─────────────────────────

  /**
   * posMap: nodeId → {x, y} in the inner (translated) coordinate space.
   * Initialised with static stage-column positions.  The force simulation
   * refines these; when reducedMotion is true they remain fixed.
   */
  const [posMap, setPosMap] = useState<Map<string, { x: number; y: number }>>(() =>
    computeStaticPositions(nodes, innerW, innerH),
  );

  // ── Force simulation ──────────────────────────────────────────────────────

  useEffect(() => {
    if (innerW <= 0 || innerH <= 0) return;

    // Reduced motion: use static stage-column positions with no animation.
    if (reducedMotion) {
      setPosMap(computeStaticPositions(nodes, innerW, innerH));
      return;
    }

    // Clone nodes so D3's position mutations do not affect prop data.
    // Seed positions from current posMap so dimension changes don't snap.
    const simNodes: SimNode[] = nodes.map((n) => ({
      ...n,
      x: posMap.get(n.id)?.x ?? stageX(n.stage, innerW),
      y: posMap.get(n.id)?.y ?? innerH / 2,
    }));

    const idToSim = new Map(simNodes.map((n) => [n.id, n]));

    // Build typed link objects that forceLink can resolve via node identity.
    type SimLink = d3.SimulationLinkDatum<SimNode>;
    const simLinks: SimLink[] = edges
      .map((e) => ({
        source: idToSim.get(e.source) as SimNode,
        target: idToSim.get(e.target) as SimNode,
      }))
      .filter((l) => l.source != null && l.target != null);

    const sim = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(LINK_DISTANCE)
          .strength(0.4),
      )
      .force('charge', d3.forceManyBody<SimNode>().strength(REPULSION_STRENGTH))
      .force('center', d3.forceCenter(innerW / 2, innerH / 2).strength(0.05))
      // Stage X bias — nodes are pulled toward their stage column.
      .force(
        'x',
        d3.forceX<SimNode>((d) => stageX(d.stage, innerW)).strength(STAGE_X_STRENGTH),
      )
      // Soft vertical centering keeps nodes away from the timeline band.
      .force('y', d3.forceY<SimNode>(innerH / 2).strength(0.05))
      .alphaDecay(ALPHA_DECAY)
      .on('tick', () => {
        // After each tick, clamp positions to inner bounds and push to state.
        const next = new Map<string, { x: number; y: number }>();
        for (const n of simNodes) {
          const r = stageRadius(n.stage);
          next.set(n.id, {
            x: Math.max(r, Math.min(innerW - r, n.x ?? stageX(n.stage, innerW))),
            // Reserve TIMELINE_H + 10px at the bottom so nodes don't overlap
            // the stage-band timeline strip.
            y: Math.max(r, Math.min(innerH - TIMELINE_H - 10 - r, n.y ?? innerH / 2)),
          });
        }
        setPosMap(new Map(next));
      });

    return () => {
      sim.stop();
    };
    // posMap intentionally excluded: it is seeded into simNode positions once
    // at simulation start. Including it would restart the simulation on every
    // tick, making it impossible for the force layout to settle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, innerW, innerH, reducedMotion]);

  // ── Tooltip lifecycle ────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    tooltipRef.current = createTooltip(el);

    return () => {
      if (tooltipRef.current) {
        destroyTooltip(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);

  // ── A11y: makeFocusable + arrowKeyHandler ────────────────────────────────

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    // Apply makeFocusable (tabindex + role) to all node <g> elements.
    // We then re-apply role="button" because node groups navigate to a page;
    // "button" is the semantically correct role for this interaction pattern.
    const nodeSelection = d3
      .select(svgEl)
      .selectAll<SVGGElement, unknown>('.pg-node') as unknown as d3.Selection<
        SVGElement,
        unknown,
        d3.BaseType,
        unknown
      >;
    makeFocusable(nodeSelection);
    // Re-apply correct interactive role after makeFocusable sets "img".
    nodeSelection.attr('role', 'button');

    // Arrow-key focus traversal between nodes.
    const items = d3.select(svgEl).selectAll<SVGGElement, unknown>('.pg-node').nodes();
    const handler = arrowKeyHandler(items, (_el, idx) => {
      const node = nodes[idx];
      if (node) {
        setLiveMsg(`Paper ${node.paper_number}: ${node.title}. Status: ${node.status}.`);
      }
    });

    svgEl.addEventListener('keydown', handler);
    return () => {
      svgEl.removeEventListener('keydown', handler);
    };
  }, [posMap, nodes]);

  // ── Edge endpoints ───────────────────────────────────────────────────────

  /**
   * Compute screen-space endpoints for each edge, offset from node centres
   * by the circle radius so lines start/end at the circumference rather
   * than the centre. The target end is shortened by an extra 9 px to give
   * the arrowhead marker visual clearance.
   */
  const edgePositions: EdgePos[] = edges.map((e) => {
    const src = posMap.get(e.source);
    const tgt = posMap.get(e.target);
    if (!src || !tgt) return { key: `${e.source}>${e.target}`, x1: 0, y1: 0, x2: 0, y2: 0 };

    const srcNode = nodes.find((n) => n.id === e.source);
    const tgtNode = nodes.find((n) => n.id === e.target);
    const rSrc = stageRadius(srcNode?.stage ?? 1);
    const rTgt = stageRadius(tgtNode?.stage ?? 1);

    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Offset src endpoint outward by rSrc + 2px gap.
    const srcOff = (rSrc + 2) / dist;
    // Offset tgt endpoint backward by rTgt + 9px arrowhead clearance.
    const tgtOff = (rTgt + 9) / dist;

    return {
      key: `${e.source}>${e.target}`,
      x1: src.x + dx * srcOff,
      y1: src.y + dy * srcOff,
      x2: tgt.x - dx * tgtOff,
      y2: tgt.y - dy * tgtOff,
    };
  });

  // ── Tooltip handlers ─────────────────────────────────────────────────────

  const handleNodePointerMove = useCallback(
    (event: React.PointerEvent, node: PipelineNode) => {
      const tt = tooltipRef.current;
      if (!tt) return;

      const computeLine =
        node.compute?.cloud
          ? `<br><span class="pg-tt-cloud">\u2601 Cloud compute</span>`
          : '';

      showTooltipHtml(
        tt,
        event.nativeEvent,
        `<strong>Paper ${node.paper_number}</strong>: ${node.title}` +
          `<br>Status: <em class="pg-tt-status pg-tt-status--${node.status}">${node.status}</em>` +
          computeLine,
      );
    },
    [],
  );

  const handleNodePointerLeave = useCallback(() => {
    const tt = tooltipRef.current;
    if (tt) hideTooltip(tt);
  }, []);

  // ── Node click navigation ────────────────────────────────────────────────

  const handleNodeClick = useCallback((node: PipelineNode) => {
    window.location.href = `/tda/papers/${node.id}/`;
  }, []);

  const handleNodeKeyDown = useCallback(
    (event: React.KeyboardEvent, node: PipelineNode) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.location.href = `/tda/papers/${node.id}/`;
      }
    },
    [],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="pg-wrap">
      <svg
        ref={svgRef}
        className="pg-svg"
        width={width}
        height={height}
        role="img"
        aria-label="TDA research pipeline: force-directed dependency graph of 10 papers across 4 stages"
      >
        <defs>
          {/*
           * Arrowhead marker for directed dependency edges.
           * refX=5 places the marker tip 5 units along the path so it
           * aligns with the pre-shortened line endpoint.
           */}
          <marker
            id="pg-arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" className="pg-arrowhead" />
          </marker>
        </defs>

        {/* Translated inner drawing area */}
        <g
          transform={`translate(${MARGIN.left},${MARGIN.top})`}
          className="pg-inner"
        >
          {/* ── Edges ──────────────────────────────────────────────────── */}
          <g className="pg-edges" aria-hidden="true">
            {edgePositions.map(({ key, x1, y1, x2, y2 }) => (
              <line
                key={key}
                className="pg-edge"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                markerEnd="url(#pg-arrow)"
              />
            ))}
          </g>

          {/* ── Timeline overlay: stage bands + 0–48 month axis ─────── */}
          <g
            className="pg-timeline"
            transform={`translate(0, ${innerH + 6})`}
            aria-hidden="true"
          >
            {/* Alternating stage band background rects */}
            {[0, 1, 2, 3].map((stage) => (
              <rect
                key={stage}
                x={(stage * innerW) / 4}
                y={0}
                width={innerW / 4}
                height={28}
                className={`pg-timeline-band pg-timeline-band--${stage % 2 === 0 ? 'even' : 'odd'}`}
              />
            ))}
            {/* Stage band labels centred in each quarter */}
            {[0, 1, 2, 3].map((stage) => (
              <text
                key={`lbl-${stage}`}
                x={((stage * 2 + 1) * innerW) / 8}
                y={17}
                textAnchor="middle"
                className="pg-stage-band-label"
              >
                {STAGE_LABELS[stage]}
              </text>
            ))}
            {/* Axis line */}
            <line x1={0} y1={28} x2={innerW} y2={28} className="pg-timeline-axis-line" />
            {/* Month ticks at 0, 12, 24, 36, 48 */}
            {[0, 12, 24, 36, 48].map((month) => {
              const tx = (month / 48) * innerW;
              return (
                <g key={month} transform={`translate(${tx}, 28)`}>
                  <line y1={0} y2={5} className="pg-timeline-tick" />
                  <text y={16} textAnchor="middle" className="pg-timeline-month-label">
                    {month}m
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── Nodes ──────────────────────────────────────────────────── */}
          <g className="pg-nodes">
            {nodes.map((node) => {
              const pos = posMap.get(node.id);
              if (!pos) return null;
              const r = stageRadius(node.stage);

              return (
                <g
                  key={node.id}
                  className={`pg-node pg-node--status-${node.status} pg-node--stage-${node.stage}`}
                  transform={`translate(${pos.x},${pos.y})`}
                  onPointerMove={(e) => handleNodePointerMove(e, node)}
                  onPointerLeave={handleNodePointerLeave}
                  onClick={() => handleNodeClick(node)}
                  onKeyDown={(e) => handleNodeKeyDown(e, node)}
                  onFocus={() =>
                    setLiveMsg(
                      `Paper ${node.paper_number}: ${node.title}. Stage: ${STAGE_LABELS[node.stage] ?? node.stage}. Status: ${node.status}.`,
                    )
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={`Paper ${node.paper_number}: ${node.title}, stage ${node.stage}, status ${node.status}. Open paper.`}
                >
                  {/* Circle fill coloured by status via CSS class */}
                  <circle r={r} className="pg-node-circle" />

                  {/* Paper number centred inside the circle */}
                  <text
                    className="pg-node-number"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {node.paper_number}
                  </text>

                  {/* Abbreviated title below the circle */}
                  <text
                    className="pg-node-label"
                    textAnchor="middle"
                    y={r + 14}
                  >
                    {abbrevTitle(node.title)}
                  </text>

                  {/* Cloud compute indicator */}
                  {node.compute?.cloud && (
                    <text
                      className="pg-compute-icon"
                      x={r + 3}
                      y={-r + 9}
                      textAnchor="start"
                      aria-hidden="true"
                    >
                      &#9729;
                    </text>
                  )}
                  {/* GPU indicator */}
                  {node.compute?.hardware?.includes('GPU') && (
                    <text
                      className="pg-compute-icon pg-compute-icon--gpu"
                      x={r + 3}
                      y={-r + 20}
                      textAnchor="start"
                      aria-hidden="true"
                    >
                      GPU
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Status colour legend moved to PipelineGraph wrapper — see above */}

      {/* ARIA live region — announces focused node title + status to screen readers */}
      <AriaLiveRegion message={liveMsg} />
    </div>
  );
}
