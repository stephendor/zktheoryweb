/**
 * ShapInstabilityDemo.tsx — Task 6.1b — Agent_Interactive_Advanced
 *
 * Interactive SHAP Instability Demonstrator.
 *
 * Shows a near-threshold welfare claimant whose SHAP explanation can shift
 * dramatically when feature values are perturbed slightly — while the
 * predicted score stays approximately constant.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────┐
 *   │  Score gauge: predicted probability + τ=0.5     │
 *   ├──────────────────────────┬──────────────────────┤
 *   │  SHAP bar chart          │  Δ SHAP vs Δ score   │
 *   │  current vs baseline     │  instability summary │
 *   ├──────────────────────────┴──────────────────────┤
 *   │  Feature sliders (nudge each of the 4 features) │
 *   ├─────────────────────────────────────────────────┤
 *   │  Reset button                                    │
 *   └─────────────────────────────────────────────────┘
 */

import { useState, useMemo, useCallback } from 'react';

import { AriaLiveRegion } from '@lib/viz/a11y/AriaLiveRegion';
import { TextDescriptionToggle } from '@lib/viz/a11y/TextDescriptionToggle';

import {
  computeShap,
  shapInstability,
  scoreDelta,
  BASELINE_FEATURES,
  BASELINE_SHAP,
  FEATURE_NAMES,
  FEATURE_MIN,
  FEATURE_MAX,
  FEATURE_LABELS,
} from './ShapInstability.data';
import type { Features } from './ShapInstability.data';
import './ShapInstabilityDemo.css';

// ─── Score gauge ──────────────────────────────────────────────────────────────

const DECISION_THRESHOLD = 0.5;

