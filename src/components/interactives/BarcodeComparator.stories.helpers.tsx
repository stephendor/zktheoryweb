/** BarcodeComparator.stories.helpers.tsx */
import type { ReactElement } from 'react';
import { BarcodeComparator } from './BarcodeComparator';

export function DefaultComparator(): ReactElement {
  return (
    <div style={{ boxSizing: 'border-box', width: '100%', maxWidth: 900, padding: '1rem' }}>
      <BarcodeComparator />
    </div>
  );
}

export function NarrowViewport(): ReactElement {
  return (
    <div style={{ width: 400, padding: '1rem', boxSizing: 'border-box' }}>
      <BarcodeComparator />
    </div>
  );
}
