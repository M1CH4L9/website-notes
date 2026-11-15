export function slugifyTitle(title: string): string {
  const map: Record<string, string> = {
    ą: 'a',
    ć: 'c',
    ę: 'e',
    ł: 'l',
    ń: 'n',
    ó: 'o',
    ś: 's',
    ź: 'z',
    ż: 'z',
  };
  const base = title
    .trim()
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'notatka';
}

export function assertSlug(slug: string): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return 'Adres notatki: małe litery, cyfry i myślniki.';
  }
  if (slug.length > 80) return 'Adres notatki jest za długi.';
  return null;
}
