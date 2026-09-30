import path from 'path';
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

/**
 * Storybook 10 main configuration — React + Vite builder.
 *
 * viteFinal adds the Tailwind CSS v4 Vite plugin so that `global.css`'s
 * `@import 'tailwindcss'` directive is processed correctly in Storybook's
 * Vite build (mirroring the Tailwind plugin registered in astro.config.mjs).
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  /**
   * Inject required Vite plugins:
   * - @vitejs/plugin-react: configures the JSX transform for .tsx/.jsx files.
   *   @storybook/react-vite does NOT add this automatically in v10.
   * - tailwindcss: processes `@import 'tailwindcss'` in global.css.
   *
   * Also disable lightningcss minification to avoid "Unknown at rule: @theme"
   * warnings from Tailwind v4's @theme directive during Storybook's CSS build.
   */
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), react(), tailwindcss()];
    // Mirror the tsconfig.json path aliases (same list as vitest.config.ts).
    // Astro resolves tsconfig `paths` itself; declaring them here keeps
    // Storybook's Vite build independent of whether Vite reads tsconfig.
    viteConfig.resolve = {
      ...(viteConfig.resolve ?? {}),
      alias: {
        ...(viteConfig.resolve?.alias ?? {}),
        '@components': path.resolve(import.meta.dirname, '../src/components'),
        '@layouts': path.resolve(import.meta.dirname, '../src/layouts'),
        '@lib': path.resolve(import.meta.dirname, '../src/lib'),
        '@styles': path.resolve(import.meta.dirname, '../src/styles'),
        '@data': path.resolve(import.meta.dirname, '../src/data'),
      },
    };
    // Tailwind v4's @theme is not a standard CSS at-rule; lightningcss
    // (Storybook's default CSS minifier) rejects it. Disable CSS minification
    // for Storybook — token CSS is already small and doesn't need minifying.
    viteConfig.build = {
      ...(viteConfig.build ?? {}),
      cssMinify: false,
    };
    return viteConfig;
  },
};

export default config;
