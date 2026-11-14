import { element, walk } from './tree.mjs';

const HEADINGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Dodaje do nagłówków link do samego siebie. Link nie ma tekstu (ikona jest w CSS),
 * żeby nie trafiał do spisu treści ani do identyfikatorów.
 */
export function rehypeHeadingAnchors() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'element' || !HEADINGS.has(node.tagName)) return;
      const id = node.properties?.id;
      if (typeof id !== 'string' || id === '') return false;
      // Przypisy mają własny, ukryty nagłówek.
      if (id === 'footnote-label') return false;
      node.children.push(
        element('a', {
          className: ['heading-anchor'],
          href: `#${id}`,
          ariaLabel: 'Link do tej sekcji',
        }),
      );
      return false;
    });
  };
}
