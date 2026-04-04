/**
 * DecisionThresholdExplorer.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Interactive Decision Threshold Explorer.
 *
 * Presents a synthetic logistic regression model trained on welfare claim
 * data. Adjust the decision threshold τ and observe how TPR, FPR, and
 * sub-group disparity change in response.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────┐
 *   │  Metrics summary bar (TPR/FPR/Precision/F1)  │
 *   ├──────────────────────────┬──────────────────┤
 *   │  ROC curve + τ marker    │  Group A vs B    │
 *   │  (D3 SVG)                │  comparison bars │
 *   ├──────────────────────────┴──────────────────┤
 *   │  Score distribution (D3 histogram) + τ line  │
 *   ├─────────────────────────────────────────────┤
 *   │  Threshold slider + reset                    │
 *   └─────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';

import { ResponsiveContainer } from '@lib/viz/ResponsiveContainer';
import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';
import { useReducedMotion } from '@lib/viz/a11y/useReducedMotion';

import {
  computeThresholdMetrics,
  SYNTHETIC_CLAIMANTS,
  ROC_CURVE,
  AUC,
  THRESHOLD_DEFAULT,
  THRESHOLD_MIN,
  THRESHOLD_MAX,
  THRESHOLD_STEP,
  TOTAL_CLAIMANTS,
  GROUP_A_COUNT,
  GROUP_B_COUNT,
} from './DecisionThresholdExplorer.data';
import type { ThresholdMetrics } from './DecisionThresholdExplorer.data';
import './DecisionThresholdExplorer.css';

// ─── Metric tile ──────────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  subtitle,
  colour,
  raw,
}: {
  label: string;
  value: string;
  subtitle?: string;
  colour?: string;
  raw?: string;
}) {
  return (
    <div className="dte-metric-tile">
      <span className="dte-metric-label">{label}</span>
      <span
        className="dte-metric-value"
        style={colour ? { color: colour } : undefined}
      >
        {value}
      </span>
      {(subtitle || raw) && (
        <span className="dte-metric-sub">{raw ?? subtitle}</span>
      )}
    </div>
  );
}

// ─── ROC curve (D3) ───────────────────────────────────────────────────────────

const ROC_MARGIN = { top: 16, right: 16, bottom: 44, left: 52 };

function RocChart({
  width,
  height,
  threshold,
  reducedMotion,
}: {
  width: number;
  height: number;
  threshold: number;
  reducedMotion: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const innerW = width - ROC_MARGIN.left - ROC_MARGIN.right;
  const innerH = height - ROC_MARGIN.top - ROC_MARGIN.bottom;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || innerW <= 0 || innerH <= 0) return;
    const g = d3.select(svgEl).select<SVGGElement>('.dte-roc-g');

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    // Diagonal reference
    g.select('.dte-roc-diag').remove();
    g.append('line')
      .attr('class', 'dte-roc-diag')
      .attr('x1', 0).attr('y1', innerH)
      .attr('x2', innerW).attr('y2', 0)
      .attr('stroke', 'var(--color-neutral-border, #dedbd4)')
      .attr('stroke-dasharray', '4 3')
      .attr('stroke-width', 1);

    // ROC path
    const lineGen = d3.line<typeof ROC_CURVE[0]>()
      .x((d) => xScale(d.fpr))
      .y((d) => yScale(d.tpr))
      .curve(d3.curveStepAfter);

    g.select('.dte-roc-path').remove();
    g.append('path')
      .datum([...ROC_CURVE].sort((a, b) => a.fpr - b.fpr))
      .attr('class', 'dte-roc-path')
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-viz-3, #009e73)')
      .attr('stroke-width', 2);

    // Current threshold marker
    // Find the ROC point closest to current threshold
    const sortedByThreshold = [...ROC_CURVE].sort(
      (a, b) => Math.abs(a.threshold - threshold) - Math.abs(b.threshold - threshold),
    );
    const nearest = sortedByThreshold[0];

    g.select('.dte-roc-marker').remove();
    g.append('circle')
      .attr('class', 'dte-roc-marker')
      .attr('cx', xScale(nearest.fpr))
      .attr('cy', yScale(nearest.tpr))
      .attr('r', 6)
      .attr('fill', 'var(--color-viz-1, #e69f00)')
      .attr('stroke', 'var(--color-neutral-surface, #fff)')
      .attr('stroke-width', 2);

    // AUC label
    g.select('.dte-roc-auc').remove();
    g.append('text')
      .attr('class', 'dte-roc-auc')
      .attr('x', innerW - 4)
      .attr('y', innerH - 4)
      .attr('text-anchor', 'end')
      .attr('font-size', 10)
      .attr('font-family', 'var(--font-mono, monospace)')
      .attr('fill', 'var(--color-neutral-muted, #555)')
      .text(`AUC = ${AUC.toFixed(3)}`);

    // Axes
    g.select<SVGGElement>('.dte-roc-xaxis').call(
      d3.axisBottom(xScale).ticks(4).tickFormat(d3.format('.1f')),
    );
    g.select<SVGGElement>('.dte-roc-yaxis').call(
      d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('.1f')),
    );

    void reducedMotion;
  }, [innerW, innerH, threshold, reducedMotion]);

  return (
    <svg
      ref={svgRef}
      className="dte-roc-svg"
      width={width}
      height={height}
      role="img"
      aria-label={`ROC curve. AUC = ${AUC.toFixed(3)}. Orange dot shows current threshold position.`}
    >
      <g
        className="dte-roc-g"
        transform={`translate(${ROC_MARGIN.left},${ROC_MARGIN.top})`}
      >
        <g className="dte-roc-xaxis" transform={`translate(0,${innerH})`} />
        <g className="dte-roc-yaxis" />
        {/* Axis titles */}
        <text
          x={innerW / 2}
          y={innerH + 36}
          textAnchor="middle"
          className="dte-axis-title"
        >
          False Positive Rate
        </text>
        <text
          transform={`translate(-36,${innerH / 2})rotate(-90)`}
          textAnchor="middle"
          className="dte-axis-title"
        >
          True Positive Rate
        </text>
      </g>
    </svg>
  );
}

