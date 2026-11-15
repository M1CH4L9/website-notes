import { getCollection } from 'astro:content';
import { isDatabaseConfigured } from './env';
import { listCatalogSubjects } from './catalog';

export type SubjectOption = {
  slug: string;
  title: string;
  fullName?: string;
};

/** Lista przedmiotów do wyboru w formularzu prośby (pliki + katalog DB). */
export async function listSubjectOptions(): Promise<SubjectOption[]> {
  const fileSubjects = await getCollection('subjects');
  const map = new Map<string, SubjectOption>();

  for (const s of fileSubjects) {
    map.set(s.id, {
      slug: s.id,
      title: s.data.title,
      fullName: s.data.fullName,
    });
  }

  if (isDatabaseConfigured()) {
    try {
      const catalog = await listCatalogSubjects();
      for (const s of catalog) {
        if (map.has(s.slug)) continue;
        map.set(s.slug, {
          slug: s.slug,
          title: s.title,
          fullName: s.full_name ?? undefined,
        });
      }
    } catch (error) {
      console.error('[subject-options]', error);
    }
  }

  return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, 'pl'));
}
