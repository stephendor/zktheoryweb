/**
 * BenefitTaperCalculator.tsx — Task 5.4 — Agent_Interactive_Advanced
 *
 * Interactive UC (Universal Credit) Benefit Taper Calculator.
 * Shows how the 55% taper rate and work allowances determine net income at
 * every earnings level, with an optional comparison against the pre-2021 63%
 * taper.
 *
 * Architecture follows the NormalDistExplorer canonical pattern:
 *   • All D3 DOM mutations are isolated in a single useEffect writing to
 *     svgRef (the "D3 split-effect" pattern). React owns state and controls;
 *     D3 owns SVG rendering.
 *   • Outer BenefitTaperCalculator holds state, useMemo derivations, controls,
 *     and a11y wrappers. Inner BenefitTaperChart receives measured dimensions
 *     and computed schedules as props.
 *
 * Shared infrastructure used:
 *   ResponsiveContainer, renderXAxis/renderYAxis, createTooltip/showTooltip,
 *   AriaLiveRegion, TextDescriptionToggle, useReducedMotion (all Task 3.1).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { renderXAxis, renderYAxis } from '@lib/viz/axes';
import { getPaletteColor } from '@lib/viz/scales';
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
  computeUCSchedule,
  computeFiscalCostDelta,
  CURRENT_PARAMS,
  PRE_2021_PARAMS,
  MAX_EARNINGS,
  TAPER_RATE_MIN,
  TAPER_RATE_MAX,
  TAPER_RATE_DEFAULT,
} from './BenefitTaperCalculator.data';
import type { UCResult } from './BenefitTaperCalculator.data';
import './BenefitTaperCalculator.css';

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Chart margins in pixels. */
const MARGIN = { top: 20, right: 30, bottom: 54, left: 70 };

/** Number of schedule sampling steps passed to computeUCSchedule. */
const SCHEDULE_STEPS = 300;

/** EMR threshold above which the "poverty trap zone" shading is applied. */
const POVERTY_TRAP_EMR_THRESHOLD = 60;

// ─── Inner chart component ─────────────────────────────────────────────────────

interface BenefitTaperChartProps {
  width: number;
  height: number;
  currentSchedule: UCResult[];
  comparisonSchedule: UCResult[] | null;
  hasHousingElement: boolean;
  /** Whether to show the pre-2021 63% reference line. Always true — kept for API compat. */
  showComparison: boolean;
  highlightedEarnings: number | null;
  reducedMotion: boolean;
  onHighlight: (earnings: number | null) => void;
  /** Stable callback: called on pointermove-based hover for ARIA announcements. */
  onHover: (msg: string) => void;
}

