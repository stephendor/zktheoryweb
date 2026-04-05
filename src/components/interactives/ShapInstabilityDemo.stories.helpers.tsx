/** ShapInstabilityDemo.stories.helpers.tsx */
import { ShapInstabilityDemo } from './ShapInstabilityDemo';

export function DefaultDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 860, padding: '1rem' }}>
      <ShapInstabilityDemo />
    </div>
  );
}

export function NarrowViewport() {
  return (
    <div style={{ width: 400, padding: '1rem', boxSizing: 'border-box' }}>
      <ShapInstabilityDemo />
    </div>
  );
}
