/**
 * PointCloudEditor.stories.helpers.tsx — Task 3.7a — Agent_Interactive_Core
 *
 * Helper components for PointCloudEditor.stories.tsx.
 * Lives in a NON-story file so Storybook's inject-export-order-plugin
 * (es-module-lexer) does not process it. Complex JSX is safe here.
 */

import { useState } from 'react';
import { PointCloudEditor } from './PointCloudEditor';
import type { Point2D } from '@lib/tda/vietorisRips';

/**
 * Interactive demo wrapper that displays the live point array below the editor.
 * Used in the "default / interactive" story.
 */
export function PointCloudEditorDemo({
  initialPoints,
}: {
  initialPoints?: Point2D[];
}) {
  const [points, setPoints] = useState<Point2D[]>(initialPoints ?? []);

  return (
    <div style={{ fontFamily: 'var(--font-ui, system-ui, sans-serif)', maxWidth: 560 }}>
      <PointCloudEditor
        initialPoints={initialPoints}
        onPointsChange={setPoints}
      />
      <details
        style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-neutral-muted, #6b7280)' }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          Live point array ({points.length} pts)
        </summary>
        <pre
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'var(--color-surface, #f9fafb)',
            border: '1px solid var(--color-neutral-border, #e5e7eb)',
            borderRadius: 4,
            overflowX: 'auto',
            maxHeight: 200,
            fontSize: '0.75rem',
          }}
        >
          {JSON.stringify(points, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/** Pre-loaded Circle preset for the "Circle" story. */
export function CirclePresetDemo() {
  function circlePoints(n: number): Point2D[] {
    return Array.from({ length: n }, (_, i) => ({
      x: 0.5 + 0.38 * Math.cos((2 * Math.PI * i) / n),
      y: 0.5 + 0.38 * Math.sin((2 * Math.PI * i) / n),
      id: `circle-${i}`,
    }));
  }
  return (
    <div style={{ maxWidth: 560 }}>
      <PointCloudEditor initialPoints={circlePoints(8)} />
    </div>
  );
}

/** Pre-loaded Two Clusters preset. */
export function TwoClustersPresetDemo() {
  const offsets: [number, number][] = [[0, 0], [0.06, 0], [0, 0.06], [0.06, 0.06]];
  const pts: Point2D[] = [
    ...offsets.map(([dx, dy], i) => ({ x: 0.2 + dx, y: 0.5 + dy, id: `ca-${i}` })),
    ...offsets.map(([dx, dy], i) => ({ x: 0.74 + dx, y: 0.5 + dy, id: `cb-${i}` })),
  ];
  return (
    <div style={{ maxWidth: 560 }}>
      <PointCloudEditor initialPoints={pts} />
    </div>
  );
}

/** Pre-loaded Figure-8 preset. */
export function Figure8PresetDemo() {
  const sharedPt: Point2D = { x: 0.5, y: 0.5, id: 'f8-shared' };
  const n = 5;
  const rr = 0.18;
  const left = Array.from({ length: n }, (_, i) => {
    const a = Math.PI + (2 * Math.PI * (i + 1)) / (n + 1);
    return { x: 0.5 - rr * 1.5 + rr * Math.cos(a), y: 0.5 + rr * Math.sin(a), id: `f8-l${i}` };
  });
  const right = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * (i + 1)) / (n + 1);
    return { x: 0.5 + rr * 1.5 + rr * Math.cos(a), y: 0.5 + rr * Math.sin(a), id: `f8-r${i}` };
  });
  return (
    <div style={{ maxWidth: 560 }}>
      <PointCloudEditor initialPoints={[sharedPt, ...left, ...right]} />
    </div>
  );
}

/** Pre-loaded Random preset. */
export function RandomPresetDemo() {
  const pts: Point2D[] = Array.from({ length: 15 }, (_, i) => {
    const s1 = (1103515245 * (i * 17 + 7) + 12345) & 0x7fffffff;
    const s2 = (1103515245 * (s1 + 99) + 12345) & 0x7fffffff;
    return { x: 0.05 + ((s1 % 900) / 1000), y: 0.05 + ((s2 % 900) / 1000), id: `rnd-${i}` };
  });
  return (
    <div style={{ maxWidth: 560 }}>
      <PointCloudEditor initialPoints={pts} />
    </div>
  );
}
