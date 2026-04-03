/**
 * AriaLiveRegion.tsx — Task 3.1 — Agent_Interactive_Core
 *
 * Visually-hidden `aria-live="polite"` region that announces dynamic data
 * changes (hover values, filtered totals, chart state updates) to screen
 * readers without disrupting the visual layout.
 *
 * ARIA contract:
 *   aria-live="polite"  — waits for user idle before reading the message.
 *   aria-atomic="true"  — reads the entire region as a single unit rather
 *                         than announcing individual text-node changes.
 *
 * Usage in a D3 chart:
 *   const [liveMsg, setLiveMsg] = useState('');
 *
 *   // In a pointermove handler:
 *   setLiveMsg(`${d.name}: ${d.value}`);
 *
 *   // In JSX:
 *   <AriaLiveRegion message={liveMsg} />
 *
 * The component is SSR-safe — it renders a static empty element during
 * Astro's build pass and populates on the client as messages arrive.
 */

import './AriaLiveRegion.css';

export interface AriaLiveRegionProps {
  /** The text string to announce. Update this prop to trigger an announcement. */
  message: string;
}

export function AriaLiveRegion({ message }: AriaLiveRegionProps) {
  return (
    <div className="alr-region" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