function ScoreGauge({ score, baseline }: { score: number; baseline: number }) {
  const pct = Math.round(score * 100);
  const aboveThreshold = score >= DECISION_THRESHOLD;

  return (
    <div
      className="shap-gauge-wrapper"
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Predicted risk score: ${pct}%`}
    >
      <div className="shap-gauge-header">
        <span className="shap-gauge-title">Predicted risk score</span>
        <span
          className={`shap-gauge-badge ${aboveThreshold ? 'shap-gauge-badge--flagged' : 'shap-gauge-badge--clear'}`}
        >
          {aboveThreshold ? 'FLAGGED (≥ τ)' : 'CLEARED (< τ)'}
        </span>
      </div>
      <div className="shap-gauge-bar-track">
        {/* Threshold line */}
        <div
          className="shap-gauge-threshold"
          style={{ left: `${DECISION_THRESHOLD * 100}%` }}
          aria-label={`Decision threshold τ = ${DECISION_THRESHOLD}`}
        />
        {/* Fill */}
        <div
          className="shap-gauge-fill"
          style={{
            width: `${pct}%`,
            background: aboveThreshold
              ? 'var(--color-viz-alert, #cc3311)'
              : 'var(--color-viz-3, #009e73)',
          }}
        />
        {/* Baseline marker */}
        <div
          className="shap-gauge-baseline-marker"
          style={{ left: `${baseline * 100}%` }}
          title="Baseline score"
        />
      </div>
      <div className="shap-gauge-labels" aria-hidden="true">
        <span>0</span>
        <span style={{ marginLeft: `${DECISION_THRESHOLD * 100}%`, transform: 'translateX(-50%)', position: 'absolute' }}>
          τ=0.5
        </span>
        <span style={{ marginLeft: 'auto' }}>1</span>
      </div>
      <div className="shap-gauge-score-line">
        <span className="shap-gauge-score-value">{(score).toFixed(3)}</span>
        <span className="shap-gauge-score-note">
          {score > baseline ? '▲' : score < baseline ? '▼' : '='} from baseline {baseline.toFixed(3)}
        </span>
      </div>
    </div>
  );
}

// ─── SHAP bar chart ───────────────────────────────────────────────────────────

function ShapBarChart({
  current,
  baseline,
}: {
  current: Features;
  baseline: Features;
}) {
  // Find symmetric range
  const maxAbs = Math.max(
    ...current.map(Math.abs),
    ...baseline.map(Math.abs),
    0.05,
  );

  return (
    <div className="shap-chart-wrapper" aria-label="SHAP value comparison">
      <div className="shap-chart-header">
        <span className="shap-chart-title">SHAP attributions</span>
        <div className="shap-chart-legend" aria-label="colour legend">
          <span className="shap-legend-swatch shap-legend-swatch--current" />
          <span>Current</span>
          <span className="shap-legend-swatch shap-legend-swatch--baseline" />
          <span>Baseline</span>
        </div>
      </div>
      <div className="shap-chart-rows">
        {FEATURE_NAMES.map((name, i) => {
          const cv = current[i];
          const bv = baseline[i];
          const changed = Math.abs(cv - bv) > 0.005;
          return (
            <div key={name} className="shap-bar-row">
              <span className="shap-feature-label" title={name}>
                {name}
              </span>
              <div className="shap-bar-container" aria-hidden="true">
                {/* centre line */}
                <div className="shap-bar-zero" />
                {/* Baseline bar (faded) */}
                {bv !== 0 && (
                  <div
                    className="shap-bar shap-bar--baseline"
                    style={{
                      width: `${(Math.abs(bv) / maxAbs) * 50}%`,
                      [bv >= 0 ? 'left' : 'right']: '50%',
                      transform: bv >= 0 ? 'none' : 'none',
                    }}
                  />
                )}
                {/* Current bar */}
                {cv !== 0 && (
                  <div
                    className={`shap-bar shap-bar--current ${cv >= 0 ? 'shap-bar--positive' : 'shap-bar--negative'}`}
                    style={{
                      width: `${(Math.abs(cv) / maxAbs) * 50}%`,
                      [cv >= 0 ? 'left' : 'right']: '50%',
                    }}
                  />
                )}
              </div>
              <span className={`shap-value-label ${changed ? 'shap-value-label--changed' : ''}`}>
                {cv >= 0 ? '+' : ''}{cv.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="shap-sum-note" aria-live="polite">
        Sum = {current.reduce((a, b) => a + b, 0).toFixed(3)}
        <span className="shap-sum-note-sub"> (= score − baseline)</span>
      </div>
    </div>
  );
}

// ─── Instability summary ──────────────────────────────────────────────────────

function InstabilitySummary({
  shapChange,
  scoreChange,
}: {
  shapChange: number;
  scoreChange: number;
}) {
  const ratio = scoreChange > 0.001 ? shapChange / scoreChange : null;

  return (
    <div className="shap-instability-panel" aria-live="polite" aria-atomic="true">
      <h3 className="shap-instability-heading">Instability</h3>
      <div className="shap-instability-row">
        <span className="shap-instability-label">Δ Score</span>
        <span className="shap-instability-value">{scoreChange.toFixed(4)}</span>
      </div>
      <div className="shap-instability-row">
        <span className="shap-instability-label">Δ SHAP (max feature)</span>
        <span className={`shap-instability-value ${shapChange > 0.05 ? 'shap-instability-value--high' : ''}`}>
          {shapChange.toFixed(4)}
        </span>
      </div>
      {ratio !== null && (
        <div className="shap-instability-row">
          <span className="shap-instability-label">Ratio Δ SHAP / Δ score</span>
          <span className={`shap-instability-value ${ratio > 2 ? 'shap-instability-value--high' : ''}`}>
            {ratio.toFixed(1)}×
          </span>
        </div>
      )}
      <p className="shap-instability-note">
        {shapChange < 0.01
          ? 'No significant change yet. Adjust a feature to see instability.'
          : ratio !== null && ratio > 2
          ? `The explanation shifted ${ratio.toFixed(1)}× more than the score did — the same classification, a different story.`
          : 'Explanation shifted. Score change is comparable.'}
      </p>
    </div>
  );
}

// ─── Feature sliders ──────────────────────────────────────────────────────────

function FeatureSliders({
  features,
  onChange,
}: {
  features: Features;
  onChange: (i: number, v: number) => void;
}) {
  return (
    <div className="shap-sliders" role="group" aria-label="Feature value controls">
      {FEATURE_NAMES.map((name, i) => {
        const labels = FEATURE_LABELS[name];
        const baseline = BASELINE_FEATURES[i];
        const delta = features[i] - baseline;
        return (
          <div key={name} className="shap-slider-row">
            <div className="shap-slider-header">
              <label htmlFor={`shap-slider-${i}`} className="shap-slider-label">
                {name}
              </label>
              <span className="shap-slider-delta">
                {delta > 0.001 ? `+${delta.toFixed(2)}` : delta < -0.001 ? delta.toFixed(2) : '0'}
                {' '}from baseline
              </span>
            </div>
            <input
              id={`shap-slider-${i}`}
              type="range"
              min={FEATURE_MIN[i]}
              max={FEATURE_MAX[i]}
              step={0.01}
              value={features[i]}
              onChange={(e) => onChange(i, Number(e.target.value))}
              className="shap-slider"
              aria-valuemin={FEATURE_MIN[i]}
              aria-valuemax={FEATURE_MAX[i]}
              aria-valuenow={features[i]}
              aria-valuetext={`${name}: ${features[i].toFixed(2)}`}
            />
            <div className="shap-range-endpoints" aria-hidden="true">
              <span>{labels.low}</span>
              <span>{features[i].toFixed(2)}</span>
              <span>{labels.high}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface ShapInstabilityDemoProps {
  className?: string;
}

export function ShapInstabilityDemo({ className }: ShapInstabilityDemoProps) {
  const [features, setFeatures] = useState<Features>([...BASELINE_FEATURES] as Features);
  const [liveMsg, setLiveMsg] = useState('');

  const currentShap = useMemo(() => computeShap(features), [features]);

  const shapChange = useMemo(
    () => shapInstability(currentShap.shapValues, BASELINE_SHAP.shapValues),
    [currentShap],
  );

  const scoreChange = useMemo(
    () => scoreDelta(features, BASELINE_FEATURES),
    [features],
  );

  const handleSlider = useCallback(
    (i: number, v: number) => {
      setFeatures((prev) => {
        const next = [...prev] as Features;
        next[i] = v;
        const shap = computeShap(next);
        const delta = shap.score - BASELINE_SHAP.score;
        const shapCh = shapInstability(shap.shapValues, BASELINE_SHAP.shapValues);
        setLiveMsg(
          `${FEATURE_NAMES[i]} = ${v.toFixed(2)}. Score: ${shap.score.toFixed(3)} ` +
          `(Δ ${delta > 0 ? '+' : ''}${delta.toFixed(3)}). ` +
          `SHAP instability: ${shapCh.toFixed(4)}.`,
        );
        return next;
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    setFeatures([...BASELINE_FEATURES] as Features);
    setLiveMsg('Reset to baseline claimant.');
  }, []);

  const textDescription = [
    `Predicted score: ${currentShap.score.toFixed(3)} (${currentShap.score >= DECISION_THRESHOLD ? 'flagged' : 'cleared'}).`,
    `Baseline score: ${BASELINE_SHAP.score.toFixed(3)}.`,
    `SHAP values: ${FEATURE_NAMES.map((n, i) => `${n}: ${currentShap.shapValues[i].toFixed(3)}`).join(', ')}.`,
    `Score change: ${scoreChange.toFixed(4)}. Maximum SHAP change: ${shapChange.toFixed(4)}.`,
  ].join(' ');

  return (
    <TextDescriptionToggle description={textDescription}>
      <div className={`shap-wrapper${className ? ` ${className}` : ''}`}>

        {/* ── Score gauge ───────────────────────────────────────────────── */}
        <ScoreGauge score={currentShap.score} baseline={BASELINE_SHAP.score} />

        {/* ── Two column: SHAP bars + instability summary ───────────────── */}
        <div className="shap-two-col">
          <ShapBarChart
            current={currentShap.shapValues}
            baseline={BASELINE_SHAP.shapValues}
          />
          <InstabilitySummary shapChange={shapChange} scoreChange={scoreChange} />
        </div>

        {/* ── Feature sliders ───────────────────────────────────────────── */}
        <section aria-labelledby="shap-sliders-heading">
          <h3 id="shap-sliders-heading" className="shap-section-heading">
            Perturb the claimant's features
          </h3>
          <FeatureSliders features={features} onChange={handleSlider} />
        </section>

        {/* ── Reset ─────────────────────────────────────────────────────── */}
        <div className="shap-footer">
          <button type="button" className="shap-reset-btn" onClick={handleReset}>
            Reset to baseline claimant
          </button>
          <p className="shap-insight">
            The network uses the same weights for all inputs. Near the decision
            threshold, the local gradient can flip the dominant SHAP attribution
            between features — a different explanation for an almost-identical
            prediction.
          </p>
        </div>

        <AriaLiveRegion message={liveMsg} />
      </div>
    </TextDescriptionToggle>
  );
}
