/**
 * MapperParameterLab.tsx — Task 5.2 — Agent_Interactive_Advanced
 *
 * Interactive Mapper Parameter Lab.
 *
 * Layout:
 *   ┌────────────────────────────────────┐
 *   │  Left panel        Right panel     │
 *   │  Point cloud       Mapper graph    │
 *   │  (D3 scatter)      (D3 force)      │
 *   ├────────────────────────────────────┤
 *   │  Parameter controls                │
 *   └────────────────────────────────────┘
 *
 * Shared infrastructure (Task 3.1):
 *   - ResponsiveContainer  for responsive sizing
 *   - getVizColorScale     for filter-value colour mapping
 *   - createTooltip / showTooltip / hideTooltip / destroyTooltip
 *   - AriaLiveRegion       for screen-reader announcements
 *   - TextDescriptionToggle for prose description
 *   - useReducedMotion     for animation guard
 *
 * All D3 DOM mutations live in a single `useEffect` per panel, writing to an
 * SVG ref. React state and event handlers live outside those effects.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { getVizColorScale } from '@lib/viz/scales';
import {
  createTooltip,
  showTooltip,
  hideTooltip,
  destroyTooltip,
} from '@lib/viz/tooltip';
import type { TooltipHandle } from '@lib/viz/tooltip';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import {
  computeMapper,
  pcaFilter,
  densityFilter,
  eccentricityFilter,
} from '@lib/tda/mapper';
import type { MapperGraph, MapperNode } from '@lib/tda/mapper';
import type { Point2D } from '@lib/tda/mapper';

import { PRESETS } from './MapperParameterLab.data';

import './MapperParameterLab.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN = { top: 20, right: 20, bottom: 45, left: 45 };
/** Debounce delay for recomputing the Mapper graph during slider drag. */
const COMPUTE_DEBOUNCE_MS = 150;
/** Debounce delay for ARIA live announcements. */
const ANNOUNCE_DEBOUNCE_MS = 300;

/** Clamped radius bounds for Mapper nodes (px). */
const NODE_R_MIN = 8;
const NODE_R_MAX = 28;
/** Clamped stroke-width bounds for Mapper edges (px). */
const EDGE_W_MIN = 1;
const EDGE_W_MAX = 4;

// ─── Filter name type ─────────────────────────────────────────────────────────

type FilterFnName = 'pca' | 'density' | 'eccentricity';

// ─── Connected-components counter ────────────────────────────────────────────

function countConnectedComponents(graph: MapperGraph): number {
  if (graph.nodes.length === 0) return 0;
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const e of graph.edges) {
    adj.get(e.source)?.push(e.target);
    adj.get(e.target)?.push(e.source);
  }
  const visited = new Set<string>();
  let components = 0;
  for (const n of graph.nodes) {
    if (visited.has(n.id)) continue;
    components++;
    const queue = [n.id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      for (const nb of adj.get(curr) ?? []) {
        if (!visited.has(nb)) queue.push(nb);
      }
    }
  }
  return components;
}

// ─── Build filter function from name ─────────────────────────────────────────

function buildFilterFn(
  name: FilterFnName,
  points: Point2D[],
): (p: Point2D) => number {
  switch (name) {
    case 'pca':
      return pcaFilter(points);
    case 'density':
      return densityFilter(points, 0.5);
    case 'eccentricity':
      return eccentricityFilter(points);
  }
}

// ─── Filter label helper ──────────────────────────────────────────────────────

function filterLabel(name: FilterFnName): string {
  switch (name) {
    case 'pca':
      return 'PCA';
    case 'density':
      return 'Density';
    case 'eccentricity':
      return 'Eccentricity';
  }
}

// ─── Left panel: point cloud coloured by filter value ────────────────────────

interface PointCloudPanelProps {
  width: number;
  height: number;
  points: Point2D[];
  filterValues: number[];
  reducedMotion: boolean;
  onHover: (msg: string) => void;
}