function BenefitTaperChart({
  width,
  height,
  currentSchedule,
  comparisonSchedule,
  showComparison,
  highlightedEarnings,
  reducedMotion,
  onHighlight,
  onHover,
}: BenefitTaperChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<TooltipHandle | null>(null);
  // Tracks whether the last highlight change was driven by pointer hover or the
  // slider. The spotlight useEffect skips announcing when source is 'hover'
  // because the pointermove handler already called onHover directly.
  const highlightSourceRef = useRef<'hover' | 'slider'>('slider');

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  // ── Scales (memoised so useEffect deps are stable references) ───────────────

  const xScale = useMemo(
    () => d3.scaleLinear().domain([0, MAX_EARNINGS]).range([0, innerW]),
    [innerW],
  );

  // y-axis: covers 0 → max(netIncome at £0) with 10% headroom.
  // The highest y-value is net income at zero earnings = UC standard allowance
  // plus any earnings, but we want to show the full net income line.
  // Max net income is always at max earnings (no UC left, so = MAX_EARNINGS).
  // We let D3 nice() extend the domain slightly above MAX_EARNINGS.
  const yMax = useMemo(() => {
    const maxNet = d3.max(currentSchedule, (d) => d.netIncome) ?? MAX_EARNINGS;
    return maxNet * 1.05;
  }, [currentSchedule]);

  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, yMax]).range([innerH, 0]).nice(),
    [yMax, innerH],
  );

  // ── D3 rendering effect ──────────────────────────────────────────────────────
  //
  // ALL SVG mutations happen here. No D3 calls outside this effect.
  // Follows the NormalDistExplorer split-effect pattern exactly.

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    // Ensure tooltip exists.
    if (!tooltipRef.current) {
      tooltipRef.current = createTooltip(containerEl);
    }

    const svg = d3.select(svgEl);

    // ── Colours (read CSS custom properties — browser-context only) ──────────

    const clRed = getPaletteColor('--color-cl-red');
    const clOchre = getPaletteColor('--color-cl-ochre');
    const neutralMuted = getPaletteColor('--color-neutral-muted');
    const viz3 = getPaletteColor('--color-viz-3');

    // ── Line / area generators ────────────────────────────────────────────────

    const lineGen = d3
      .line<UCResult>()
      .x((d) => xScale(d.grossEarnings))
      .y((d) => yScale(d.netIncome));

    const ucLineGen = d3
      .line<UCResult>()
      .x((d) => xScale(d.grossEarnings))
      .y((d) => yScale(d.ucAmount));

    const ucAreaGen = d3
      .area<UCResult>()
      .x((d) => xScale(d.grossEarnings))
      .y0(innerH)
      .y1((d) => yScale(d.ucAmount));

    // ── Poverty trap zone ─────────────────────────────────────────────────────
    // Shade the x-range where the effective marginal rate exceeds the threshold.
    // For current 55% params this zone is empty (55 < 60). For pre-2021 63%
    // it covers the entire taper zone (63 > 60).

    const trapZoneData = currentSchedule.filter(
      (d) => d.effectiveMarginalRate > POVERTY_TRAP_EMR_THRESHOLD,
    );

    const trapG = svg.select<SVGGElement>('.btc-poverty-zone');
    trapG.selectAll('*').remove();

    if (trapZoneData.length >= 2) {
      const xStart = xScale(trapZoneData[0].grossEarnings);
      const xEnd = xScale(trapZoneData[trapZoneData.length - 1].grossEarnings);
      trapG
        .append('rect')
        .attr('x', xStart)
        .attr('y', 0)
        .attr('width', xEnd - xStart)
        .attr('height', innerH)
        .attr('fill', viz3)
        .attr('fill-opacity', 0.15);

      trapG
        .append('text')
        .attr('class', 'btc-zone-label')
        .attr('x', xStart + (xEnd - xStart) / 2)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .text('High EMR zone');
    }

    // ── UC benefit area ───────────────────────────────────────────────────────

    svg
      .select<SVGPathElement>('.btc-uc-area')
      .datum(currentSchedule)
      .attr('d', ucAreaGen)
      .attr('fill', clOchre)
      .attr('fill-opacity', 0.3);

    // ── UC benefit line ───────────────────────────────────────────────────────

    svg
      .select<SVGPathElement>('.btc-uc-line')
      .datum(currentSchedule)
      .attr('d', ucLineGen)
      .attr('stroke', clOchre)
      .attr('fill', 'none')
      .attr('stroke-width', 2);

    // ── Net income line (current) ─────────────────────────────────────────────

    svg
      .select<SVGPathElement>('.btc-net-income-line')
      .datum(currentSchedule)
      .attr('d', lineGen)
      .attr('stroke', clRed)
      .attr('fill', 'none')
      .attr('stroke-width', 2.5);

    // ── Comparison net income line (pre-2021, dashed) ─────────────────────────

    const compG = svg.select<SVGPathElement>('.btc-comparison-line');
    if (showComparison && comparisonSchedule) {
      compG
        .datum(comparisonSchedule)
        .attr('d', lineGen)
        .attr('stroke', neutralMuted)
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8 4')
        .attr('display', null);
    } else {
      compG.attr('display', 'none');
    }

    // ── Compute key marker positions ──────────────────────────────────────────

    // Work allowance threshold (schedule step where taper starts)
    const firstTaperIdx = currentSchedule.findIndex((d) => d.effectiveMarginalRate > 0);
    const workAllowanceX =
      firstTaperIdx > 0
        ? xScale(currentSchedule[firstTaperIdx - 1].grossEarnings)
        : xScale(0);

    // UC exhaustion (first point where ucAmount = 0)
    const exhaustionIdx = currentSchedule.findIndex((d) => d.ucAmount === 0);
    const exhaustionEarnings =
      exhaustionIdx !== -1 ? currentSchedule[exhaustionIdx].grossEarnings : MAX_EARNINGS;
    const exhaustionX = xScale(exhaustionEarnings);
    const exhaustionNetIncome =
      exhaustionIdx !== -1 ? currentSchedule[exhaustionIdx].netIncome : MAX_EARNINGS;

    // ── Work allowance vertical dashed line ───────────────────────────────────

    const waLineG = svg.select<SVGGElement>('.btc-work-allowance-marker');
    waLineG.selectAll('*').remove();
    waLineG
      .append('line')
      .attr('x1', workAllowanceX)
      .attr('x2', workAllowanceX)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', neutralMuted)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6 3');
    waLineG
      .append('text')
      .attr('class', 'btc-marker-label')
      .attr('x', workAllowanceX + 4)
      .attr('y', innerH - 8)
      .attr('text-anchor', 'start')
      .text('Work allowance');

    // ── UC exhaustion vertical dashed line + annotation ───────────────────────

    const exLineG = svg.select<SVGGElement>('.btc-exhaustion-marker');
    exLineG.selectAll('*').remove();

    if (exhaustionIdx !== -1) {
      exLineG
        .append('line')
        .attr('x1', exhaustionX)
        .attr('x2', exhaustionX)
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', clRed)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6 3');

      // Callout annotation
      const annotY = 30;
      const annotText = 'UC exhausts here';
      const annotPadX = 6;
      const annotPadY = 4;
      const annotW = annotText.length * 7 + annotPadX * 2;
      const annotH = 18;
      // Position left of the line if close to right edge
      const annotX =
        exhaustionX + annotW + 10 > innerW
          ? exhaustionX - annotW - 4
          : exhaustionX + 4;

      exLineG
        .append('rect')
        .attr('x', annotX - annotPadX)
        .attr('y', annotY - annotH + annotPadY)
        .attr('width', annotW)
        .attr('height', annotH)
        .attr('rx', 3)
        .attr('fill', 'var(--color-neutral-surface, #fff)')
        .attr('stroke', clRed)
        .attr('stroke-width', 1);

      exLineG
        .append('text')
        .attr('class', 'btc-annotation-text')
        .attr('x', annotX)
        .attr('y', annotY)
        .attr('fill', clRed)
        .text(annotText);
    }

    // ── Spotlight crosshair (controlled by range slider state) ───────────────

    const crosshairG = svg.select<SVGGElement>('.btc-spotlight-crosshair');
    crosshairG.selectAll('*').remove();

    if (highlightedEarnings !== null) {
      // Find nearest schedule point
      const nearest = currentSchedule.reduce((prev, curr) =>
        Math.abs(curr.grossEarnings - highlightedEarnings) <
        Math.abs(prev.grossEarnings - highlightedEarnings)
          ? curr
          : prev,
      );

      const cx = xScale(nearest.grossEarnings);
      const cyNet = yScale(nearest.netIncome);
      const cyUC = yScale(nearest.ucAmount);

      // Vertical crosshair line
      crosshairG
        .append('line')
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', neutralMuted)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 3');

      // Horizontal dotted lines to y-axis
      crosshairG
        .append('line')
        .attr('x1', 0)
        .attr('x2', cx)
        .attr('y1', cyNet)
        .attr('y2', cyNet)
        .attr('stroke', clRed)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      crosshairG
        .append('line')
        .attr('x1', 0)
        .attr('x2', cx)
        .attr('y1', cyUC)
        .attr('y2', cyUC)
        .attr('stroke', clOchre)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      // Dot on net income line
      crosshairG
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cyNet)
        .attr('r', 4)
        .attr('fill', clRed);
    }

    // ── Axes ──────────────────────────────────────────────────────────────────

    const xAxisG = svg.select<SVGGElement>('.btc-x-axis');
    const yAxisG = svg.select<SVGGElement>('.btc-y-axis');

    renderXAxis(xAxisG, xScale as d3.AxisScale<number>, {
      label: 'Gross monthly earnings (£)',
      tickFormat: 'integer',
      tickCount: 7,
    });
    renderYAxis(yAxisG, yScale as d3.AxisScale<number>, {
      label: 'Amount (£/month)',
      tickFormat: 'integer',
    });

    // ── Hover rect: tooltip on pointermove ────────────────────────────────────

    const hoverRect = svg.select<SVGRectElement>('.btc-hover-rect');
    hoverRect
      .on('pointermove', (event: PointerEvent) => {
        const [mx] = d3.pointer(event, svgEl);
        const earnings = Math.max(
          0,
          Math.min(MAX_EARNINGS, xScale.invert(mx - MARGIN.left)),
        );
        const nearest = currentSchedule.reduce((prev, curr) =>
          Math.abs(curr.grossEarnings - earnings) <
          Math.abs(prev.grossEarnings - earnings)
            ? curr
            : prev,
        );

        const tt = tooltipRef.current;
        if (tt) {
          showTooltip(
            tt,
            event,
            `Earnings: £${nearest.grossEarnings.toFixed(0)}/mo | UC: £${nearest.ucAmount.toFixed(2)} | Net: £${nearest.netIncome.toFixed(2)} | EMR: ${nearest.effectiveMarginalRate}%`,
          );
        }
        onHover(
          `Gross earnings £${nearest.grossEarnings.toFixed(0)}, UC £${nearest.ucAmount.toFixed(2)}, net income £${nearest.netIncome.toFixed(2)}, effective marginal rate ${nearest.effectiveMarginalRate} percent`,
        );
        highlightSourceRef.current = 'hover';
        onHighlight(nearest.grossEarnings);
      })
      .on('pointerleave', () => {
        const tt = tooltipRef.current;
        if (tt) hideTooltip(tt);
        highlightSourceRef.current = 'hover';
        onHighlight(null);
      });

    // Suppress transitions when reduced-motion is requested.
    // (No animated transitions used in this chart; placeholder for future use.)
    void reducedMotion;

    // Record key values for external derivation (not needed inside effect but
    // referenced here to document exhaustion metrics)
    void exhaustionEarnings;
    void exhaustionNetIncome;

  }, [
    xScale,
    yScale,
    innerW,
    innerH,
    currentSchedule,
    comparisonSchedule,
    showComparison,
    highlightedEarnings,
    reducedMotion,
    onHighlight,
    onHover,
  ]);

  // ── ARIA spotlight announcement (slider-driven) ────────────────────────────

  useEffect(() => {
    // Skip when the highlight was set by pointer hover — pointermove already
    // called onHover directly. Reset source to 'slider' so the next slider
    // interaction is announced.
    if (highlightSourceRef.current === 'hover') {
      highlightSourceRef.current = 'slider';
      return;
    }
    if (highlightedEarnings === null) return;
    const nearest = currentSchedule.reduce((prev, curr) =>
      Math.abs(curr.grossEarnings - highlightedEarnings) <
      Math.abs(prev.grossEarnings - highlightedEarnings)
        ? curr
        : prev,
    );
    onHover(
      `Spotlight: £${nearest.grossEarnings.toFixed(0)} gross earnings, UC £${nearest.ucAmount.toFixed(2)}, net income £${nearest.netIncome.toFixed(2)}, effective marginal rate ${nearest.effectiveMarginalRate} percent`,
    );
  }, [highlightedEarnings, currentSchedule, onHover]);

  // ── Tooltip cleanup on unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        destroyTooltip(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="btc-chart-container">
      <svg
        ref={svgRef}
        className="btc-svg"
        width={width}
        height={height}
        role="img"
        aria-label="Benefit taper calculator chart showing UC amount and net income against gross monthly earnings"
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Poverty trap zone shading */}
          <g className="btc-poverty-zone" />

          {/* UC benefit area fill */}
          <path className="btc-uc-area" />

          {/* UC benefit line */}
          <path className="btc-uc-line" />

          {/* Net income line (current policy) */}
          <path className="btc-net-income-line" />

          {/* Comparison net income line (pre-2021, dashed) */}
          <path className="btc-comparison-line" display="none" />

          {/* Work allowance vertical marker */}
          <g className="btc-work-allowance-marker" />

          {/* UC exhaustion vertical marker + annotation */}
          <g className="btc-exhaustion-marker" />

          {/* Spotlight crosshair */}
          <g className="btc-spotlight-crosshair" />

          {/* Axes — rendered by D3 via renderXAxis / renderYAxis */}
          <g className="btc-x-axis" transform={`translate(0,${innerH})`} />
          <g className="btc-y-axis" />

          {/* Transparent hover rect (on top, captures pointer events) */}
          <rect
            className="btc-hover-rect"
            x={0}
            y={0}
            width={innerW > 0 ? innerW : 0}
            height={innerH > 0 ? innerH : 0}
            fill="transparent"
          />
        </g>
      </svg>
    </div>
  );
}

