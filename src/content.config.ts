import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({ title: z.string(), description: z.string(), subject: z.string(), category: z.string(), tags: z.array(z.string()), order: z.number(), icon: z.enum(['shield','code','key','terminal','network','book']), demo: z.boolean().default(false) }),
});
export const collections = { notes };
