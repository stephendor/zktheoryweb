/**
 * EquivalisationComparator.stories.helpers.tsx — Task 6.1b
 */

import { EquivalisationComparator } from './EquivalisationComparator';

export function DefaultComparator() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <EquivalisationComparator />
    </div>
  );
}

export function NarrowViewport() {
  return (
    <div style={{ width: 400, padding: '1rem', boxSizing: 'border-box' }}>
      <EquivalisationComparator />
    </div>
  );
}