// ─── Main exported component ───────────────────────────────────────────────────

export interface BenefitTaperCalculatorProps {
  /** Optional extra CSS class on the outermost wrapper. */
  className?: string;
}

export function BenefitTaperCalculator({ className }: BenefitTaperCalculatorProps) {
  // ── State ──────────────────────────────────────────────────────────────────

  const [hasHousingElement, setHasHousingElement] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [highlightedEarnings, setHighlightedEarnings] = useState<number | null>(null);
  /** Adjustable taper rate as an integer percentage (40–75). */
  const [taperRatePct, setTaperRatePct] = useState(TAPER_RATE_DEFAULT);
  /** ARIA live-region message updated by chart hover and control changes. */
  const [liveMsg, setLiveMsg] = useState('');

  const reducedMotion = useReducedMotion();

  // ── Derived schedules ──────────────────────────────────────────────────────

  /** Dynamic schedule built from the slider value. */
  const currentSchedule = useMemo(() => {
    const dynamicParams = { ...CURRENT_PARAMS, taperRate: taperRatePct / 100 };
    return computeUCSchedule(dynamicParams, hasHousingElement, SCHEDULE_STEPS);
  }, [taperRatePct, hasHousingElement]);

  /** Pre-2021 63% reference schedule — always shown as a dashed reference line. */
  const comparisonSchedule = useMemo(
    () =>
      showComparison
        ? computeUCSchedule(PRE_2021_PARAMS, hasHousingElement, SCHEDULE_STEPS)
        : null,
    [showComparison, hasHousingElement],
  );

  /** Annualised fiscal cost delta relative to 55% baseline (£bn). */
  const fiscalDelta = useMemo(
    () => computeFiscalCostDelta(taperRatePct),
    [taperRatePct],
  );

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleHover = useCallback((msg: string) => {
    setLiveMsg(msg);
  }, []);

  // Announce when controls change (work allowance + exhaustion point).
  useEffect(() => {
    const exhaustionResult = currentSchedule.find((d) => d.ucAmount === 0);
    const workAllowance = hasHousingElement ? 404 : 673;
    if (exhaustionResult) {
      setLiveMsg(
        `Taper rate: ${taperRatePct}%. Work allowance: £${workAllowance}. UC exhausts at £${exhaustionResult.grossEarnings.toFixed(0)} gross earnings.`,
      );
    }
  }, [currentSchedule, hasHousingElement, taperRatePct]);

  // ── Derived context values for annotations / text description ─────────────

  const workAllowance = hasHousingElement ? 404 : 673;

  const exhaustionResult = currentSchedule.find((d) => d.ucAmount === 0);
  const ucExhaustsAt = exhaustionResult?.grossEarnings ?? null;

  // Contextual annotation text — reflects the active slider value.
  const keptPerPound = 100 - taperRatePct;
  const annotationText =
    taperRatePct === TAPER_RATE_DEFAULT
      ? `At the current ${taperRatePct}% taper, you keep ${keptPerPound}p of every £1 earned above the work allowance threshold.`
      : taperRatePct < TAPER_RATE_DEFAULT
        ? `At ${taperRatePct}% — lower than the current 55% — claimants keep ${keptPerPound}p per £1, making work pay more. The estimated fiscal cost is £${Math.abs(fiscalDelta).toFixed(1)}bn/year more than the baseline.`
        : `At ${taperRatePct}% — higher than the current 55% — claimants keep only ${keptPerPound}p per £1. The estimated saving is £${Math.abs(fiscalDelta).toFixed(1)}bn/year relative to the 55% baseline.`;

  // Text description for TextDescriptionToggle
  const textDescription = [
    `Taper rate: ${taperRatePct}% (adjustable via slider).`,
    `Work allowance threshold applied: £${workAllowance}/month${hasHousingElement ? ' (with housing element)' : ' (no housing element)'}.`,
    `UC exhausts at approximately £${ucExhaustsAt?.toFixed(0) ?? 'N/A'} gross monthly earnings.`,
    taperRatePct !== TAPER_RATE_DEFAULT
      ? `Estimated fiscal delta vs 55% baseline: ${fiscalDelta >= 0 ? '+' : ''}£${fiscalDelta.toFixed(1)}bn/year.`
      : `Taper rate matches 55% baseline — no fiscal delta.`,
    showComparison
      ? `Reference line active: the pre-2021 63% taper is shown as a dashed line.`
      : `Reference line inactive. Enable it to compare with the pre-2021 63% taper.`,
  ].join(' ');

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`btc-wrapper${className ? ` ${className}` : ''}`}>

        {/* ── D3 SVG Chart ────────────────────────────────────────────────── */}
        <ResponsiveContainer className="btc-responsive" minHeight={420}>
          {({ width, height }) => (
            <BenefitTaperChart
              width={width}
              height={height}
              currentSchedule={currentSchedule}
              comparisonSchedule={comparisonSchedule}
              hasHousingElement={hasHousingElement}
              showComparison={showComparison}
              highlightedEarnings={highlightedEarnings}
              reducedMotion={reducedMotion}
              onHighlight={setHighlightedEarnings}
              onHover={handleHover}
            />
          )}
        </ResponsiveContainer>

        {/* ── Controls panel ──────────────────────────────────────────────── */}
        <div className="btc-controls" role="group" aria-label="Chart controls">

          {/* Household type */}
          <fieldset className="btc-fieldset">
            <legend className="btc-fieldset__legend">Household</legend>
            <label className="btc-radio-label">
              <input
                type="radio"
                name="housing-element"
                value="no-housing"
                checked={!hasHousingElement}
                onChange={() => setHasHousingElement(false)}
                className="btc-radio"
              />
              No housing element
              <span className="btc-radio-hint">Work allowance: £673/mo</span>
            </label>
            <label className="btc-radio-label">
              <input
                type="radio"
                name="housing-element"
                value="with-housing"
                checked={hasHousingElement}
                onChange={() => setHasHousingElement(true)}
                className="btc-radio"
              />
              With housing element
              <span className="btc-radio-hint">Work allowance: £404/mo</span>
            </label>
          </fieldset>

          {/* Comparison toggle */}
          <fieldset className="btc-fieldset">
            <legend className="btc-fieldset__legend">Reference line</legend>
            <label className="btc-checkbox-label">
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                className="btc-checkbox"
              />
              Show pre-2021 (63% taper)
            </label>
          </fieldset>

          {/* Taper rate slider */}
          <div className="btc-taper-control">
            <label htmlFor="btc-taper-slider" className="btc-spotlight-label">
              Taper rate:{' '}
              <span className="btc-spotlight-value">{taperRatePct}%</span>
              {taperRatePct !== TAPER_RATE_DEFAULT && (
                <span className="btc-taper-baseline-note">
                  {' '}(baseline: {TAPER_RATE_DEFAULT}%)
                </span>
              )}
            </label>
            <input
              id="btc-taper-slider"
              type="range"
              min={TAPER_RATE_MIN}
              max={TAPER_RATE_MAX}
              step={1}
              value={taperRatePct}
              onChange={(e) => setTaperRatePct(Number(e.target.value))}
              className="btc-slider"
              aria-valuemin={TAPER_RATE_MIN}
              aria-valuemax={TAPER_RATE_MAX}
              aria-valuenow={taperRatePct}
              aria-valuetext={`${taperRatePct} percent taper rate`}
            />
            <div className="btc-taper-range-labels" aria-hidden="true">
              <span>{TAPER_RATE_MIN}% (more generous)</span>
              <span>{TAPER_RATE_MAX}% (cheaper)</span>
            </div>
          </div>

          {/* Fiscal cost readout */}
          <div className="btc-fiscal-readout" aria-live="polite" aria-atomic="true">
            <span className="btc-fiscal-readout__label">Fiscal cost vs 55% baseline:</span>{' '}
            {taperRatePct === TAPER_RATE_DEFAULT ? (
              <span className="btc-fiscal-readout__value btc-fiscal-readout__value--neutral">
                £0bn (at baseline)
              </span>
            ) : fiscalDelta > 0 ? (
              <span className="btc-fiscal-readout__value btc-fiscal-readout__value--positive">
                +£{fiscalDelta.toFixed(1)}bn/year (more expensive)
              </span>
            ) : (
              <span className="btc-fiscal-readout__value btc-fiscal-readout__value--negative">
                −£{Math.abs(fiscalDelta).toFixed(1)}bn/year (cheaper)
              </span>
            )}
          </div>

          {/* Earnings spotlight slider */}
          <div className="btc-spotlight-control">
            <label htmlFor="btc-spotlight-slider" className="btc-spotlight-label">
              Spotlight earnings:{' '}
              <span className="btc-spotlight-value">
                {highlightedEarnings !== null
                  ? `£${highlightedEarnings}/month`
                  : 'Off'}
              </span>
            </label>
            <input
              id="btc-spotlight-slider"
              type="range"
              min={0}
              max={MAX_EARNINGS}
              step={10}
              value={highlightedEarnings ?? 0}
              onChange={(e) => setHighlightedEarnings(Number(e.target.value))}
              className="btc-slider"
              aria-valuemin={0}
              aria-valuemax={MAX_EARNINGS}
              aria-valuenow={highlightedEarnings ?? 0}
              aria-valuetext={
                highlightedEarnings !== null
                  ? `£${highlightedEarnings} per month`
                  : 'Off'
              }
            />
            {highlightedEarnings !== null && (
              <button
                type="button"
                className="btc-spotlight-clear"
                onClick={() => setHighlightedEarnings(null)}
                aria-label="Clear earnings spotlight"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Contextual annotation zone ───────────────────────────────────── */}
        <div className="btc-annotation" aria-live="polite">
          <p className="btc-annotation__text">{annotationText}</p>
          <p className="btc-annotation__link">
            See{' '}
            <a href="/counting-lives/ch16-the-score">
              Ch. 16 — The Score
            </a>{' '}
            for how taper rates relate to algorithmic benefit design.
          </p>
        </div>

        {/* ── ARIA live region ─────────────────────────────────────────────── */}
        <AriaLiveRegion message={liveMsg} />
      </div>
    </TextDescriptionToggle>
  );
}
