import { isoDate } from './format';

/** Bezpieczna nazwa pliku (bez ścieżek i dziwnych znaków). */
export function noteFilename(slug: string, title?: string): string {
  const raw = (slug || title || 'notatka').trim().toLowerCase();
  const cleaned = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'notatka';
}

function yamlScalar(value: string): string {
  if (/^[A-Za-z0-9 _./+-]+$/.test(value) && !/^[-?]/.test(value)) {
    return value;
  }
  return JSON.stringify(value);
}

/** Składa plik .md z frontmatterem YAML (jak w notatki/). */
export function buildNoteMarkdown(input: {
  title: string;
  description?: string | null;
  updated?: Date | string | null;
  body: string;
}): string {
  const lines = ['---', `title: ${yamlScalar(input.title)}`];
  const description = input.description?.trim();
  if (description) lines.push(`description: ${yamlScalar(description)}`);

  if (input.updated) {
    const date =
      input.updated instanceof Date ? isoDate(input.updated) : String(input.updated).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) lines.push(`updated: ${date}`);
  }

  lines.push('---', '', input.body.replace(/\s+$/, ''), '');
  return lines.join('\n');
}

export function markdownDownloadResponse(markdown: string, filename: string): Response {
  const safe = noteFilename(filename);
  return new Response(markdown, {
    status: 200,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition': `attachment; filename="${safe}.md"`,
      'cache-control': 'private, no-store',
    },
  });
}
