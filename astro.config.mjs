// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { fetchZoteroLibrary } from './src/lib/zotero.ts';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://zktheory.org',
  output: 'static',
  adapter: netlify(),
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
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        [rehypeKatex, { strict: false, throwOnError: false, output: 'htmlAndMathml' }],
      ],
    }),
    pagefind(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      langs: ['python', 'typescript', 'javascript', 'yaml', 'bash', 'json'],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
