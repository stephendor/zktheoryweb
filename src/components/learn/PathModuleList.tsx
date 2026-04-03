/**
 * src/components/learn/PathModuleList.tsx — Task 4.2 — Agent_Schema_Platform
 *
 * Client-only React island that renders the full module list for a learning
 * path with live completion state from localStorage.
 *
 * Usage in src/pages/learn/[path].astro:
 *   <PathModuleList
 *     client:only="react"
 *     pathSlug={pathSlug}
 *     modules={pathModules}
 *   />
 *
 * Replaces the static `.path-page__cta` + `.path-page__modules` section
 * rendered by Agent_Design_Templates.
 *
 * Topics:
 *  - CTA button: "Start path" (first module) or "Continue" (first incomplete)
 *  - Module list: number badge, title (linked), core concept, time, status badge
 *  - Status badge: "Complete" (teal) or "Not started" (neutral)
 *
 * SSR safety: all localStorage reads occur inside ProgressProvider's useEffect.
 */

import './PathModuleList.css';
import type { LearnModule } from '@data/learnPaths';
import { ProgressProvider, useProgress } from '@lib/useProgress';

interface Props {
  pathSlug: string;
  modules: LearnModule[];
}

// ─── Inner component (reads from context) ─────────────────────────────────────

function ModuleListInner({ pathSlug, modules }: Props) {
  const { isComplete } = useProgress();

  // Derive the first module that is not complete (for the CTA).
  const firstIncomplete = modules.find(
    (mod) => !isComplete(String(mod.moduleNumber)),
  );

  const anyComplete = modules.some((mod) => isComplete(String(mod.moduleNumber)));

  // CTA destination: continue at first incomplete, or start at module 1.
  const ctaModule = firstIncomplete ?? modules[0];
  const ctaHref = ctaModule
    ? `/learn/${pathSlug}/${ctaModule.moduleNumber}`
    : `/learn/${pathSlug}/1`;
  const ctaLabel = anyComplete ? 'Continue' : 'Start path';

  return (
    <>
      {/* ── CTA button ──────────────────────────────────────────────────── */}
      <div className="path-page__cta">
        <a href={ctaHref} className="path-page__start-btn">
          {ctaLabel}
        </a>
      </div>

      {/* ── Module list ─────────────────────────────────────────────────── */}
      <section aria-label="Modules in this path" className="path-page__modules">
        <h2 className="path-page__modules-heading">Modules</h2>
        <ol className="module-list">
          {modules.map((mod) => {
            const moduleId = String(mod.moduleNumber);
            const complete = isComplete(moduleId);
            const moduleHref = `/learn/${pathSlug}/${mod.moduleNumber}`;

            return (
              <li key={moduleId} className="module-item">
                <div className="module-item__number" aria-hidden="true">
                  {mod.moduleNumber}
                </div>
                <div className="module-item__content">
                  <div className="module-item__header">
                    <h3 className="module-item__title">
                      <a href={moduleHref}>{mod.title}</a>
                    </h3>
                    <span
                      className={`module-item__status ${
                        complete
                          ? 'module-item__status--complete'
                          : 'module-item__status--not-started'
                      }`}
                      aria-label={`Completion status: ${complete ? 'Complete' : 'Not started'}`}
                    >
                      {complete ? 'Complete' : 'Not started'}
                    </span>
                  </div>
                  <p className="module-item__concept">{mod.coreConcept}</p>
                  <p className="module-item__time">
                    <span className="sr-only">Estimated reading time:</span>
                    ~{mod.estimatedMinutes} min
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

// ─── Exported island (wraps provider) ────────────────────────────────────────

export default function PathModuleList({ pathSlug, modules }: Props) {
  return (
    <ProgressProvider pathSlug={pathSlug}>
      <ModuleListInner pathSlug={pathSlug} modules={modules} />
    </ProgressProvider>
  );
}
