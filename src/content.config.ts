import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
 * Treści leżą w katalogu notatki/ w głównym katalogu repo:
 *
 *   notatki/<przedmiot>/przedmiot.yaml    opis przedmiotu
 *   notatki/<przedmiot>/<notatka>.md      notatka (także .mdx)
 *
 * Nazwa katalogu jest adresem przedmiotu, nazwa pliku adresem notatki.
 * Numer na początku nazwy pliku ("01-") ustala kolejność i nie trafia do adresu.
 */

const CONTENT_DIR = './notatki';

const stripOrderPrefix = (name: string) => name.replace(/^\d+[-_]/, '');

const subjects = defineCollection({
  loader: glob({
    base: CONTENT_DIR,
    pattern: '*/przedmiot.{yaml,yml}',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    /** Krótka nazwa, np. "BSI". */
    title: z.string(),
    /** Pełna nazwa przedmiotu. */
    fullName: z.string().optional(),
    description: z.string().optional(),
    /** Kolejność na stronie głównej. Bez niej przedmioty są sortowane po nazwie. */
    order: z.number().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({
    base: CONTENT_DIR,
    pattern: '*/*.{md,mdx}',
    generateId: ({ entry }) => {
      const [subject, file] = entry.split('/');
      return `${subject}/${stripOrderPrefix(file.replace(/\.mdx?$/, ''))}`;
    },
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    /** Data ostatniej zmiany, format RRRR-MM-DD. */
    updated: z.coerce.date().optional(),
    /** Nadpisuje kolejność wynikającą z nazwy pliku. */
    order: z.number().optional(),
    /** Szkic jest widoczny tylko lokalnie (npm run dev). */
    draft: z.boolean().default(false),
  }),
});

export const collections = { subjects, notes };
