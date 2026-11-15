/*
 * Motywy GitHuba mają kilka kolorów, które na tle naszych bloków kodu wypadają
 * poniżej kontrastu 4.5:1 (głównie komentarze). Podmieniamy je na ciemniejsze
 * lub jaśniejsze odpowiedniki z nowszej palety GitHuba. Motywy trybu cute mają
 * własną paletę w shiki-kotek-theme.mjs i nie wymagają poprawek.
 */
const replacements = {
  dark: {
    '#6a737d': '#8b949e',
  },
  light: {
    '#6a737d': '#59636e',
    '#d73a49': '#cf222e',
    '#e36209': '#bc4c00',
    '#22863a': '#116329',
  },
};

const pattern = /--shiki-(dark|light):(#[0-9a-f]{6})\b/gi;

export const contrastTransformer = {
  name: 'notes:contrast',
  span(node) {
    const style = node.properties?.style;
    if (typeof style !== 'string') return;
    node.properties.style = style.replace(pattern, (match, theme, color) => {
      const next = replacements[theme][color.toLowerCase()];
      return next ? `--shiki-${theme}:${next}` : match;
    });
  },
};
