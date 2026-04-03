/**
 * src/components/learn/MarkCompleteButton.tsx — Task 4.2 — Agent_Schema_Platform
 *
 * Client-only React island placed at the bottom of a module article.
 * Lets learners mark a module complete or undo that action. On mark-complete,
 * reveals a "Next module →" link when a next module is available.
 *
 * Usage in src/layouts/ModuleLayout.astro (inside the <article> column):
 *   <MarkCompleteButton
 *     client:only="react"
 *     pathSlug={path}
 *     moduleSlug={String(module_number)}
 *     nextModuleSlug={nextModule?.slug}
 *     nextModuleHref={nextModule ? `/learn/modules/${nextModule.slug}/` : undefined}
 *   />
 *
 * Button states:
 *   - Not complete → "Mark as complete" (primary teal button)
 *   - Complete     → "Marked complete ✓" (success button, non-interactive) +
 *                    "Undo" (secondary text link)
 *
 * After marking complete, if nextModuleHref is provided, a "Next module →"
 * link is rendered alongside the success state.
 *
 * SSR safety: ProgressProvider defers all localStorage access to useEffect.
 */

import { useState } from 'react';
import './MarkCompleteButton.css';
import { ProgressProvider, useProgress } from '@lib/useProgress';

interface Props {
  pathSlug: string;
  moduleSlug: string;
  nextModuleSlug?: string;
  nextModuleHref?: string;
}

// ─── Inner component (reads from context) ─────────────────────────────────────

function MarkCompleteInner({ moduleSlug, nextModuleHref }: Pick<Props, 'moduleSlug' | 'nextModuleHref'>) {
  const { isComplete, markComplete, markIncomplete } = useProgress();

  // Track whether the learner has marked complete *in this session* so we can
  // show the "Next module →" prompt immediately after the button is clicked
  // (even before a page reload).
  const [markedThisSession, setMarkedThisSession] = useState(false);

  const complete = isComplete(moduleSlug);
  const showNextLink = (complete || markedThisSession) && !!nextModuleHref;

  function handleMarkComplete() {
    markComplete(moduleSlug);
    setMarkedThisSession(true);
  }

  function handleUndo() {
    markIncomplete(moduleSlug);
    setMarkedThisSession(false);
  }

  return (
    <div className="mcb-wrapper">
      {!complete ? (
        <button
          type="button"
          className="mcb-btn-primary"
          onClick={handleMarkComplete}
          aria-label="Mark this module as complete"
        >
          Mark as complete
        </button>
      ) : (
        <>
          <button
            type="button"
            className="mcb-btn-success"
            aria-label="Module marked as complete"
            aria-pressed={true}
            disabled
          >
            Marked complete ✓
          </button>
          <button
            type="button"
            className="mcb-undo-btn"
            onClick={handleUndo}
            aria-label="Undo: mark this module as not started"
          >
            Undo
          </button>
        </>
      )}

      {showNextLink && nextModuleHref && (
        <a href={nextModuleHref} className="mcb-next-link">
          Next module →
        </a>
      )}
    </div>
  );
}

// ─── Exported island (wraps provider) ────────────────────────────────────────

export default function MarkCompleteButton({ pathSlug, moduleSlug, nextModuleHref }: Props) {
  return (
    <ProgressProvider pathSlug={pathSlug}>
      <MarkCompleteInner moduleSlug={moduleSlug} nextModuleHref={nextModuleHref} />
    </ProgressProvider>
  );
}
