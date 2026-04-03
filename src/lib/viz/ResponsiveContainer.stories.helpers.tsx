/**
 * ResponsiveContainer.stories.helpers.tsx
 * Task 3.1 — Agent_Interactive_Core
 *
 * Helper components for ResponsiveContainer.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (which uses es-module-lexer and cannot parse complex JSX) does not
 * process it. Complex JSX with deep nesting and render props is safe here.
 */

import { useEffect, useState } from 'react';
import { getPaletteColor } from './scales';
import { TextDescriptionToggle } from './a11y/TextDescriptionToggle';

/** Placeholder bar chart SVG used in the TextDescriptionToggle story. */
export function PlaceholderViz({ width = 400, height = 200 }: { width?: number; height?: number }) {
  const barData = [0.2, 0.5, 0.8, 0.4, 0.65];
  const barWidth = width / barData.length;

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label="Sample bar chart placeholder"
      style={{ display: 'block' }}
    >
      <rect width={width} height={height} fill="var(--color-tda-warm-grey)" rx={8} />
      {barData.map((v, i) => (
        <rect
          key={i}
          x={i * barWidth + 10}
          y={height - v * (height - 20) - 10}
          width={barWidth - 20}
          height={v * (height - 20)}
          fill="var(--color-tda-teal)"
          rx={2}
        />
      ))}
    </svg>
  );
}

/** Placeholder SVG for the ResponsiveContainer render-prop story. */
export function ResponsivePlaceholder({ width, height }: { width: number; height: number }) {
  return (
    <svg
      width={width}
      height={height}
      aria-label={`Placeholder SVG — ${width}×${height}px`}
    >
      <rect width={width} height={height} fill="var(--color-tda-warm-grey)" rx={8} />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-neutral-muted)"
        fontFamily="var(--font-ui)"
        fontSize={14}
      >
        {width} × {height} px
      </text>
    </svg>
  );
}

/** Pre-assembled TextDescriptionToggle + PlaceholderViz demo for story (b). */
export function TextDescriptionDemo() {
  return (
    <TextDescriptionToggle description="Bar chart with five bars. Bars represent values of approximately 20%, 50%, 80%, 40%, and 65% from left to right. The third bar is the tallest.">
      <PlaceholderViz />
    </TextDescriptionToggle>
  );
}

/** Renders all eight viz palette tokens as labelled colour swatches. */
export function SwatchStrip() {
  const [swatches, setSwatches] = useState<Array<{ token: string; value: string }>>([]);

  useEffect(() => {
    const tokens = Array.from({ length: 8 }, (_, i) => {
      const token = `--color-viz-${i + 1}`;
      return { token, value: getPaletteColor(token) };
    });
    setSwatches(tokens);
  }, []);

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-neutral-muted)',
          marginBottom: 'var(--space-3)',
        }}
      >
        Okabe-Ito viz palette — values read from CSS custom properties at runtime
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {swatches.map(({ token, value }) => (
          <div key={token} style={{ textAlign: 'center', width: 80 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-md)',
                background: value,
                border: '1px solid var(--color-neutral-border)',
                margin: '0 auto var(--space-1)',
              }}
              title={`${token} = ${value}`}
            />
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                display: 'block',
                color: 'var(--color-neutral-muted)',
              }}
            >
              {token}
            </code>
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                display: 'block',
                color: 'var(--color-neutral-body)',
              }}
            >
              {value}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