function PointCloudPanel({
  width,
  height,
  points,
  filterValues,
  reducedMotion: _reducedMotion,
  onHover,
}: PointCloudPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(
          points.length > 0
            ? [d3.min(points, (p) => p.x)! - 0.2, d3.max(points, (p) => p.x)! + 0.2]
            : [-2, 2],
        )
        .range([0, innerW]),
    [innerW, points],
  );

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(
          points.length > 0
            ? [d3.min(points, (p) => p.y)! - 0.2, d3.max(points, (p) => p.y)! + 0.2]
            : [-2, 2],
        )
        .range([innerH, 0]),
    [innerH, points],
  );

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    if (!tooltipRef.current) {
      tooltipRef.current = createTooltip(containerEl);
    }

    // ── Colour scale — built inside useEffect (browser context only) ──────────
    // Map continuous filter values to the 6-slot Okabe-Ito viz palette via a
    // quantize scale. getVizColorScale() reads CSS custom properties from DOM.
    const BUCKET_KEYS = ['0', '1', '2', '3', '4', '5'] as const;
    const vizScale = getVizColorScale().domain(BUCKET_KEYS);
    const minF = filterValues.length > 0 ? Math.min(...filterValues) : 0;
    const maxF = filterValues.length > 0 ? Math.max(...filterValues) : 1;
    const quantize = d3
      .scaleQuantize<string>()
      .domain([minF, maxF <= minF ? minF + 1 : maxF])
      .range([...BUCKET_KEYS]);
    const getColor = (v: number) => vizScale(quantize(v));

    const svg = d3.select(svgEl);
    const g = svg.select<SVGGElement>('.mpl-pc-g');

    // ── Axes ──────────────────────────────────────────────────────────────────

    const xAxisG = svg.select<SVGGElement>('.mpl-pc-x-axis');
    xAxisG
      .call(d3.axisBottom(xScale).ticks(4))
      .selectAll('text')
      .style('font-size', '11px');

    const yAxisG = svg.select<SVGGElement>('.mpl-pc-y-axis');
    yAxisG
      .call(d3.axisLeft(yScale).ticks(4))
      .selectAll('text')
      .style('font-size', '11px');

    // ── Points ────────────────────────────────────────────────────────────────

    const circles = g
      .selectAll<SVGCircleElement, Point2D>('.mpl-point')
      .data(points, (d) => d.id);

    circles
      .enter()
      .append('circle')
      .attr('class', 'mpl-point')
      .attr('r', 5)
      .merge(circles as d3.Selection<SVGCircleElement, Point2D, SVGGElement, unknown>)
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('fill', (_d, i) => getColor(filterValues[i] ?? 0))
      .attr('opacity', 0.85)
      .on('pointermove', (event: PointerEvent, d: Point2D) => {
        const i = points.indexOf(d);
        const fv = filterValues[i]?.toFixed(3) ?? '—';
        showTooltip(tooltipRef.current!, event, `Point ${d.id} · filter: ${fv}`);
        onHover(`Point ${d.id}, filter value: ${fv}`);
      })
      .on('pointerleave', () => {
        hideTooltip(tooltipRef.current!);
        onHover('');
      });

    circles.exit().remove();
  }, [points, filterValues, xScale, yScale, onHover]);

  // Cleanup tooltip on unmount.
  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        destroyTooltip(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width, height }}>
      <svg
        ref={svgRef}
        className="mpl-svg"
        width={width}
        height={height}
        aria-hidden="true"
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <g className="mpl-pc-g" />
          <g
            className="mpl-pc-x-axis"
            transform={`translate(0,${innerH})`}
          />
          <g className="mpl-pc-y-axis" />
          <text
            className="mpl-axis-label"
            x={innerW / 2}
            y={innerH + 40}
            textAnchor="middle"
          >
            x
          </text>
          <text
            className="mpl-axis-label"
            transform={`rotate(-90)`}
            x={-innerH / 2}
            y={-35}
            textAnchor="middle"
          >
            y
          </text>
        </g>
      </svg>
    </div>
  );
}

// ─── Right panel: Mapper force-directed graph ─────────────────────────────────

interface MapperGraphPanelProps {
  width: number;
  height: number;
  graph: MapperGraph;
  filterFnName: FilterFnName;
  reducedMotion: boolean;
  onHover: (msg: string) => void;
}

