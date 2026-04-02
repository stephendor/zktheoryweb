/**
 * ExpandableCard.test.tsx — Task 2.2b — Agent_Design_Templates
 *
 * Behavioural tests for the ExpandableCard React island.
 * Uses @testing-library/react + userEvent (not fireEvent).
 * DOM environment: happy-dom (configured in vitest.config.ts).
 *
 * ARIA contract under test:
 *   - Trigger: <button aria-expanded aria-controls>
 *   - Panel:   role="region" aria-label aria-hidden (when collapsed)
 *
 * CSS grid animation is not testable in happy-dom; tests focus on
 * ARIA state and React state toggling.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpandableCard } from './ExpandableCard';

afterEach(() => cleanup());

const defaultProps = {
  title: 'Key claim: poverty is relational',
  detail: 'Poverty cannot be understood in isolation from social structures.',
};

describe('ExpandableCard', () => {

  it('1. renders in collapsed state by default', () => {
    render(<ExpandableCard {...defaultProps} />);

    const trigger = screen.getByRole('button');

    // Trigger must report collapsed state
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // Resolve the panel via aria-controls and confirm it is aria-hidden
    const controlsId = trigger.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    const panel = document.getElementById(controlsId!);
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('aria-hidden')).toBe('true');
  });

  it('2. clicking the trigger expands the card', async () => {
    const user = userEvent.setup();
    render(<ExpandableCard {...defaultProps} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Trigger must report expanded state
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    // Panel is now in the accessible tree (aria-hidden removed)
    // getByRole('region') finds accessible (non-hidden) regions only
    const panel = screen.getByRole('region', { name: defaultProps.title });
    expect(panel.getAttribute('aria-hidden')).toBeNull();

    // Detail content is accessible
    expect(panel.textContent).toContain(defaultProps.detail as string);
  });

  it('3. clicking the trigger again collapses the card', async () => {
    const user = userEvent.setup();
    render(<ExpandableCard {...defaultProps} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger); // open
    await user.click(trigger); // close

    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    const controlsId = trigger.getAttribute('aria-controls');
    const panel = document.getElementById(controlsId!);
    expect(panel!.getAttribute('aria-hidden')).toBe('true');
  });

  it('4. aria-controls on trigger matches id of the detail panel', () => {
    render(<ExpandableCard {...defaultProps} />);

    const trigger = screen.getByRole('button');
    const controlsId = trigger.getAttribute('aria-controls');

    // Must have a non-empty aria-controls value
    expect(typeof controlsId).toBe('string');
    expect((controlsId as string).length).toBeGreaterThan(0);

    // The element with that id must exist in the document
    const panel = document.getElementById(controlsId!);
    expect(panel).not.toBeNull();

    // Panel id must equal the aria-controls value
    expect(panel!.id).toBe(controlsId);
  });

  it('5. renders in expanded state when defaultOpen is true', () => {
    render(<ExpandableCard {...defaultProps} defaultOpen={true} />);

    const trigger = screen.getByRole('button');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    // Panel is accessible (no aria-hidden) when already open
    const panel = screen.getByRole('region', { name: defaultProps.title });
    expect(panel.getAttribute('aria-hidden')).toBeNull();
  });

});
