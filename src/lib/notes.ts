import { getCollection, type CollectionEntry } from 'astro:content';
import { isDatabaseConfigured } from './server/env';
import { listCatalogSubjects } from './server/catalog';
import { listActivePublications, type Publication } from './server/publication-notes';

/*
 * Jedyna warstwa, przez którą strony czytają przedmioty i notatki.
 * Źródła: pliki notatki/ + zaakceptowane publikacje z bazy (snapshoty).
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
  source: 'file' | 'db' | 'mixed';
}

export interface Note {
  slug: string;
  subjectSlug: string;
  title: string;
  description?: string;
  updated?: Date;
  url: string;
  /** Notatka z kolekcji plików. */
  entry?: NoteEntry;
  /** Snapshot publikacji z bazy. */
  publication?: Publication;
  authorUsername?: string;
}

const collator = new Intl.Collator('pl', { numeric: true, sensitivity: 'base' });

export const subjectUrl = (subject: string) => `/przedmioty/${subject}/`;
export const noteUrl = (subject: string, note: string) => `/przedmioty/${subject}/${note}/`;

function toFileNote(entry: NoteEntry): Note {
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

function toPublicationNote(pub: Publication): Note {
  return {
    slug: pub.slug,
    subjectSlug: pub.subject_slug,
    title: pub.title,
    description: pub.description ?? undefined,
    updated: pub.updated_at,
    url: noteUrl(pub.subject_slug, pub.slug),
    publication: pub,
    authorUsername: pub.author_username,
  };
}

function compareFileNotes(a: NoteEntry, b: NoteEntry): number {
  const byOrder = (a.data.order ?? Infinity) - (b.data.order ?? Infinity);
  if (byOrder !== 0 && !Number.isNaN(byOrder)) return byOrder;
  return collator.compare(a.filePath ?? a.id, b.filePath ?? b.id);
}

function compareNotes(a: Note, b: Note): number {
  // Pliki (z order) przed publikacjami użytkowników przy tej samej nazwie nie kolidują (osobne slugi).
  if (a.entry && b.entry) return compareFileNotes(a.entry, b.entry);
  if (a.entry && !b.entry) return -1;
  if (!a.entry && b.entry) return 1;
  const aTime = a.updated?.getTime() ?? 0;
  const bTime = b.updated?.getTime() ?? 0;
  if (aTime !== bTime) return bTime - aTime;
  return collator.compare(a.title, b.title);
}

export async function getSubjects(): Promise<Subject[]> {
  const [subjectEntries, noteEntries] = await Promise.all([
    getCollection('subjects'),
    getCollection('notes', ({ data }) => import.meta.env.DEV || !data.draft),
  ]);

  const bySlug = new Map<string, Subject>();

  for (const subject of subjectEntries.sort((a, b) => {
    const byOrder = (a.data.order ?? Infinity) - (b.data.order ?? Infinity);
    if (byOrder !== 0 && !Number.isNaN(byOrder)) return byOrder;
    return collator.compare(a.data.title, b.data.title);
  })) {
    bySlug.set(subject.id, {
      slug: subject.id,
      title: subject.data.title,
      fullName: subject.data.fullName,
      description: subject.data.description,
      url: subjectUrl(subject.id),
      notes: noteEntries
        .filter((note) => note.id.startsWith(`${subject.id}/`))
        .sort(compareFileNotes)
        .map(toFileNote),
      source: 'file',
    });
  }

  if (isDatabaseConfigured()) {
    try {
      const [catalog, publications] = await Promise.all([
        listCatalogSubjects(),
        listActivePublications(),
      ]);

      for (const subject of catalog) {
        const existing = bySlug.get(subject.slug);
        if (existing) {
          existing.source = 'mixed';
          if (!existing.fullName && subject.full_name) existing.fullName = subject.full_name;
          if (!existing.description && subject.description) {
            existing.description = subject.description;
          }
        } else {
          bySlug.set(subject.slug, {
            slug: subject.slug,
            title: subject.title,
            fullName: subject.full_name ?? undefined,
            description: subject.description ?? undefined,
            url: subjectUrl(subject.slug),
            notes: [],
            source: 'db',
          });
        }
      }

      for (const pub of publications) {
        let subject = bySlug.get(pub.subject_slug);
        if (!subject) {
          subject = {
            slug: pub.subject_slug,
            title: pub.subject_slug,
            url: subjectUrl(pub.subject_slug),
            notes: [],
            source: 'db',
          };
          bySlug.set(pub.subject_slug, subject);
        } else if (subject.source === 'file') {
          subject.source = 'mixed';
        }

        const clash = subject.notes.some((n) => n.slug === pub.slug && n.entry);
        if (clash) {
          // Nie nadpisuj notatki z pliku - publikacja z kolizją slug zostaje pominięta na liście.
          continue;
        }
        const withoutOld = subject.notes.filter(
          (n) => !(n.publication && n.publication.id === pub.id),
        );
        withoutOld.push(toPublicationNote(pub));
        subject.notes = withoutOld;
      }
    } catch (error) {
      console.error('[notes] merge publications', error);
    }
  }

  for (const subject of bySlug.values()) {
    subject.notes.sort(compareNotes);
  }

  return [...bySlug.values()].sort((a, b) => collator.compare(a.title, b.title));
}