function MapperGraphPanel({
  width,
  height,
  graph,
  filterFnName,
  reducedMotion,
  onHover,
}: MapperGraphPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);
  // Keep a ref to the active simulation so we can stop it when graph changes.
  const simulationRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null);
  // Keep a ref to the zoom behaviour so the reset button can call zoomIdentity.
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  type SimNode = MapperNode & d3.SimulationNodeDatum;
  // SimEdge uses node references for source/target (not strings), so we
  // do not extend MapperEdge (which requires source/target: string).
  type SimEdge = d3.SimulationLinkDatum<SimNode> & { sharedPoints: number };

  // Node radius scale: map size → r ∈ [NODE_R_MIN, NODE_R_MAX].
  const maxSize = useMemo(
    () => (graph.nodes.length > 0 ? Math.max(...graph.nodes.map((n) => n.size)) : 1),
    [graph.nodes],
  );
  const rScale = useMemo(
    () =>
      d3
        .scaleSqrt()
        .domain([1, Math.max(maxSize, 2)])
        .range([NODE_R_MIN, NODE_R_MAX])
        .clamp(true),
    [maxSize],
  );

  // Edge stroke-width scale: map sharedPoints → w ∈ [EDGE_W_MIN, EDGE_W_MAX].
  const maxShared = useMemo(
    () =>
      graph.edges.length > 0
        ? Math.max(...graph.edges.map((e) => e.sharedPoints))
        : 1,
    [graph.edges],
  );
  const edgeWScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([1, Math.max(maxShared, 2)])
        .range([EDGE_W_MIN, EDGE_W_MAX])
        .clamp(true),
    [maxShared],
  );

  // nodeColorScale is computed inside useEffect (browser context required).

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    if (!tooltipRef.current) {
      tooltipRef.current = createTooltip(containerEl);
    }

    // Stop and discard any in-flight simulation from a previous render.
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }

    // ── Colour scale — same viz palette as point cloud panel ─────────────────
    const BUCKET_KEYS = ['0', '1', '2', '3', '4', '5'] as const;
    const vizScale = getVizColorScale().domain(BUCKET_KEYS);
    const minFV =
      graph.nodes.length > 0
        ? Math.min(...graph.nodes.map((n) => n.filterMeanValue))
        : 0;
    const maxFV =
      graph.nodes.length > 0
        ? Math.max(...graph.nodes.map((n) => n.filterMeanValue))
        : 1;
    const nodeQuantize = d3
      .scaleQuantize<string>()
      .domain([minFV, maxFV <= minFV ? minFV + 1 : maxFV])
      .range([...BUCKET_KEYS]);
    const getNodeColor = (v: number) => vizScale(nodeQuantize(v));

    const svg = d3.select(svgEl);

    // Clear previous graph elements.
    svg.select('.mpl-graph-g').selectAll('*').remove();
    const g = svg.select<SVGGElement>('.mpl-graph-g');

    if (graph.nodes.length === 0) {
      // Show placeholder text.
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'mpl-empty')
        .attr('fill', 'var(--color-neutral-muted, #555)')
        .text('No graph — adjust parameters');
      return;
    }

    // Deep-copy nodes and edges so D3 can mutate x/y positions without
    // touching React state.
    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const edges: SimEdge[] = graph.edges.map((e) => ({
      ...e,
      source: nodeById.get(e.source)!,
      target: nodeById.get(e.target)!,
    }));

    // ── D3 force simulation ────────────────────────────────────────────────

    const cx = width / 2;
    const cy = height / 2;

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimEdge>(edges)
          .id((d) => d.id)
          .distance(60),
      )
      .force('charge', d3.forceManyBody<SimNode>().strength(-80))
      .force('center', d3.forceCenter(cx, cy))
      .force('collision', d3.forceCollide<SimNode>().radius((d) => rScale(d.size) + 4))
      .alphaMin(0.001);

    simulationRef.current = simulation;

    // ── Render edges ──────────────────────────────────────────────────────

    const edgeSelection = g
      .selectAll<SVGLineElement, SimEdge>('.mpl-edge')
      .data(edges)
      .enter()
      .append('line')
      .attr('class', 'mpl-edge')
      .attr('stroke-width', (d) => edgeWScale(d.sharedPoints));

    // ── Render nodes ──────────────────────────────────────────────────────

    const nodeSelection = g
      .selectAll<SVGGElement, SimNode>('.mpl-node')
      .data(nodes, (d) => d.id)
      .enter()
      .append('g')
      .attr('class', 'mpl-node');

    nodeSelection
      .append('circle')
      .attr('r', (d) => rScale(d.size))
      .attr('fill', (d) => getNodeColor(d.filterMeanValue));

    nodeSelection
      .on('pointermove', function (event: PointerEvent, d: SimNode) {
        const label = filterLabel(filterFnName);
        showTooltip(
          tooltipRef.current!,
          event,
          `${d.size} point${d.size !== 1 ? 's' : ''} clustered here · mean ${label}: ${d.filterMeanValue.toFixed(3)}`,
        );
        onHover(`${d.size} point${d.size !== 1 ? 's' : ''} clustered in this node. Mean ${label} value: ${d.filterMeanValue.toFixed(3)}.`);
      })
      .on('pointerleave', () => {
        hideTooltip(tooltipRef.current!);
        onHover('');
      });

    // ── Tick function: update positions ───────────────────────────────────

    const ticked = () => {
      edgeSelection
        .attr('x1', (d) => (d.source as SimNode).x ?? cx)
        .attr('y1', (d) => (d.source as SimNode).y ?? cy)
        .attr('x2', (d) => (d.target as SimNode).x ?? cx)
        .attr('y2', (d) => (d.target as SimNode).y ?? cy);

      nodeSelection.attr(
        'transform',
        (d) => `translate(${d.x ?? cx},${d.y ?? cy})`,
      );
    };

    // ── Pan + zoom ────────────────────────────────────────────────────────
    // Attach d3.zoom to the SVG; transforms the graph <g> only.
    // Scroll to zoom (0.25×–4×), drag to pan. Nodes and tooltip are unaffected.
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });
    zoomRef.current = zoom;
    d3.select(svgEl).call(zoom);
    // Reset to identity whenever the graph data changes.
    d3.select(svgEl).call(zoom.transform, d3.zoomIdentity);

    if (reducedMotion) {
      // Static snapshot: tick to convergence, render once, then stop.
      simulation.tick(300);
      ticked();
      simulation.stop();
    } else {
      simulation.on('tick', ticked);
    }

    return () => {
      simulation.stop();
    };
  }, [graph, width, height, rScale, edgeWScale, reducedMotion, onHover, filterFnName]);

  // Cleanup tooltip on unmount.
  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        destroyTooltip(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width, height }}>
      <svg
        ref={svgRef}
        className="mpl-svg mpl-svg--pannable"
        width={width}
        height={height}
        aria-hidden="true"
      >
        <g className="mpl-graph-g" />
      </svg>
      <button
        type="button"
        className="mpl-zoom-reset"
        aria-label="Reset graph view"
        onClick={() => {
          if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current)
              .transition()
              .duration(300)
              .call(zoomRef.current.transform, d3.zoomIdentity);
          }
        }}
      >
        Reset view
      </button>
    </div>
  );
}

