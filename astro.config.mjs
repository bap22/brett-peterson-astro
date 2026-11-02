// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://brett-peterson.com',
  // Pages are prerendered (static HTML) by default; only the Keystatic admin runs on demand.
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [react(), keystatic(), sitemap({ filter: (p) => !p.includes('/keystatic') })],
  // Keep HTML-aware whitespace (Astro 7 defaults to JSX-style stripping).
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: { plugins: [tailwindcss()] },
});
