/**
 * BibTexCopyButton.test.tsx — Task 2.11 — Agent_Infra
 *
 * Behavioural tests for the BibTexCopyButton React island.
 * Uses @testing-library/react + userEvent (not fireEvent) per project convention.
 * DOM environment: happy-dom (configured in vitest.config.ts).
 *
 * Clipboard API mocking:
 *   happy-dom 20.x implements navigator.clipboard natively and exposes the
 *   same Clipboard instance on every access (same reference). However,
 *   @testing-library/user-event v14's setup() call invokes
 *   attachClipboardStubToView() internally, which replaces navigator.clipboard
 *   with a ClipboardStub via Object.defineProperty. This happens inside the
 *   test body — AFTER beforeEach has already run. A spy installed in beforeEach
 *   targets the original Clipboard instance; the component then receives the
 *   stub and calls its own writeText, never touching the spy (0 calls recorded).
 *
 *   Fix: call userEvent.setup() in beforeEach FIRST, so the stub is attached
 *   before vi.spyOn runs. The spy is then placed on the stub's writeText and
 *   the component reaches it via the same stub getter on navigator.clipboard.
 *   Tests share the user instance declared at describe scope.
 *
 * State machine under test (from BibTexCopyButton.tsx):
 *   idle    → "Copy BibTeX" label,  aria-label="Copy BibTeX citation",  enabled
 *   copied  → "Copied!" label,      aria-label="BibTeX copied",         disabled
 *   error   → "Copy failed" label,  aria-label="Copy failed, try again",disabled
 *   (resets to idle after 2 s — timer-based reset is not behavioural; not tested)
 */

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BibTexCopyButton } from './BibTexCopyButton';

afterEach(() => cleanup());

// Representative BibTeX string — same shape as real paper data.
const SAMPLE_BIBTEX = `@article{edelsbrunner2002,
  author  = {Edelsbrunner, Herbert and Letscher, David and Zomorodian, Afra},
  title   = {Topological Persistence and Simplification},
  journal = {Discrete \\& Computational Geometry},
  year    = {2002},
  volume  = {28},
}`;

describe('BibTexCopyButton', () => {
  let writeTextSpy: ReturnType<typeof vi.spyOn>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // userEvent.setup() must run FIRST: it calls attachClipboardStubToView(),
    // which installs a ClipboardStub as the navigator.clipboard getter.
    // The spy is then placed on the stub's writeText, so the component's
    // `await navigator.clipboard.writeText(bibtex)` call hits the spy.
    user = userEvent.setup();
    writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. renders with "Copy BibTeX" visible label and is enabled in idle state', () => {
    render(<BibTexCopyButton bibtex={SAMPLE_BIBTEX} />);

    // The <span class="bibtex-label"> shows "Copy BibTeX" when idle.
    expect(screen.getByText('Copy BibTeX')).toBeInTheDocument();

    // Button must be enabled (copyState === 'idle') before any interaction.
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('2. clicking the button calls navigator.clipboard.writeText with the exact bibtex string', async () => {
    render(<BibTexCopyButton bibtex={SAMPLE_BIBTEX} />);

    await user.click(screen.getByRole('button'));

    expect(writeTextSpy).toHaveBeenCalledOnce();
    expect(writeTextSpy).toHaveBeenCalledWith(SAMPLE_BIBTEX);
  });

  it('3. aria-label updates to "BibTeX copied" immediately after a successful click', async () => {
    render(<BibTexCopyButton bibtex={SAMPLE_BIBTEX} />);

    await user.click(screen.getByRole('button'));

    // Before the 2-second reset timer fires, the button's aria-label must
    // communicate success to screen readers. This is the primary a11y contract.
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'BibTeX copied');
  });
});
