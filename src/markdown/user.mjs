import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { remarkPlugins, rehypePlugins, shikiConfig } from './index.mjs';

/*
 * Ten sam potok co publiczne notatki, plus sanityzacja HTML (treść z bazy).
 * Używane tylko po stronie serwera dla notatek użytkowników.
 */

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // hast: class → className, data-foo → dataFoo, aria-label → ariaLabel
    code: [...(defaultSchema.attributes?.code || []), 'className', 'class'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'class', 'style'],
    div: [...(defaultSchema.attributes?.div || []), 'className', 'class'],
    pre: [...(defaultSchema.attributes?.pre || []), 'className', 'class', 'tabIndex', 'tabindex', 'style'],
    a: [
      ...(defaultSchema.attributes?.a || []),
      'className',
      'class',
      'ariaHidden',
      'aria-hidden',
      'tabIndex',
      'tabindex',
    ],
    h1: [...(defaultSchema.attributes?.h1 || []), 'id'],
    h2: [...(defaultSchema.attributes?.h2 || []), 'id'],
    h3: [...(defaultSchema.attributes?.h3 || []), 'id'],
    h4: [...(defaultSchema.attributes?.h4 || []), 'id'],
    h5: [...(defaultSchema.attributes?.h5 || []), 'id'],
    h6: [...(defaultSchema.attributes?.h6 || []), 'id'],
    table: [...(defaultSchema.attributes?.table || []), 'className', 'class'],
    th: [...(defaultSchema.attributes?.th || []), 'align', 'style'],
    td: [...(defaultSchema.attributes?.td || []), 'align', 'style'],
    section: [...(defaultSchema.attributes?.section || []), 'className', 'class', 'dataFootnotes', 'data-footnotes'],
    li: [...(defaultSchema.attributes?.li || []), 'id', 'className', 'class'],
    ul: [...(defaultSchema.attributes?.ul || []), 'className', 'class', 'role'],
    ol: [...(defaultSchema.attributes?.ol || []), 'className', 'class', 'start'],
    p: [...(defaultSchema.attributes?.p || []), 'className', 'class'],
    blockquote: [
      ...(defaultSchema.attributes?.blockquote || []),
      'className',
      'class',
      'dataType',
      'data-type',
      'dataTitle',
      'data-title',
    ],
    figure: [...(defaultSchema.attributes?.figure || []), 'className', 'class'],
    figcaption: [...(defaultSchema.attributes?.figcaption || []), 'className', 'class'],
    img: [...(defaultSchema.attributes?.img || []), 'className', 'class', 'loading', 'decoding'],
    button: [
      'className',
      'class',
      'type',
      'dataCodeCopy',
      'data-code-copy',
      'dataState',
      'data-state',
      'ariaLabel',
      'aria-label',
      'title',
    ],
    svg: [
      'viewBox',
      'width',
      'height',
      'fill',
      'stroke',
      'strokeWidth',
      'stroke-width',
      'ariaHidden',
      'aria-hidden',
      'className',
      'class',
    ],
    path: ['d', 'fill', 'stroke'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke'],
    // KaTeX (MathML)
    math: ['xmlns', 'display'],
    annotation: ['encoding'],
    semantics: [],
    mrow: [],
    mi: [],
    mo: [],
    mn: [],
    ms: [],
    mtext: [],
    mspace: ['width'],
    mfrac: [],
    msqrt: [],
    mroot: [],
    msub: [],
    msup: [],
    msubsup: [],
    mtable: [],
    mtr: [],
    mtd: [],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'button',
    'figure',
    'figcaption',
    'section',
    'svg',
    'path',
    'circle',
    'math',
    'annotation',
    'semantics',
    'mrow',
    'mi',
    'mo',
    'mn',
    'ms',
    'mtext',
    'mspace',
    'mfrac',
    'msqrt',
    'mroot',
    'msub',
    'msup',
    'msubsup',
    'mtable',
    'mtr',
    'mtd',
  ],
};

let processorPromise;

async function getProcessor() {
  if (!processorPromise) {
    processorPromise = createMarkdownProcessor({
      remarkPlugins,
      rehypePlugins: [
        ...rehypePlugins,
        [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer', 'ugc'] }],
        [rehypeSanitize, schema],
      ],
      shikiConfig,
      // Jak w astro.config — bez smartypants (pauzy z "--").
      smartypants: false,
      remarkRehype: {
        footnoteLabel: 'Przypisy',
        footnoteBackLabel: 'Wróć do miejsca w tekście',
      },
    });
  }
  return processorPromise;
}

export async function renderUserMarkdown(source) {
  const processor = await getProcessor();
  const result = await processor.render(source || '');
  return {
    html: result.code,
    headings: result.metadata?.headings ?? [],
  };
}
