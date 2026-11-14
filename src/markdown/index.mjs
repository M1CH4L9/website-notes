import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkAlerts } from './remark-alerts.mjs';
import { rehypeCodeFrame, codeTitleTransformer } from './rehype-code-frame.mjs';
import { rehypeHeadingAnchors } from './rehype-heading-anchors.mjs';
import { rehypeFigures } from './rehype-figures.mjs';
import { rehypeTableWrap } from './rehype-table-wrap.mjs';
import { contrastTransformer } from './shiki-contrast.mjs';
import { kotekDarkTheme, kotekLightTheme } from './shiki-kotek-theme.mjs';

/*
 * Jedno miejsce z całą konfiguracją Markdowna. Korzysta z niego astro.config.mjs,
 * a w przyszłości może z niego skorzystać renderowanie notatek użytkowników po stronie serwera
 * (createMarkdownProcessor z @astrojs/markdown-remark przyjmuje te same opcje).
 */

export const remarkPlugins = [remarkMath, remarkAlerts];

export const rehypePlugins = [
  rehypeKatex,
  rehypeCodeFrame,
  rehypeTableWrap,
  rehypeFigures,
  // Identyfikatory muszą powstać przed dodaniem kotwic.
  rehypeHeadingIds,
  rehypeHeadingAnchors,
];

export const shikiConfig = {
  // Każdy motyw trafia do własnej zmiennej CSS (--shiki-dark, --shiki-light, --shiki-cute-light,
  // --shiki-cute-dark), a wyboru dokonuje CSS na podstawie atrybutów na <html> (src/styles/prose.css).
  themes: {
    dark: 'github-dark',
    light: 'github-light',
    'cute-light': kotekLightTheme,
    'cute-dark': kotekDarkTheme,
  },
  defaultColor: false,
  wrap: false,
  transformers: [codeTitleTransformer, contrastTransformer],
};