// ─── Score distribution chart (D3 histogram) ─────────────────────────────────

const HIST_MARGIN = { top: 12, right: 16, bottom: 44, left: 52 };

function ScoreDistChart({
  width,
  height,
  threshold,
  reducedMotion,
}: {
  width: number;
  height: number;
  threshold: number;
  reducedMotion: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const innerW = width - HIST_MARGIN.left - HIST_MARGIN.right;
  const innerH = height - HIST_MARGIN.top - HIST_MARGIN.bottom;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || innerW <= 0 || innerH <= 0) return;
    const g = d3.select(svgEl).select<SVGGElement>('.dte-hist-g');

    const positives = SYNTHETIC_CLAIMANTS.filter((c) => c.trueLabel === 1).map((c) => c.score);
    const negatives = SYNTHETIC_CLAIMANTS.filter((c) => c.trueLabel === 0).map((c) => c.score);

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerW]);
    const binGen = d3.bin().domain([0, 1]).thresholds(20);
    const posBins = binGen(positives);
    const negBins = binGen(negatives);
    const maxCount = d3.max([...posBins, ...negBins], (d) => d.length) ?? 1;
    const yScale = d3.scaleLinear().domain([0, maxCount]).range([innerH, 0]);

    const barWidth = (b: d3.Bin<number, number>) =>
      Math.max(0, xScale(b.x1!) - xScale(b.x0!) - 1);

    // Draw bars for positives and negatives
    const drawBars = (bins: d3.Bin<number, number>[], cls: string, colour: string) => {
      g.selectAll(`.${cls}`).remove();
      g.selectAll(`.${cls}`)
        .data(bins)
        .join('rect')
        .attr('class', cls)
        .attr('x', (d) => xScale(d.x0!))
        .attr('y', (d) => yScale(d.length))
        .attr('width', (d) => barWidth(d))
        .attr('height', (d) => innerH - yScale(d.length))
        .attr('fill', colour)
        .attr('opacity', 0.55);
    };

    drawBars(negBins, 'dte-neg-bar', 'var(--color-viz-2, #56b4e9)');
    drawBars(posBins, 'dte-pos-bar', 'var(--color-viz-3, #009e73)');

    // Threshold vertical line
    g.select('.dte-hist-threshold').remove();
    g.append('line')
      .attr('class', 'dte-hist-threshold')
      .attr('x1', xScale(threshold)).attr('x2', xScale(threshold))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', 'var(--color-viz-1, #e69f00)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5 3');

    // Label
    g.select('.dte-hist-tau-label').remove();
    const labelX = Math.min(xScale(threshold) + 4, innerW - 28);
    g.append('text')
      .attr('class', 'dte-hist-tau-label')
      .attr('x', labelX)
      .attr('y', 10)
      .attr('font-size', 10)
      .attr('font-family', 'var(--font-mono, monospace)')
      .attr('fill', 'var(--color-viz-1, #e69f00)')
      .text(`τ`);

    // Axes
    g.select<SVGGElement>('.dte-hist-xaxis').call(
      d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.1f')),
    );
    g.select<SVGGElement>('.dte-hist-yaxis').call(
      d3.axisLeft(yScale).ticks(4),
    );

    void reducedMotion;
  }, [innerW, innerH, threshold, reducedMotion]);

  return (
    <svg
      ref={svgRef}
      className="dte-hist-svg"
      width={width}
      height={height}
      role="img"
      aria-label="Score distribution. Green bars = genuinely high-risk claimants. Blue bars = genuinely low-risk. Orange dashed line = decision threshold τ."
    >
      <g
        className="dte-hist-g"
        transform={`translate(${HIST_MARGIN.left},${HIST_MARGIN.top})`}
      >
        <g className="dte-hist-xaxis" transform={`translate(0,${innerH})`} />
        <g className="dte-hist-yaxis" />
        <text
          x={(innerW) / 2}
          y={innerH + 36}
          textAnchor="middle"
          className="dte-axis-title"
        >
          Predicted probability score
        </text>
      </g>
    </svg>
  );
}

