/**
 * LensSection.tsx — Task 6.3 — Agent_Integration
 *
 * Trivial MDX wrapper component for TwoLenses toggle sections.
 * Used in interlude MDX files to mark content as belonging to
 * either the "politics" lens (Intuitive sections) or the "math"
 * lens (Intermediate / Formal / Advanced sections).
 *
 * Usage in MDX:
 *   <LensSection lens="politics">...</LensSection>
 *   <LensSection lens="math">...</LensSection>
 */

import type { ReactNode } from 'react';

interface Props {
  lens: 'politics' | 'math';
  children: ReactNode;
}

export function LensSection({ lens, children }: Props) {
  return (
    <div className={`lens-section is-${lens}`} data-lens-section={lens}>
      {children}
    </div>
  );
}

export default LensSection;
