/**
 * keyboardNav.ts — Task 3.1 — Agent_Interactive_Core
 *
 * Keyboard navigation helpers for D3 SVG interactive elements.
 *
 * makeFocusable  — makes a D3 selection keyboard-reachable and
 *                  announces it to screen readers as an image.
 *
 * arrowKeyHandler — factory that produces a keydown handler for
 *                   arrow-key focus traversal through a list of data
 *                   point elements (e.g. circles, bars, path segments).
 *
 * SSR Note: `arrowKeyHandler` binds DOM events; only attach the returned
 * handler inside useEffect or a D3 selection `.on('keydown', ...)` call.
 */

import type { Selection, BaseType } from 'd3-selection';

/**
 * Make an SVG D3 selection keyboard-focusable.
 *
 * Adds `tabindex="0"` so the element is reachable via Tab, and
 * `role="img"` so assistive technologies announce it as an image.
 * Callers should also set `aria-label` on each element to provide
 * a meaningful description of the data point.
 *
 * @example
 * const dots = svg.selectAll('circle').data(data).join('circle');
 * makeFocusable(dots);
 * dots.attr('aria-label', d => `${d.name}: ${d.value}`);
 */
export function makeFocusable(
  selection: Selection<SVGElement, unknown, BaseType, unknown>,
): void {
  selection.attr('tabindex', '0').attr('role', 'img');
}

/**
 * Build a keydown handler for arrow-key focus traversal.
 *
 * ArrowRight / ArrowDown → move to the next item (wraps).
 * ArrowLeft  / ArrowUp   → move to the previous item (wraps).
 * Other keys are ignored.
 *
 * Attach the returned handler to the parent SVG or a container `<g>`,
 * which receives keyboard events from its focusable children via bubbling.
 *
 * @param items   - Ordered array (or array-like) of focusable DOM elements.
 * @param onFocus - Callback invoked with the newly-focused element and its index.
 *
 * @example
 * const nodes = Array.from(svg.selectAll<SVGCircleElement, Datum>('circle'));
 * svg.on('keydown', arrowKeyHandler(nodes, (el, i) => showTooltip(data[i])));
 */
export function arrowKeyHandler(
  items: ArrayLike<Element>,
  onFocus: (item: Element, index: number) => void,
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent): void => {
    const itemArray = Array.from(items);
    const currentIndex = itemArray.findIndex((el) => el === event.target);
    if (currentIndex === -1) return;

    let delta = 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') delta = 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') delta = -1;
    else return;

    event.preventDefault();

    const nextIndex = (currentIndex + delta + itemArray.length) % itemArray.length;
    const nextItem = itemArray[nextIndex];

    // Both HTMLElement and SVGElement implement HTMLOrSVGElement which
    // provides .focus(). The cast is valid for any element with tabindex.
    (nextItem as HTMLOrSVGElement).focus();
    onFocus(nextItem, nextIndex);
  };
}
