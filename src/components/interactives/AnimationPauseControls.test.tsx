/**
 * AnimationPauseControls.test.tsx — Task 7.3 — Agent_Interactive_Advanced
 *
 * Vitest tests verifying pause/resume toggle buttons on the three
 * animation-driven interactive components:
 *   - FiltrationPlayground
 *   - PersistenceDiagramBuilder
 *   - PersistenceDiagramBuilder3D
 *
 * Tests cover:
 *   (1) Pause button renders with initial aria-label "Pause animation"
 *   (2) Clicking the button toggles aria-label to "Resume animation"
 *   (3) When useReducedMotion() returns true, component initialises paused
 *       (button shows "Resume animation" on mount)
 *
 * Three.js / React Three Fiber are mocked to keep tests fast and WebGL-free.
 * ResizeObserver and window.matchMedia are mocked globally.
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Module mocks — hoisted before any imports by Vitest
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children: _children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'r3f-canvas' }),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({})),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Line: () => null,
}));

vi.mock('three', () => ({
  Vector3: class {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  },
  BufferGeometry: class {
    setAttribute() {}
    dispose() {}
  },
  BufferAttribute: class { constructor() {} },
  DoubleSide: 2,
  Mesh: class {},
}));

vi.mock('@lib/viz/scales', () => ({
  getPaletteColor: vi.fn(() => null),
}));

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------

// ResizeObserver — used by ResponsiveContainer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ---------------------------------------------------------------------------
// matchMedia helpers
// ---------------------------------------------------------------------------

function mockMatchMedia(prefersReduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: prefersReduced && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ---------------------------------------------------------------------------
// Component imports (after mocks are registered)
// ---------------------------------------------------------------------------

import { FiltrationPlayground } from './FiltrationPlayground';
import { PersistenceDiagramBuilder } from './PersistenceDiagramBuilder';
import { PersistenceDiagramBuilder3D } from './PersistenceDiagramBuilder3D';

afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// FiltrationPlayground
// ---------------------------------------------------------------------------

describe('FiltrationPlayground — pause/resume controls', () => {
  beforeEach(() => mockMatchMedia(false));

  it('renders with initial aria-label "Pause animation"', () => {
    render(<FiltrationPlayground />);
    expect(screen.getByRole('button', { name: 'Pause animation' })).toBeTruthy();
  });

  it('clicking Pause button toggles aria-label to "Resume animation"', async () => {
    render(<FiltrationPlayground />);
    const btn = screen.getByRole('button', { name: 'Pause animation' });
    await act(async () => { fireEvent.click(btn); });
    expect(screen.getByRole('button', { name: 'Resume animation' })).toBeTruthy();
  });

  it('initialises in paused state when useReducedMotion() returns true', async () => {
    mockMatchMedia(true);
    await act(async () => {
      render(<FiltrationPlayground />);
    });
    expect(screen.getByRole('button', { name: 'Resume animation' })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PersistenceDiagramBuilder
// ---------------------------------------------------------------------------

describe('PersistenceDiagramBuilder — pause/resume controls', () => {
  beforeEach(() => mockMatchMedia(false));

  it('renders with initial aria-label "Pause animation"', () => {
    render(<PersistenceDiagramBuilder />);
    expect(screen.getByRole('button', { name: 'Pause animation' })).toBeTruthy();
  });

  it('clicking Pause button toggles aria-label to "Resume animation"', async () => {
    render(<PersistenceDiagramBuilder />);
    const btn = screen.getByRole('button', { name: 'Pause animation' });
    await act(async () => { fireEvent.click(btn); });
    expect(screen.getByRole('button', { name: 'Resume animation' })).toBeTruthy();
  });

  it('initialises in paused state when useReducedMotion() returns true', async () => {
    mockMatchMedia(true);
    await act(async () => {
      render(<PersistenceDiagramBuilder />);
    });
    expect(screen.getByRole('button', { name: 'Resume animation' })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PersistenceDiagramBuilder3D
// ---------------------------------------------------------------------------

describe('PersistenceDiagramBuilder3D — pause/resume controls', () => {
  beforeEach(() => mockMatchMedia(false));

  it('renders with initial aria-label "Pause animation"', () => {
    render(<PersistenceDiagramBuilder3D />);
    expect(screen.getByRole('button', { name: 'Pause animation' })).toBeTruthy();
  });

  it('clicking Pause button toggles aria-label to "Resume animation"', async () => {
    render(<PersistenceDiagramBuilder3D />);
    const btn = screen.getByRole('button', { name: 'Pause animation' });
    await act(async () => { fireEvent.click(btn); });
    expect(screen.getByRole('button', { name: 'Resume animation' })).toBeTruthy();
  });

  it('initialises in paused state when useReducedMotion() returns true', async () => {
    mockMatchMedia(true);
    await act(async () => {
      render(<PersistenceDiagramBuilder3D />);
    });
    expect(screen.getByRole('button', { name: 'Resume animation' })).toBeTruthy();
  });
});
