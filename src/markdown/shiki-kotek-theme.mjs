/*
 * Motyw podświetlania składni dla słodkiego motywu strony.
 * Kolory są dobrane tak, żeby na tle bloku kodu (--code-bg w motywie "cute")
 * każdy miał kontrast co najmniej 4.5:1.
 */

const palette = {
  foreground: '#3d2230',
  background: '#fffafc',
  comment: '#8a6475',
  keyword: '#c2255c',
  string: '#17735d',
  constant: '#ad4e12',
  function: '#7a3cc2',
  type: '#0b6a94',
  property: '#8f2f5f',
  punctuation: '#755364',
  inserted: '#17735d',
  deleted: '#c0262d',
};

export const kotekTheme = {
  name: 'kotek',
  type: 'light',
  colors: {
    'editor.foreground': palette.foreground,
    'editor.background': palette.background,
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: palette.comment, fontStyle: 'italic' },
    },
    {
      scope: [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'keyword.operator.logical.python',
        'variable.language',
        'entity.name.tag',
        'punctuation.definition.tag',
        'support.type.property-name.css',
        'markup.heading',
        'markup.heading entity.name',
        'entity.name.section',
      ],
      settings: { foreground: palette.keyword },
    },
    {
      scope: [
        'string',
        'string.quoted',
        'punctuation.definition.string',
        'string punctuation.section.embedded source',
        'markup.inline.raw',
        'markup.raw',
      ],
      settings: { foreground: palette.string },
    },
    {
      scope: [
        'constant',
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.character.escape',
        'constant.other',
        'support.constant',
        'keyword.other.unit',
        'string.regexp',
        'variable.other.constant',
        'variable.other.enummember',
      ],
      settings: { foreground: palette.constant },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call',
        'meta.function-call.generic',
        'entity.other.attribute-name',
        'meta.selector',
        'entity.other.attribute-name.class.css',
        'entity.other.attribute-name.id.css',
      ],
      settings: { foreground: palette.function },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.name.namespace',
        'entity.other.inherited-class',
        'support.class',
        'support.type',
        'storage.type.primitive',
        'storage.type.built-in',
        'keyword.type',
      ],
      settings: { foreground: palette.type },
    },
    {
      scope: [
        'variable.other.property',
        'variable.other.object.property',
        'meta.object-literal.key',
        'support.type.property-name',
        'support.type.property-name.json',
        'entity.name.tag.yaml',
        'variable.parameter',
        'variable.other.readwrite.shell',
      ],
      settings: { foreground: palette.property },
    },
    {
      scope: ['variable', 'variable.other', 'meta.embedded', 'source'],
      settings: { foreground: palette.foreground },
    },
    {
      scope: [
        'punctuation',
        'meta.brace',
        'keyword.operator',
        'keyword.operator.assignment',
        'punctuation.separator',
        'punctuation.terminator',
      ],
      settings: { foreground: palette.punctuation },
    },
    {
      scope: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted'],
      settings: { foreground: palette.inserted },
    },
    {
      scope: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted'],
      settings: { foreground: palette.deleted },
    },
    {
      scope: ['meta.diff.range', 'meta.diff.header', 'meta.separator'],
      settings: { foreground: palette.function },
    },
    { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    {
      scope: ['markup.underline.link', 'string.other.link'],
      settings: { foreground: palette.type },
    },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: palette.deleted } },
  ],
};
