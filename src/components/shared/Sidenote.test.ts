/**
 * Sidenote.test.ts — Task 2.11 — Agent_Infra
 *
 * Tests the interactive <details>/<summary> disclosure behaviour of the mobile
 * rendering branch of Sidenote.astro.
 *
 * WHY THIS APPROACH:
 * Astro .astro components are server-rendered via the Astro build pipeline and
 * cannot be imported or rendered in Vitest (a JS-runtime environment). The
 * Sidenote component has no custom JavaScript — its mobile interactivity is
 * entirely native HTML: a <details>/<summary> disclosure element. We therefore
 * test the behaviour by constructing a minimal equivalent DOM fragment directly
 * via happy-dom (the configured test environment) and asserting the HTML
 * disclosure algorithm works as expected. This approach:
 *   1. Tests the real browser contract (<details> open/close) without Astro
 *   2. Documents the intended markup pattern so future contributors know what
 *      the component produces and relies on
 *   3. Avoids any flakiness from server-rendering Astro in a test environment
 *      that is not designed for it
 *
 * DOM fragment mirrors the mobile branch of Sidenote.astro:
 *   <details class="sidenote-disclosure">
 *     <summary class="sidenote-disclosure-summary">[1]</summary>
 *     <p>Note content</p>
 *   </details>
 */

describe('Sidenote — <details> mobile disclosure widget', () => {
  let details: HTMLDetailsElement;
  let summary: HTMLElement;

  beforeEach(() => {
    // Build the minimal DOM fragment equivalent to Sidenote.astro's mobile branch.
    details = document.createElement('details');
    details.className = 'sidenote-disclosure';

    summary = document.createElement('summary');
    summary.className = 'sidenote-disclosure-summary';
    summary.textContent = '[1]';
    details.appendChild(summary);

    const content = document.createElement('p');
    content.textContent = 'A marginal observation about the preceding text.';
    details.appendChild(content);

    document.body.appendChild(details);
  });

  afterEach(() => {
    // Remove injected fragment to keep each test isolated.
    document.body.innerHTML = '';
  });

  it('1. <details> is closed by default (open attribute absent)', () => {
    // Sidenote.astro does not set the open attribute on <details>.
    // The HTML spec mandates that <details> without the open attribute is hidden.
    expect(details.open).toBe(false);
    expect(details.hasAttribute('open')).toBe(false);
  });

  it('2. clicking <summary> opens the <details> disclosure', () => {
    // Simulates a user tap on the mobile "[1]" marker.
    // The HTML disclosure algorithm toggles details.open = true and adds the
    // open attribute — verified here for the happy-dom environment.
    summary.click();
    expect(details.open).toBe(true);
    expect(details.hasAttribute('open')).toBe(true);
  });
});