// ─── Main export: MapperParameterLab ─────────────────────────────────────────

export interface MapperParameterLabProps {
  /** Optional extra CSS class on the outermost wrapper. */
  className?: string;
}

export function MapperParameterLab({ className }: MapperParameterLabProps) {
  // ── State ────────────────────────────────────────────────────────────────

  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [points, setPoints] = useState<Point2D[]>(PRESETS[0].points);
  const [resolution, setResolution] = useState(8);
  const [overlap, setOverlap] = useState(0.5);
  const [filterFnName, setFilterFnName] = useState<FilterFnName>('pca');
  const [clusterThreshold, setClusterThreshold] = useState(0.4);
  const [mapperGraph, setMapperGraph] = useState<MapperGraph | null>(null);
  const [liveMsg, setLiveMsg] = useState('');
  const [hoverMsg, setHoverMsg] = useState('');

  const reducedMotion = useReducedMotion();

  // ── Debounced Mapper recomputation ────────────────────────────────────────

  const computeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleCompute = useCallback(
    (
      pts: Point2D[],
      res: number,
      ovl: number,
      filterName: FilterFnName,
      threshold: number,
    ) => {
      if (computeTimerRef.current !== null) {
        clearTimeout(computeTimerRef.current);
      }
      computeTimerRef.current = setTimeout(() => {
        const filterFn = buildFilterFn(filterName, pts);
        const graph = computeMapper(pts, filterFn, res, ovl, threshold);
        setMapperGraph(graph);
      }, COMPUTE_DEBOUNCE_MS);
    },
    [],
  );

  // Initial computation on mount.
  useEffect(() => {
    scheduleCompute(points, resolution, overlap, filterFnName, clusterThreshold);
    return () => {
      if (computeTimerRef.current !== null) clearTimeout(computeTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Debounced ARIA live announcement ──────────────────────────────────────

  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapperGraph) return;
    if (announceTimerRef.current !== null) clearTimeout(announceTimerRef.current);
    announceTimerRef.current = setTimeout(() => {
      setLiveMsg(
        `Mapper graph: ${mapperGraph.nodes.length} nodes, ${mapperGraph.edges.length} edges.`,
      );
    }, ANNOUNCE_DEBOUNCE_MS);
    return () => {
      if (announceTimerRef.current !== null) clearTimeout(announceTimerRef.current);
    };
  }, [mapperGraph]);

  // ── Preset change handler ─────────────────────────────────────────────────

  const handlePresetChange = useCallback(
    (presetId: string) => {
      const preset = PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      setSelectedPresetId(presetId);
      setPoints(preset.points);
      scheduleCompute(preset.points, resolution, overlap, filterFnName, clusterThreshold);
    },
    [resolution, overlap, filterFnName, clusterThreshold, scheduleCompute],
  );

  // ── Parameter change handlers ─────────────────────────────────────────────

  const handleResolutionChange = useCallback(
    (v: number) => {
      setResolution(v);
      scheduleCompute(points, v, overlap, filterFnName, clusterThreshold);
    },
    [points, overlap, filterFnName, clusterThreshold, scheduleCompute],
  );

  const handleOverlapChange = useCallback(
    (v: number) => {
      setOverlap(v);
      scheduleCompute(points, resolution, v, filterFnName, clusterThreshold);
    },
    [points, resolution, filterFnName, clusterThreshold, scheduleCompute],
  );

  const handleFilterChange = useCallback(
    (name: FilterFnName) => {
      setFilterFnName(name);
      scheduleCompute(points, resolution, overlap, name, clusterThreshold);
    },
    [points, resolution, overlap, clusterThreshold, scheduleCompute],
  );

  const handleThresholdChange = useCallback(
    (v: number) => {
      setClusterThreshold(v);
      scheduleCompute(points, resolution, overlap, filterFnName, v);
    },
    [points, resolution, overlap, filterFnName, scheduleCompute],
  );

  // ── Derived filter values for the point cloud scatter colour ─────────────

  const filterValues = useMemo(() => {
    const fn = buildFilterFn(filterFnName, points);
    return points.map(fn);
  }, [filterFnName, points]);

  // ── Memoised connected-component count ──────────────────────────────────

  const componentCount = useMemo(
    () => (mapperGraph ? countConnectedComponents(mapperGraph) : 0),
    [mapperGraph],
  );

  // ── Text description for TextDescriptionToggle ────────────────────────────

  const textDescription = useMemo(() => {
    if (!mapperGraph) return 'No graph computed yet.';
    const components = componentCount;
    return (
      `Mapper graph using ${filterLabel(filterFnName)} filter with ${resolution} cover ` +
      `intervals, ${(overlap * 100).toFixed(0)}% overlap, and clustering threshold ` +
      `${clusterThreshold.toFixed(2)}. ` +
      `Result: ${mapperGraph.nodes.length} nodes, ${mapperGraph.edges.length} edges, ` +
      `${components} connected component${components !== 1 ? 's' : ''}.`
    );
  }, [mapperGraph, filterFnName, resolution, overlap, clusterThreshold, componentCount]);

  // ── Hover handler (passed down to panels) ────────────────────────────────

  const handleHover = useCallback((msg: string) => setHoverMsg(msg), []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`mpl-wrapper${className ? ` ${className}` : ''}`}>
        <AriaLiveRegion message={liveMsg || hoverMsg} />

        <ResponsiveContainer minHeight={440}>
          {({ width }) => {
            // Each panel gets half the container width minus gap (8px each side).
            const panelW = Math.max(120, Math.floor((width - 16) / 2));
            // Height: match panel width up to 480px so the force graph has room.
            // Capped at 480px to avoid excessive height on very wide screens.
            const panelH = Math.min(panelW, 480);

            const graph = mapperGraph ?? { nodes: [], edges: [] };

            return (
              <div className="mpl-panels">
                <div className="mpl-panel">
                  <p className="mpl-panel-label">Point cloud (filter value)</p>
                  <div className="mpl-svg-wrapper" style={{ height: panelH }}>
                    <PointCloudPanel
                      width={panelW}
                      height={panelH}
                      points={points}
                      filterValues={filterValues}
                      reducedMotion={reducedMotion}
                      onHover={handleHover}
                    />
                  </div>
                </div>

                <div className="mpl-panel">
                  <p className="mpl-panel-label">Mapper graph</p>
                  <div className="mpl-svg-wrapper" style={{ height: panelH }}>
                    <MapperGraphPanel
                      width={panelW}
                      height={panelH}
                      graph={graph}
                      filterFnName={filterFnName}
                      reducedMotion={reducedMotion}
                      onHover={handleHover}
                    />
                  </div>
                </div>
              </div>
            );
          }}
        </ResponsiveContainer>

        {/* ── Parameter controls ──────────────────────────────────────────── */}
        <div className="mpl-controls">
          {/* Preset selector */}
          <div className="mpl-control-group">
            <label htmlFor="mpl-preset">Point cloud</label>
            <select
              id="mpl-preset"
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter function selector */}
          <div className="mpl-control-group">
            <label htmlFor="mpl-filter">Filter function</label>
            <select
              id="mpl-filter"
              value={filterFnName}
              onChange={(e) => handleFilterChange(e.target.value as FilterFnName)}
            >
              <option value="pca">PCA</option>
              <option value="density">Density</option>
              <option value="eccentricity">Eccentricity</option>
            </select>
          </div>

          {/* Resolution slider */}
          <div className="mpl-control-group">
            <label htmlFor="mpl-resolution">Cover intervals: {resolution}</label>
            <input
              id="mpl-resolution"
              type="range"
              min={2}
              max={20}
              step={1}
              value={resolution}
              aria-valuemin={2}
              aria-valuemax={20}
              aria-valuenow={resolution}
              aria-valuetext={`${resolution} intervals`}
              onChange={(e) => handleResolutionChange(Number(e.target.value))}
            />
          </div>

          {/* Overlap slider */}
          <div className="mpl-control-group">
            <label htmlFor="mpl-overlap">
              Interval overlap: {(overlap * 100).toFixed(0)}%
            </label>
            <input
              id="mpl-overlap"
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={overlap}
              aria-valuemin={0.1}
              aria-valuemax={0.9}
              aria-valuenow={overlap}
              aria-valuetext={`${(overlap * 100).toFixed(0)}% overlap`}
              onChange={(e) => handleOverlapChange(Number(e.target.value))}
            />
          </div>

          {/* Cluster threshold slider */}
          <div className="mpl-control-group">
            <label htmlFor="mpl-threshold">
              Cluster threshold: {clusterThreshold.toFixed(2)}
            </label>
            <input
              id="mpl-threshold"
              type="range"
              min={0.05}
              max={2.0}
              step={0.05}
              value={clusterThreshold}
              aria-valuemin={0.05}
              aria-valuemax={2.0}
              aria-valuenow={clusterThreshold}
              aria-valuetext={`${clusterThreshold.toFixed(2)} distance`}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
            />
          </div>
        </div>

        {/* ── Graph stats strip ───────────────────────────────────────────── */}
        {mapperGraph && (
          <p className="mpl-graph-stats" aria-live="off">
            {mapperGraph.nodes.length} nodes · {mapperGraph.edges.length} edges ·{' '}
            {componentCount} component
            {componentCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </TextDescriptionToggle>
  );
}
