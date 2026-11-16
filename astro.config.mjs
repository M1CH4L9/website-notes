import { globSync, statSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import { unified } from '@astrojs/markdown-remark';
import { remarkPlugins, rehypePlugins, shikiConfig } from './src/markdown/index.mjs';

// Vercel podaje domenę produkcyjną w czasie builda. Lokalnie adresy kanoniczne są pomijane.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: productionHost ? `https://${productionHost}` : undefined,
  output: 'server',
  adapter: vercel({ maxDuration: 60, includeFiles: [...globSync(['node_modules/@sparticuz/chromium/bin/*', 'node_modules/katex/dist/fonts/*', 'node_modules/@fontsource-variable/{figtree,jetbrains-mono}/files/*.woff2', 'node_modules/@fontsource-variable/{figtree,jetbrains-mono}/wght.css', 'notatki/**/*', 'public/**/*'])].filter(file => statSync(file).isFile()) }),
  integrations: [mdx()],
  redirects: {
    '/przedmioty': '/',
  },
  prefetch: {
    prefetchAll: true,
    // Viewport: dokumenty ładują się zanim użytkownik kliknie (szybsza nawigacja).
    defaultStrategy: 'viewport',
  },
  security: {
    checkOrigin: true,
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
