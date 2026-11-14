import { walk } from './tree.mjs';

const KINDS = {
  NOTE: { className: 'note', title: 'Uwaga' },
  TIP: { className: 'tip', title: 'Wskazówka' },
  IMPORTANT: { className: 'important', title: 'Ważne' },
  WARNING: { className: 'warning', title: 'Ostrzeżenie' },
  CAUTION: { className: 'caution', title: 'Niebezpieczeństwo' },
};

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*([^\n]*)(?:\n|$)/i;

/**
 * Bloki w składni GitHuba:
 *
 *   > [!WARNING]
 *   > Treść ostrzeżenia.
 *
 * Tekst w tej samej linii co znacznik zastępuje domyślny tytuł: `> [!TIP] Własny tytuł`.
 */
export function remarkAlerts() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'blockquote') return;
      const first = node.children[0];
      if (first?.type !== 'paragraph') return;
      const lead = first.children[0];
      if (lead?.type !== 'text') return;
      const match = MARKER.exec(lead.value);
      if (!match) return;

      const kind = KINDS[match[1].toUpperCase()];
      const title = match[2].trim() || kind.title;

      lead.value = lead.value.slice(match[0].length);
      if (lead.value === '') {
        first.children.shift();
        if (first.children[0]?.type === 'break') first.children.shift();
      }
      if (first.children.length === 0) node.children.shift();

      node.children.unshift({
        type: 'paragraph',
        data: { hProperties: { className: ['callout-title'] } },
        children: [{ type: 'text', value: title }],
      });
      node.data = {
        ...node.data,
        hName: 'div',
        hProperties: { className: ['callout', `callout-${kind.className}`], role: 'note' },
      };
    });
  };
}
