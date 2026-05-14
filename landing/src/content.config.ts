import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    author: z.string(),
    datePublished: z.coerce.date(),
    dateModified: z.coerce.date().optional(),
    ogImage: z.string(),
  }),
});

export const collections = { posts };
