/**
 * Storybook preview configuration — Task 3.1 — Agent_Interactive_Core
 *
 * Imports design token CSS and global styles so all `--color-*`, `--space-*`,
 * `--font-*` custom properties are available in every story's canvas.
 *
 * Import order matters:
 *   1. tokens.css  — defines all CSS custom properties
 *   2. global.css  — imports Tailwind + KaTeX + tokens (via @import chain);
 *                    importing after tokens.css is still safe because CSS
 *                    custom properties cascade, and the explicit import here
 *                    ensures the file is bundled even if no story uses it.
 */
import '../src/styles/tokens.css';
import '../src/styles/global.css';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
  },
};

export default preview;
