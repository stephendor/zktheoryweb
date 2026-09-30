// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { fetchZoteroLibrary } from './src/lib/zotero.ts';
import pagefind from 'astro-pagefind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://zktheory.org',
  output: 'static',
  // Astro 7 defaults to 'jsx', which strips whitespace between inline elements
  // in .astro templates. Keep the Astro 6 behaviour so spacing is unchanged.
  compressHTML: true,
  integrations: [
    {
      name: 'zotero-prefetch',
      hooks: {
        'astro:build:start': async () => {
          try {
            await fetchZoteroLibrary();
          } catch (err) {
            console.warn('[zotero] Build hook: unexpected error —', err);
          }
        },
      },
    },
    react(),
    // Astro 7 renders Markdown with Sätteri by default, which does not run
    // remark/rehype plugins. MDX needs remark-math + rehype-katex, so it is
    // given the unified processor explicitly.
    mdx({
      processor: unified({
        // Under Astro 6 straight quotes in MDX were emitted unchanged. Keep
        // that: enabling this would curl quotes across the prose pages.
        smartypants: false,
        remarkPlugins: [remarkMath],
        rehypePlugins: [
          [rehypeKatex, { strict: false, throwOnError: false, output: 'htmlAndMathml' }],
        ],
      }),
    }),
    pagefind(),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      langs: ['python', 'typescript', 'javascript', 'yaml', 'bash', 'json'],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Three.js is bundled entirely into PersistenceDiagramBuilderWrapper (~922KB).
            // Splitting it into a dedicated vendor chunk improves cache efficiency:
            // component code updates won't bust the cached Three.js chunk.
            if (id.includes('node_modules/three')) return 'vendor-three';
            // React core is already auto-split by Astro; no manual split needed.
            // D3 sub-modules are already code-split per component; no change needed.
          },
        },
      },
    },
  },
});
