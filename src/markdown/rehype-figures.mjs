import { element, text, walk } from './tree.mjs';

const isBlank = (node) => node.type === 'text' && node.value.trim() === '';

/**
 * Obrazek z tytułem, stojący sam w akapicie, staje się rysunkiem z podpisem:
 *
 *   ![Opis dla czytników](./obrazki/schemat.svg "Podpis pod rysunkiem")
 */
export function rehypeFigures() {
  return (tree) => {
    walk(tree, (node, parent, index) => {
      if (node.type !== 'element' || node.tagName !== 'p' || !parent) return;
      const content = node.children.filter((child) => !isBlank(child));
      if (content.length !== 1) return;
      const image = content[0];
      if (image.type !== 'element' || image.tagName !== 'img') return;
      const caption = image.properties?.title;
      if (typeof caption !== 'string' || caption.trim() === '') return;

      delete image.properties.title;
      parent.children[index] = element('figure', {}, [
        image,
        element('figcaption', {}, [text(caption)]),
      ]);
      return false;
    });
  };
}
