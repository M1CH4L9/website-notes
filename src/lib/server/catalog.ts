import { query } from './db';
import { assertSlug, slugifyTitle } from './slugs';

export type CatalogSubject = {
  slug: string;
  title: string;
  full_name: string | null;
  description: string | null;
  sort_order: number | null;
  created_at: Date;
};

export async function listCatalogSubjects(): Promise<CatalogSubject[]> {
  const { rows } = await query<CatalogSubject>(
    `SELECT * FROM catalog_subjects ORDER BY sort_order NULLS LAST, title ASC`,
  );
  return rows;
}

export async function getCatalogSubject(slug: string): Promise<CatalogSubject | null> {
  const { rows } = await query<CatalogSubject>(
    `SELECT * FROM catalog_subjects WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  return rows[0] ?? null;
}

export async function createCatalogSubject(input: {
  title: string;
  fullName?: string | null;
  description?: string | null;
  slug?: string;
  sortOrder?: number | null;
}): Promise<CatalogSubject> {
  const title = input.title.trim();
  if (!title) throw new Error('Nazwa przedmiotu jest wymagana.');
  if (title.length > 80) throw new Error('Nazwa przedmiotu jest za długa.');

  let slug = (input.slug?.trim() || slugifyTitle(title)).slice(0, 80);
  const slugErr = assertSlug(slug);
  if (slugErr) throw new Error(slugErr);

  const fullName = input.fullName?.trim() || null;
  const description = input.description?.trim() || null;
  if (fullName && fullName.length > 200) throw new Error('Pełna nazwa jest za długa.');
  if (description && description.length > 500) throw new Error('Opis przedmiotu jest za długi.');

  for (let i = 2; i < 50; i++) {
    const existing = await getCatalogSubject(slug);
    if (!existing) break;
    const suffix = `-${i}`;
    slug = `${slugifyTitle(title).slice(0, 80 - suffix.length)}${suffix}`;
  }

  const { rows } = await query<CatalogSubject>(
    `INSERT INTO catalog_subjects (slug, title, full_name, description, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [slug, title, fullName, description, input.sortOrder ?? null],
  );
  return rows[0];
}
