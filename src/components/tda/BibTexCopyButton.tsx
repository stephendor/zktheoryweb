/**
 * BibTexCopyButton.tsx — Task 2.3 — Agent_Design_Templates
 *
 * React island: copies a BibTeX string to the clipboard.
 *
 * Props:
 *   bibtex — the full BibTeX string to copy
 *
 * Behaviour:
 *   - Renders a <button> labelled "Copy BibTeX"
 *   - On click: calls navigator.clipboard.writeText(bibtex)
 *   - On success: shows "Copied!" confirmation for 2 seconds, then resets
 *   - On failure: shows "Copy failed" for 2 seconds, then resets
 *
 * Accessibility:
 *   - aria-label on the button updates to "BibTeX copied" during confirmation
 *   - aria-live="polite" on the status span announces the state change
 *
 * Client directive: client:visible (hydrates on viewport entry)
 */

import { useState, useCallback } from 'react';
import './BibTexCopyButton.css';

export interface BibTexCopyButtonProps {
  bibtex: string;
}

type CopyState = 'idle' | 'copied' | 'error';

export function BibTexCopyButton({ bibtex }: BibTexCopyButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }

    // Reset to idle after 2 seconds
    setTimeout(() => {
      setCopyState('idle');
    }, 2000);
  }, [bibtex]);

  const isCopied = copyState === 'copied';
  const isError  = copyState === 'error';

  return (
    <div className="bibtex-copy">
      <button
        type="button"
        className={`bibtex-btn${isCopied ? ' bibtex-btn--copied' : ''}${isError ? ' bibtex-btn--error' : ''}`}
        aria-label={isCopied ? 'BibTeX copied' : isError ? 'Copy failed, try again' : 'Copy BibTeX citation'}
        onClick={handleCopy}
        disabled={copyState !== 'idle'}
      >
        {/* Icon — CSS-only indicator via ::before pseudo-element */}
        <span className="bibtex-icon" aria-hidden="true">
          {isCopied ? '✓' : isError ? '✗' : '⎘'}
        </span>
        <span className="bibtex-label">
          {isCopied ? 'Copied!' : isError ? 'Copy failed' : 'Copy BibTeX'}
        </span>
      </button>

      {/* aria-live region announces confirmation to screen readers */}
      <span
        className="bibtex-status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isCopied ? 'BibTeX citation copied to clipboard.' : isError ? 'Failed to copy. Please copy the text manually.' : ''}
      </span>
    </div>
  );
}
