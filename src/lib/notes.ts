import { getCollection, type CollectionEntry } from 'astro:content';
import { isDatabaseConfigured } from './server/env';
import { getCatalogSubject, listCatalogSubjects } from './server/catalog';
import { listActivePublications, type PublicationSummary } from './server/publication-notes';

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
  folders: SubjectFolder[];
  source: 'file' | 'db' | 'mixed';
}

export interface SubjectFolder {
  path: string;
  title: string;
  description?: string;
  url: string;
  parent: string;
  order?: number;
}

export interface Note {
  slug: string;
  subjectSlug: string;
  folder?: string;
  archive?: boolean;
  title: string;
  description?: string;
  updated?: Date;
  url: string;
  /** Notatka z kolekcji plików. */
  entry?: NoteEntry;
  /** Snapshot publikacji z bazy. */
  publication?: PublicationSummary;
  authorUsername?: string;
}

const collator = new Intl.Collator('pl', { numeric: true, sensitivity: 'base' });

export const subjectUrl = (subject: string) => `/przedmioty/${subject}/`;
export const folderUrl = (subject: string, folder: string) => `/przedmioty/${subject}/foldery/${folder}/`;
export const noteUrl = (subject: string, note: string) => `/przedmioty/${subject}/${note}/`;

function toFileNote(entry: NoteEntry): Note {
  const [subjectSlug, slug] = entry.id.split('/');
  const parts = entry.filePath?.split('/') ?? [];
  const catalog = parts.indexOf('notatki');
  const folder = catalog < 0 ? '' : parts.slice(catalog + 2, -1).join('/');
  return {
    slug,
    subjectSlug,
    title: entry.data.title,
    folder,
    archive: entry.data.archive,
    description: entry.data.description,
    updated: entry.data.updated,
    url: noteUrl(subjectSlug, slug),
    entry,
  };
}

function toPublicationNote(pub: PublicationSummary): Note {
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

async function loadFileCatalog() {
  const [subjectEntries, noteEntries, folderEntries] = await Promise.all([
    getCollection('subjects'),
    getCollection('notes', ({ data }) => import.meta.env.DEV || !data.draft),
    getCollection('folders'),
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
      folders: folderEntries.filter(folder => folder.id.startsWith(`${subject.id}/`)).map(folder => {
        const path = folder.id.slice(subject.id.length + 1);
        return { ...folder.data, path, parent: path.split('/').slice(0, -1).join('/'), url: folderUrl(subject.id, path) };
      }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || collator.compare(a.title, b.title)),
      source: 'file',
    });
  }

  return bySlug;
}

// Wdrożenie ma niezmienne pliki. W dev ponownie odczytujemy kolekcję po edycji.
let fileCatalog: ReturnType<typeof loadFileCatalog> | undefined;
function getFileCatalog() {
  if (import.meta.env.DEV) return loadFileCatalog();
  return fileCatalog ??= loadFileCatalog().catch(error => {
    fileCatalog = undefined;
    throw error;
  });
}

export async function getFileSubject(slug: string) {
  return (await getFileCatalog()).get(slug);
}

export async function getSubjects(slug?: string): Promise<Subject[]> {
  const files = await getFileCatalog();
  const bySlug = new Map<string, Subject>();
  for (const [key, subject] of files) {
    if (!slug || key === slug) bySlug.set(key, { ...subject, notes: [...subject.notes] });
  }

  if (isDatabaseConfigured()) {
    try {
      const [catalog, publications] = await Promise.all([
        slug ? getCatalogSubject(slug).then(row => row ? [row] : []) : listCatalogSubjects(),
        listActivePublications(slug),
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
            folders: [],
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
            folders: [],
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
        subject.notes.push(toPublicationNote(pub));
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

export function folderBreadcrumbs(subject: Subject, path: string) {
  const segments = path.split('/').filter(Boolean);
  return segments.flatMap((_, index) => {
    const folder = subject.folders.find(item => item.path === segments.slice(0, index + 1).join('/'));
    return folder ? [{ label: folder.title, href: folder.url }] : [];
  });
}
