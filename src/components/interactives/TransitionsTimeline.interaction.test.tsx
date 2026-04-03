/**
 * TransitionsTimeline.interaction.test.tsx — Task 3.6b — Agent_Interactive_Core
 *
 * Interaction-layer tests for TransitionsTimeline:
 *
 *   (a) Annotation panel: forceActiveIndex correctly identifies a transition
 *       band and makes its annotation panel visible with the right content.
 *
 *   (b) Mobile breakpoint: when window.innerWidth < 768, the component renders
 *       the vertical mobile card list; at ≥768 it renders the horizontal SVG.
 *
 * Uses @testing-library/react with happy-dom (from vitest.config.ts).
 * CSS is disabled in the vitest config, so layout-based visibility checks are
 * done via class names / aria-hidden rather than computed styles.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import TransitionsTimeline from './TransitionsTimeline';
import { MOCK_TIMELINE_DATA } from './TransitionsTimeline.stories.helpers';

// Always clean up the DOM between tests — prevents leaking rendered nodes
// into other test files that run in the same happy-dom worker.
afterEach(() => cleanup());
// ─── (a) Annotation panel correctly identifies era from forceActiveIndex ──────

describe('TransitionsTimeline — annotation panel', () => {
  it('is hidden (aria-hidden) when no band is active', () => {
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} />);
    const panel = document.querySelector('.tt-annotation');
    expect(panel?.getAttribute('aria-hidden')).toBe('true');
  });

  it('becomes visible (no aria-hidden="true") when forceActiveIndex is set', () => {
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} forceActiveIndex={0} />);
    const panel = document.querySelector('.tt-annotation');
    // When visible, aria-hidden is false/absent — must NOT be the string "true"
    expect(panel?.getAttribute('aria-hidden')).not.toBe('true');
  });

  it('shows the correct transition title for forceActiveIndex=0 (T1)', () => {
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} forceActiveIndex={0} />);
    // The annotation panel has class tt-annotation__title; scope to avoid SVG band label collision
    const panel = document.querySelector('.tt-annotation');
    expect(panel?.querySelector('.tt-annotation__title')?.textContent).toBe('From the Body to the Budget');
  });

  it('shows the correct transition title for forceActiveIndex=2 (T3)', () => {
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} forceActiveIndex={2} />);
    const panel = document.querySelector('.tt-annotation');
    expect(panel?.querySelector('.tt-annotation__title')?.textContent).toBe('The Technocratic Turn');
  });

  it('shows the correct date range in the annotation header', () => {
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} forceActiveIndex={1} />);
    // T2: 1905–1945
    expect(screen.getByText('1905–1945')).toBeTruthy();
  });

  it('shows "present" for the open-ended final transition (T5)', () => {
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} forceActiveIndex={4} />);
    expect(screen.getByText('2000–present')).toBeTruthy();
  });

  it('shows the correct chapter count in the annotation note for T1 (2 chapters)', () => {
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} forceActiveIndex={0} />);
    expect(screen.getByText('2 chapters in this era')).toBeTruthy();
  });
});

// ─── (b) Mobile breakpoint switches render path at 768 px ─────────────────────

describe('TransitionsTimeline — mobile breakpoint', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Make innerWidth configurable so we can set it per test.
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
    vi.restoreAllMocks();
  });

  it('renders the horizontal SVG (.tt-scroll) at viewport width ≥768', () => {
    Object.assign(window, { innerWidth: 1024 });
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} />);
    expect(document.querySelector('.tt-scroll')).toBeTruthy();
    expect(document.querySelector('.tt-mobile-list')).toBeNull();
  });

  it('renders the vertical mobile card list (.tt-mobile-list) at viewport width <768', () => {
    Object.assign(window, { innerWidth: 375 });
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} />);
    expect(document.querySelector('.tt-mobile-list')).toBeTruthy();
    expect(document.querySelector('.tt-scroll')).toBeNull();
  });

  it('mobile list contains exactly 5 cards', () => {
    Object.assign(window, { innerWidth: 375 });
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} />);
    const cards = document.querySelectorAll('.tt-mobile-card');
    expect(cards).toHaveLength(5);
  });

  it('each mobile card has the correct data-transition attribute', () => {
    Object.assign(window, { innerWidth: 375 });
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} />);
    const cards = document.querySelectorAll<HTMLElement>('.tt-mobile-card');
    const transitions = Array.from(cards).map((c) => c.dataset.transition);
    expect(transitions).toEqual(['1', '2', '3', '4', '5']);
  });

  it('mobile cards show thread strand links for eras that have tagged chapters', () => {
    Object.assign(window, { innerWidth: 375 });
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} />);
    // T1 has both scottish-thread and gender-thread chapters (ch-1, ch-2)
    const threadLinks = document.querySelectorAll('.tt-mobile-card__thread-link');
    // T1: Scottish + Gender, T2: Gender → at least 3 thread links across all cards
    expect(threadLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('renders at exactly 768 px as desktop (horizontal), not mobile', () => {
    Object.assign(window, { innerWidth: 768 });
    render(<TransitionsTimeline data={MOCK_TIMELINE_DATA} />);
    expect(document.querySelector('.tt-scroll')).toBeTruthy();
    expect(document.querySelector('.tt-mobile-list')).toBeNull();
  });
});
