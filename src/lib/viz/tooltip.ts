/**
 * tooltip.ts — Task 3.1 — Agent_Interactive_Core
 *
 * Positioned tooltip utility for D3 SVG charts.
 *
 * Creates and manages a single <div> tooltip element within a chart
 * container. Positions it relative to a D3 pointer event, with overflow-
 * prevention logic to keep the tooltip within the container bounds.
 *
 * Usage:
 *   // Once on chart initialisation:
 *   const tt = createTooltip(containerEl);
 *
 *   // Inside a D3 mouseover/pointermove handler:
 *   selection.on('pointermove', (event, d) => {
 *     showTooltip(tt, event, `<strong>${d.name}</strong>: ${d.value}`);
 *   });
 *   selection.on('pointerleave', () => hideTooltip(tt));
 *
 *   // On chart cleanup (React effect teardown):
 *   destroyTooltip(tt);
 *
 * SSR Note: Must be called in a browser context only.
 */

/** Internal tooltip state object. */
export interface TooltipHandle {
  /** The tooltip DOM element. */
  el: HTMLDivElement;
  /** The bounding container element used for overflow clamping. */
  container: HTMLElement;
}

/** Pixel gap between the pointer position and the tooltip edge. */
const OFFSET_X = 12;
const OFFSET_Y = -28;
/** Minimum margin to keep the tooltip inside the container edges. */
const EDGE_MARGIN = 8;

/**
 * Create a tooltip <div> and append it to `container`.
 * The container should be the chart wrapper element (position: relative).
 */
export function createTooltip(container: HTMLElement): TooltipHandle {
  const el = document.createElement('div');
  el.className = 'viz-tooltip';
  el.setAttribute('role', 'tooltip');
  el.setAttribute('aria-hidden', 'true');
  container.appendChild(el);
  return { el, container };
}

/**
 * Show the tooltip, position it near the D3 pointer event, and prevent it
 * from overflowing the container bounds.
 *
 * @param handle  - The tooltip handle returned by `createTooltip`.
 * @param event   - The native `PointerEvent` or `MouseEvent` from a D3 handler.
 * @param content - HTML string or plain text to render inside the tooltip.
 */
export function showTooltip(
  handle: TooltipHandle,
  event: PointerEvent | MouseEvent,
  content: string,
): void {
  const { el, container } = handle;

  el.innerHTML = content;
  el.setAttribute('aria-hidden', 'false');
  el.style.setProperty('display', 'block');

  // Position relative to the container using offsetX/offsetY so we stay
  // in the container's local coordinate space regardless of page scroll.
  const containerRect = container.getBoundingClientRect();
  const mouseX = event.clientX - containerRect.left;
  const mouseY = event.clientY - containerRect.top;

  let left = mouseX + OFFSET_X;
  let top = mouseY + OFFSET_Y;

  // Measure tooltip after content is set (but before displaying) to get
  // accurate dimensions for overflow clamping.
  const ttWidth = el.offsetWidth;
  const ttHeight = el.offsetHeight;
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  // Prevent right-edge overflow — flip tooltip left of cursor.
  if (left + ttWidth + EDGE_MARGIN > containerWidth) {
    left = mouseX - ttWidth - OFFSET_X;
  }
  // Clamp to left edge.
  left = Math.max(EDGE_MARGIN, left);

  // Prevent top-edge overflow — flip below cursor.
  if (top < EDGE_MARGIN) {
    top = mouseY + OFFSET_X;
  }
  // Prevent bottom-edge overflow.
  if (top + ttHeight + EDGE_MARGIN > containerHeight) {
    top = containerHeight - ttHeight - EDGE_MARGIN;
  }

  el.style.setProperty('left', `${left}px`);
  el.style.setProperty('top', `${top}px`);
}

/**
 * Hide the tooltip without removing it from the DOM.
 */
export function hideTooltip(handle: TooltipHandle): void {
  handle.el.setAttribute('aria-hidden', 'true');
  handle.el.style.setProperty('display', 'none');
}

/**
 * Remove the tooltip element from the DOM entirely.
 * Call this inside a React `useEffect` cleanup to avoid leaks.
 */
export function destroyTooltip(handle: TooltipHandle): void {
  handle.el.remove();
}
