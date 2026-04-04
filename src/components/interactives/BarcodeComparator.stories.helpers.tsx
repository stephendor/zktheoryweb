/** BarcodeComparator.stories.helpers.tsx */
import { BarcodeComparator } from './BarcodeComparator';

export function DefaultComparator() {
  return (
    <div style={{ width: '100%', maxWidth: 900, padding: '1rem' }}>
      <BarcodeComparator />
    </div>
  );
}

export function NarrowViewport() {
  return (
    <div style={{ width: 400, padding: '1rem', boxSizing: 'border-box' }}>
      <BarcodeComparator />
    </div>
  );
}
