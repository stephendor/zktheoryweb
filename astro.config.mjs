// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://zktheory.org',
  output: 'static',
  adapter: netlify(),
  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        [rehypeKatex, { strict: false, throwOnError: false, output: 'htmlAndMathml' }],
      ],
    }),
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