// ─── Group comparison bars ────────────────────────────────────────────────────

function GroupComparisonBar({
  labelA,
  valueA,
  labelB,
  valueB,
  metric,
  colour,
}: {
  labelA: string;
  valueA: number;
  labelB: string;
  valueB: number;
  metric: string;
  colour: string;
}) {
  const maxVal = Math.max(valueA, valueB, 0.01);
  return (
    <div className="dte-group-row">
      <div className="dte-group-metric-label">{metric}</div>
      <div className="dte-group-bars">
        {[{ label: labelA, value: valueA }, { label: labelB, value: valueB }].map((g) => (
          <div key={g.label} className="dte-group-bar-row">
            <span className="dte-group-label">{g.label}</span>
            <div className="dte-group-bar-track">
              <div
                className="dte-group-bar-fill"
                style={{
                  width: `${(g.value / maxVal) * 100}%`,
                  background: colour,
                }}
                aria-label={`${g.label}: ${(g.value * 100).toFixed(1)}%`}
              />
            </div>
            <span className="dte-group-bar-value">
              {(g.value * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface DecisionThresholdExplorerProps {
  className?: string;
}

export function DecisionThresholdExplorer({ className }: DecisionThresholdExplorerProps) {
  const [threshold, setThreshold] = useState(THRESHOLD_DEFAULT);
  const [liveMsg, setLiveMsg] = useState('');

  const reducedMotion = useReducedMotion();

  const metrics: ThresholdMetrics = useMemo(
    () => computeThresholdMetrics(SYNTHETIC_CLAIMANTS, threshold),
    [threshold],
  );

  const handleThresholdChange = useCallback((val: number) => {
    setThreshold(val);
    const m = computeThresholdMetrics(SYNTHETIC_CLAIMANTS, val);
    setLiveMsg(
      `Threshold τ = ${val.toFixed(2)}. Overall: TPR ${(m.overall.tpr * 100).toFixed(1)}%, ` +
      `FPR ${(m.overall.fpr * 100).toFixed(1)}%. ` +
      `Group A TPR ${(m.groupA.tpr * 100).toFixed(1)}%, ` +
      `Group B TPR ${(m.groupB.tpr * 100).toFixed(1)}%.`,
    );
  }, []);

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  const textDescription = [
    `Decision threshold τ = ${threshold.toFixed(2)}.`,
    `Dataset: ${TOTAL_CLAIMANTS} synthetic claimants (${GROUP_A_COUNT} Group A, ${GROUP_B_COUNT} Group B).`,
    `Model AUC = ${AUC.toFixed(3)}.`,
    `Overall: TPR ${pct(metrics.overall.tpr)}, FPR ${pct(metrics.overall.fpr)}, Precision ${pct(metrics.overall.precision)}, F1 ${pct(metrics.overall.f1)}.`,
    `Group A: TPR ${pct(metrics.groupA.tpr)}, FPR ${pct(metrics.groupA.fpr)}.`,
    `Group B: TPR ${pct(metrics.groupB.tpr)}, FPR ${pct(metrics.groupB.fpr)}.`,
  ].join(' ');

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`dte-wrapper${className ? ` ${className}` : ''}`}>

        {/* ── Metrics summary ───────────────────────────────────────────── */}
        <div
          className="dte-metrics-row"
          aria-live="polite"
          aria-atomic="true"
          role="region"
          aria-label="Classification metrics summary"
        >
          <MetricTile
            label="True Pos. Rate"
            value={pct(metrics.overall.tpr)}
            subtitle={`${metrics.overall.tp} of ${metrics.overall.tp + metrics.overall.fn} high-risk caught`}
            colour="var(--color-viz-3, #009e73)"
          />
          <MetricTile
            label="False Pos. Rate"
            value={pct(metrics.overall.fpr)}
            subtitle={`${metrics.overall.fp} of ${metrics.overall.fp + metrics.overall.tn} low-risk wrongly flagged`}
            colour="var(--color-viz-alert, #cc3311)"
          />
          <MetricTile
            label="Precision"
            value={pct(metrics.overall.precision)}
            subtitle="of flagged claimants who are truly high-risk"
          />
          <MetricTile
            label="F1 score"
            value={pct(metrics.overall.f1)}
            subtitle="harmonic mean of TPR and Precision"
          />
        </div>

        {/* ── Two-column: ROC + Group comparison ───────────────────────── */}
        <div className="dte-two-col">
          <section aria-labelledby="dte-roc-heading">
            <h3 id="dte-roc-heading" className="dte-section-heading">
              ROC curve
            </h3>
            <ResponsiveContainer className="dte-chart-box" minHeight={220}>
              {({ width, height }) => (
                <RocChart
                  width={width}
                  height={height}
                  threshold={threshold}
                  reducedMotion={reducedMotion}
                />
              )}
            </ResponsiveContainer>
          </section>

          <section aria-labelledby="dte-group-heading">
            <h3 id="dte-group-heading" className="dte-section-heading">
              Group A vs Group B
            </h3>
            <div className="dte-group-panel">
              <p className="dte-group-note">
                Group B has a higher true positive base rate (40% vs 20%) but worse
                model calibration — reflecting label bias.
              </p>
              <GroupComparisonBar
                metric="TPR (sensitivity)"
                labelA="Group A"
                valueA={metrics.groupA.tpr}
                labelB="Group B"
                valueB={metrics.groupB.tpr}
                colour="var(--color-viz-3, #009e73)"
              />
              <GroupComparisonBar
                metric="FPR (false alarms)"
                labelA="Group A"
                valueA={metrics.groupA.fpr}
                labelB="Group B"
                valueB={metrics.groupB.fpr}
                colour="var(--color-viz-alert, #cc3311)"
              />
            </div>
          </section>
        </div>

        {/* ── Score distribution ─────────────────────────────────────────── */}
        <section aria-labelledby="dte-dist-heading">
          <h3 id="dte-dist-heading" className="dte-section-heading">
            Score distribution
            <span className="dte-section-note">
              {' '}— green = genuinely high-risk · blue = genuinely low-risk
            </span>
          </h3>
          <ResponsiveContainer className="dte-chart-box" minHeight={180}>
            {({ width, height }) => (
              <ScoreDistChart
                width={width}
                height={height}
                threshold={threshold}
                reducedMotion={reducedMotion}
              />
            )}
          </ResponsiveContainer>
        </section>

        {/* ── Controls ──────────────────────────────────────────────────── */}
        <div className="dte-controls" role="group" aria-label="Threshold controls">
          <div className="dte-control-group">
            <label htmlFor="dte-threshold-slider" className="dte-label">
              Decision threshold τ:{' '}
              <span className="dte-tau-value">{threshold.toFixed(2)}</span>
              <span className="dte-tau-note">
                {' '}— flag if score ≥ τ
              </span>
            </label>
            <input
              id="dte-threshold-slider"
              type="range"
              min={THRESHOLD_MIN}
              max={THRESHOLD_MAX}
              step={THRESHOLD_STEP}
              value={threshold}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="dte-slider"
              aria-valuemin={THRESHOLD_MIN}
              aria-valuemax={THRESHOLD_MAX}
              aria-valuenow={threshold}
              aria-valuetext={`τ = ${threshold.toFixed(2)}`}
            />
            <div className="dte-range-labels" aria-hidden="true">
              <span>{THRESHOLD_MIN} (flag almost everyone)</span>
              <span>0.50 (default)</span>
              <span>{THRESHOLD_MAX} (flag very few)</span>
            </div>
          </div>
          <button
            type="button"
            className="dte-reset-btn"
            onClick={() => handleThresholdChange(THRESHOLD_DEFAULT)}
          >
            Reset to τ = 0.50
          </button>
        </div>

        <AriaLiveRegion message={liveMsg} />
      </div>
    </TextDescriptionToggle>
  );
}
