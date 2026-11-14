import { getCollection, type CollectionEntry } from 'astro:content';

/*
 * Jedyna warstwa, przez którą strony czytają przedmioty i notatki.
 * Dziś źródłem są pliki z katalogu notatki/. Gdy pojawią się konta i notatki użytkowników,
 * wystarczy rozszerzyć te funkcje o drugie źródło (np. bazę danych), bez zmian w szablonach.
 */

export type SubjectEntry = CollectionEntry<'subjects'>;
export type NoteEntry = CollectionEntry<'notes'>;

export interface Subject {
  slug: string;
  title: string;
  fullName?: string;
  description?: string;
  url: string;
  notes: Note[];
}

export interface Note {
  slug: string;
  subjectSlug: string;
  title: string;
  description?: string;
  updated?: Date;
  url: string;
  entry: NoteEntry;
}

const collator = new Intl.Collator('pl', { numeric: true, sensitivity: 'base' });

export const subjectUrl = (subject: string) => `/przedmioty/${subject}/`;
export const noteUrl = (subject: string, note: string) => `/przedmioty/${subject}/${note}/`;

function toNote(entry: NoteEntry): Note {
  const [subjectSlug, slug] = entry.id.split('/');
  return {
    slug,
    subjectSlug,
    title: entry.data.title,
    description: entry.data.description,
    updated: entry.data.updated,
    url: noteUrl(subjectSlug, slug),
    entry,
  };
}

function compareNotes(a: NoteEntry, b: NoteEntry): number {
  const byOrder = (a.data.order ?? Infinity) - (b.data.order ?? Infinity);
  if (byOrder !== 0 && !Number.isNaN(byOrder)) return byOrder;
  // Ścieżka pliku zawiera numer z początku nazwy, więc "02-..." trafia po "01-...".
  return collator.compare(a.filePath ?? a.id, b.filePath ?? b.id);
}

export async function getSubjects(): Promise<Subject[]> {
  const [subjectEntries, noteEntries] = await Promise.all([
    getCollection('subjects'),
    getCollection('notes', ({ data }) => import.meta.env.DEV || !data.draft),
  ]);

  return subjectEntries
    .sort((a, b) => {
      const byOrder = (a.data.order ?? Infinity) - (b.data.order ?? Infinity);
      if (byOrder !== 0 && !Number.isNaN(byOrder)) return byOrder;
      return collator.compare(a.data.title, b.data.title);
    })
    .map((subject) => ({
      slug: subject.id,
      title: subject.data.title,
      fullName: subject.data.fullName,
      description: subject.data.description,
      url: subjectUrl(subject.id),
      notes: noteEntries
        .filter((note) => note.id.startsWith(`${subject.id}/`))
        .sort(compareNotes)
        .map(toNote),
    }));
}
