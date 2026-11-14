import { element, hasClass, text, walk } from './tree.mjs';

const LANGUAGE_LABELS = {
  plaintext: 'Tekst',
  text: 'Tekst',
  txt: 'Tekst',
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  sh: 'Shell',
  shell: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  cs: 'C#',
  csharp: 'C#',
  java: 'Java',
  kotlin: 'Kotlin',
  go: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  php: 'PHP',
  rb: 'Ruby',
  ruby: 'Ruby',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  xml: 'XML',
  md: 'Markdown',
  markdown: 'Markdown',
  mdx: 'MDX',
  diff: 'Diff',
  docker: 'Dockerfile',
  dockerfile: 'Dockerfile',
  nginx: 'Nginx',
  asm: 'Asembler',
  http: 'HTTP',
  ini: 'INI',
};

const TITLE = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|(\S+))/;

/**
 * Transformer Shiki: przenosi tytuł z nagłówka bloku (```js title="plik.js") do atrybutu,
 * który odczytuje rehypeCodeFrame.
 */
export const codeTitleTransformer = {
  name: 'code-title',
  pre(node) {
    const match = TITLE.exec(this.options.meta?.__raw ?? '');
    const title = match?.[1] ?? match?.[2] ?? match?.[3];
    if (title) node.properties.dataTitle = title;
  },
};

/**
 * Otacza podświetlone bloki kodu ramką z nagłówkiem (język lub tytuł) i przyciskiem kopiowania.
 * Obsługa kliknięcia jest w src/components/CodeCopyScript.astro.
 */
export function rehypeCodeFrame() {
  return (tree) => {
    walk(tree, (node, parent, index) => {
      if (node.type !== 'element' || node.tagName !== 'pre' || !parent) return;
      if (!hasClass(node, 'astro-code')) return;

      const language = String(node.properties.dataLanguage ?? 'plaintext');
      const title = node.properties.dataTitle;
      delete node.properties.dataTitle;
      // Przewijany blok musi być osiągalny z klawiatury.
      node.properties.tabIndex = 0;

      const label = title
        ? element('span', { className: ['code-title'] }, [text(String(title))])
        : element('span', { className: ['code-lang'] }, [
            text(LANGUAGE_LABELS[language.toLowerCase()] ?? language),
          ]);

      const button = element(
        'button',
        { type: 'button', className: ['code-copy'], dataCodeCopy: '' },
        [element('span', { className: ['code-copy-label'] }, [text('Kopiuj')])],
      );

      parent.children[index] = element('div', { className: ['code-block'] }, [
        element('div', { className: ['code-header'] }, [label, button]),
        node,
      ]);
      return false;
    });
  };
}
