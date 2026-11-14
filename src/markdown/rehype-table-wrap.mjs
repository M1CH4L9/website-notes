import { element, walk } from './tree.mjs';

/** Otacza tabele przewijanym kontenerem, żeby szerokie tabele nie rozpychały strony na telefonie. */
export function rehypeTableWrap() {
  return (tree) => {
    walk(tree, (node, parent, index) => {
      if (node.type !== 'element' || node.tagName !== 'table' || !parent) return;
      parent.children[index] = element(
        'div',
        { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: 'Tabela' },
        [node],
      );
      return false;
    });
  };
}
