import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string().default(''),
    category: z.enum(['market', 'sourcing', 'finance', 'sustainability', 'processing']).default('market'),
    date: z.coerce.date(),
    cover: z.string().default('/assets/coco/about-grove.jpg'),
    readTime: z.string().default('5 min'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
