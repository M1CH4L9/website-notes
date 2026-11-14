import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import { remarkPlugins, rehypePlugins, shikiConfig } from './src/markdown/index.mjs';

// Vercel podaje domenę produkcyjną w czasie builda. Lokalnie adresy kanoniczne są pomijane.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: productionHost ? `https://${productionHost}` : undefined,
  integrations: [mdx()],
  redirects: {
    '/przedmioty': '/',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  markdown: {
    processor: unified({
      remarkPlugins,
      rehypePlugins,
      // Wyłączone celowo: zamienia "--" na pauzy i wstawia angielskie cudzysłowy.
      smartypants: false,
      remarkRehype: {
        footnoteLabel: 'Przypisy',
        footnoteBackLabel: 'Wróć do miejsca w tekście',
      },
    }),
    shikiConfig,
  },
});
